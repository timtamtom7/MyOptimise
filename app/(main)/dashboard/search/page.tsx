import { hasAccountCapability, safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const IMPERSONATE_COOKIE = "impersonateAccountId";

function normalizeQuery(input: unknown): string {
  return String(input || "").trim();
}

export default async function DashboardSearchPage(props: { searchParams?: Promise<{ q?: string }> }) {
  const session = await safeGetServerSession();
  if (!session) redirect("/login?next=/dashboard/search");

  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  if (!acct) redirect("/login?error=no_account&next=/dashboard/search");
  if (String(acct.status || "") === "disabled") redirect("/login?error=disabled&next=/dashboard/search");

  const canImpersonate = Boolean(acct && acct.type === "admin" && hasAccountCapability(acct, "users.impersonate.read_only"));
  const cookieStore = await cookies();
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value || "";

  let effectiveAcct: any = acct;
  let effectiveType = String(acct?.type || (session as any)?.type || "");

  if (impersonateId && canImpersonate) {
    const targetRes = await sanityFetch({
      query: `*[_type == "account" && _id == $id][0]{_id, email, name, type, status, capabilities, revokedCapabilities}`,
      params: { id: impersonateId },
      perspective: "published",
    });
    const target = (targetRes as any)?.data as any;
    if (target?._id && String(target.status || "") !== "disabled") {
      effectiveAcct = target;
      effectiveType = String(target.type || "");
    }
  }

  if (!hasAccountCapability(effectiveAcct, "system.search.global")) redirect("/dashboard");

  const sp = (await props.searchParams) || {};
  const q = normalizeQuery(sp.q);
  const isClient = effectiveType === "client";
  const isEmployee = effectiveType === "employee";
  const isManager = effectiveType === "manager";
  const isAdmin = effectiveType === "admin";

  const emailLower = String(effectiveAcct.email || "").toLowerCase();
  const acctId = String(effectiveAcct._id || "");

  const safeQuery = q.length > 100 ? q.slice(0, 100) : q;
  const matchQuery = safeQuery ? `${safeQuery}*` : "";

  const [workItemsRes, clientRequestsRes, threadsRes, signupsRes, sponsorshipsRes, accountsRes] = await Promise.all([
    sanityFetch({
      query: isClient
        ? `[]`
        : isEmployee
          ? `*[_type == "workItem" && (!defined(isTemplate) || isTemplate != true) && assignedTo->email != null && lower(assignedTo->email) == $email && (title match $q || description match $q)]
              | order(coalesce(dueDate, createdAt) asc)[0..19]{_id, title, status, priority, dueDate, createdAt}`
          : isManager
            ? `*[_type == "workItem" && (!defined(isTemplate) || isTemplate != true) && (title match $q || description match $q)]
                | order(coalesce(dueDate, createdAt) asc)[0..19]{_id, title, status, priority, dueDate, createdAt}`
            : isAdmin
              ? `*[_type == "workItem" && (!defined(isTemplate) || isTemplate != true) && (title match $q || description match $q)]
                  | order(coalesce(dueDate, createdAt) asc)[0..19]{_id, title, status, priority, dueDate, createdAt}`
              : `[]`,
      params: { q: matchQuery, email: emailLower },
    }),
    sanityFetch({
      query: isClient
        ? `*[_type == "clientRequest" && clientEmail != null && lower(clientEmail) == $email && (subject match $q || message match $q)]
            | order(createdAt desc)[0..19]{_id, subject, status, createdAt}`
        : isManager || isAdmin
          ? `*[_type == "clientRequest" && (subject match $q || message match $q)]
              | order(createdAt desc)[0..19]{_id, subject, status, createdAt, clientEmail}`
          : `[]`,
      params: { q: matchQuery, email: emailLower },
    }),
    sanityFetch({
      query: isClient
        ? `*[_type == "messageThread" && visibility == "client" && $acctId in participants[]._ref && (title match $q)]
            | order(coalesce(updatedAt, createdAt) desc)[0..19]{_id, title, type, visibility, createdAt, updatedAt}`
        : `*[_type == "messageThread" && $acctId in participants[]._ref && (title match $q)]
            | order(coalesce(updatedAt, createdAt) desc)[0..19]{_id, title, type, visibility, createdAt, updatedAt}`,
      params: { q: matchQuery, acctId },
    }),
    sanityFetch({
      query: isAdmin
        ? `*[_type == "signup" && (name match $q || email match $q)] | order(createdAt desc)[0..19]{_id, name, email, status, createdAt}`
        : isManager
          ? `*[_type == "signup" && status == "received" && (name match $q || email match $q)] | order(createdAt desc)[0..19]{_id, name, email, status, createdAt}`
          : `[]`,
      params: { q: matchQuery },
    }),
    sanityFetch({
      query: isAdmin
        ? `*[_type == "sponsorship" && (businessName match $q || contactEmail match $q)] | order(_createdAt desc)[0..19]{_id, businessName, contactEmail, status, _createdAt}`
        : isManager
          ? `*[_type == "sponsorship" && status == "submitted" && (businessName match $q || contactEmail match $q)] | order(_createdAt desc)[0..19]{_id, businessName, contactEmail, status, _createdAt}`
          : `[]`,
      params: { q: matchQuery },
    }),
    sanityFetch({
      query: isAdmin
        ? `*[_type == "account" && (email match $q || name match $q)] | order(_createdAt desc)[0..19]{_id, email, name, type, status}`
        : `[]`,
      params: { q: matchQuery },
    }),
  ]);

  const workItems = ((workItemsRes as any)?.data ?? []) as any[];
  const clientRequests = ((clientRequestsRes as any)?.data ?? []) as any[];
  const threads = ((threadsRes as any)?.data ?? []) as any[];
  const signups = ((signupsRes as any)?.data ?? []) as any[];
  const sponsorships = ((sponsorshipsRes as any)?.data ?? []) as any[];
  const accounts = ((accountsRes as any)?.data ?? []) as any[];

  const threadBase =
    isClient ? "/dashboard/client/threads" : isEmployee ? "/dashboard/employee/threads" : isManager ? "/dashboard/manager/threads" : "/dashboard/admin/threads";

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Search</h1>
        <div className="text-sm text-muted-foreground">{String(effectiveAcct.email || "")}</div>
      </div>

      <form className="mt-6 flex gap-2" action="/dashboard/search" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search…"
          className="flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <button className="rounded-md border px-3 py-2 text-sm">Search</button>
      </form>

      {!q ? <div className="mt-6 text-sm text-muted-foreground">Enter a search term.</div> : null}

      {q ? (
        <div className="mt-8 grid gap-6">
          <div className="rounded-xl border bg-card p-5">
            <div className="text-lg font-medium">Threads</div>
            <div className="mt-3 space-y-2">
              {threads.map((t) => (
                <a key={String(t._id)} href={`${threadBase}/${String(t._id)}`} className="block rounded-md border px-3 py-2">
                  <div className="font-medium">{String(t.title || "Thread")}</div>
                  <div className="text-xs text-muted-foreground">
                    {String(t.type || "")} • {String(t.visibility || "")}
                  </div>
                </a>
              ))}
              {threads.length === 0 ? <div className="text-sm text-muted-foreground">No threads found.</div> : null}
            </div>
          </div>

          {!isClient ? (
            <div className="rounded-xl border bg-card p-5">
              <div className="text-lg font-medium">Work items</div>
              <div className="mt-3 space-y-2">
                {workItems.map((w) => (
                  <div key={String(w._id)} className="rounded-md border px-3 py-2">
                    <div className="font-medium">{String(w.title || "")}</div>
                    <div className="text-xs text-muted-foreground">{String(w.status || "")}</div>
                    <div className="text-xs text-muted-foreground break-all">{String(w._id || "")}</div>
                  </div>
                ))}
                {workItems.length === 0 ? <div className="text-sm text-muted-foreground">No work items found.</div> : null}
              </div>
            </div>
          ) : null}

          {clientRequests.length > 0 || isClient || isManager || isAdmin ? (
            <div className="rounded-xl border bg-card p-5">
              <div className="text-lg font-medium">Client requests</div>
              <div className="mt-3 space-y-2">
                {clientRequests.map((r) => (
                  <div key={String(r._id)} className="rounded-md border px-3 py-2">
                    <div className="font-medium">{String(r.subject || "")}</div>
                    <div className="text-xs text-muted-foreground">{String(r.status || "")}</div>
                    {r.clientEmail ? <div className="text-xs text-muted-foreground">{String(r.clientEmail || "")}</div> : null}
                    <div className="text-xs text-muted-foreground break-all">{String(r._id || "")}</div>
                  </div>
                ))}
                {clientRequests.length === 0 ? <div className="text-sm text-muted-foreground">No client requests found.</div> : null}
              </div>
            </div>
          ) : null}

          {isAdmin || isManager ? (
            <div className="rounded-xl border bg-card p-5">
              <div className="text-lg font-medium">Signups</div>
              <div className="mt-3 space-y-2">
                {signups.map((s) => (
                  <div key={String(s._id)} className="rounded-md border px-3 py-2">
                    <div className="font-medium">{String(s.name || s.email || "")}</div>
                    <div className="text-xs text-muted-foreground">{String(s.email || "")}</div>
                    <div className="text-xs text-muted-foreground">{String(s.status || "")}</div>
                    <div className="text-xs text-muted-foreground break-all">{String(s._id || "")}</div>
                  </div>
                ))}
                {signups.length === 0 ? <div className="text-sm text-muted-foreground">No signups found.</div> : null}
              </div>
            </div>
          ) : null}

          {isAdmin || isManager ? (
            <div className="rounded-xl border bg-card p-5">
              <div className="text-lg font-medium">Sponsorships</div>
              <div className="mt-3 space-y-2">
                {sponsorships.map((s) => (
                  <div key={String(s._id)} className="rounded-md border px-3 py-2">
                    <div className="font-medium">{String(s.businessName || s.contactEmail || "")}</div>
                    <div className="text-xs text-muted-foreground">{String(s.contactEmail || "")}</div>
                    <div className="text-xs text-muted-foreground">{String(s.status || "")}</div>
                    <div className="text-xs text-muted-foreground break-all">{String(s._id || "")}</div>
                  </div>
                ))}
                {sponsorships.length === 0 ? <div className="text-sm text-muted-foreground">No sponsorships found.</div> : null}
              </div>
            </div>
          ) : null}

          {isAdmin ? (
            <div className="rounded-xl border bg-card p-5">
              <div className="text-lg font-medium">Accounts</div>
              <div className="mt-3 space-y-2">
                {accounts.map((a) => (
                  <div key={String(a._id)} className="rounded-md border px-3 py-2">
                    <div className="font-medium">{String(a.email || "")}</div>
                    <div className="text-xs text-muted-foreground">
                      {String(a.type || "")} • {String(a.status || "")}
                    </div>
                    <div className="text-xs text-muted-foreground break-all">{String(a._id || "")}</div>
                  </div>
                ))}
                {accounts.length === 0 ? <div className="text-sm text-muted-foreground">No accounts found.</div> : null}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
