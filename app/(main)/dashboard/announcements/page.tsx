import { safeGetServerSession } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const IMPERSONATE_COOKIE = "impersonateAccountId";

export default async function DashboardAnnouncementsPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login?next=/dashboard/announcements");

  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  if (!acct) redirect("/login?error=no_account&next=/dashboard/announcements");
  if (String(acct.status || "") === "disabled") redirect("/login?error=disabled&next=/dashboard/announcements");

  const canImpersonate = Boolean(acct && acct.type === "admin" && hasAccountCapability(acct, "users.impersonate.read_only"));
  const cookieStore = await cookies();
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value || "";

  let effectiveAcct: any = acct;
  let isImpersonating = false;

  if (impersonateId && canImpersonate) {
    const targetRes = await sanityFetch({
      query: `*[_type == "account" && _id == $id][0]{_id, email, name, type, status, capabilities, revokedCapabilities}`,
      params: { id: impersonateId },
      perspective: "published",
    });
    const target = (targetRes as any)?.data as any;
    if (target?._id && String(target.status || "") !== "disabled") {
      effectiveAcct = target;
      isImpersonating = true;
    }
  }

  if (!hasAccountCapability(effectiveAcct, "system.announcements.view")) redirect("/dashboard");

  const isClient = String(effectiveAcct.type || "") === "client";
  const allowedAudiences = isClient ? ["all", "clients"] : ["all", "internal"];

  const canWrite = Boolean(process.env.SANITY_API_WRITE_TOKEN) && !isImpersonating;
  const canCreate = hasAccountCapability(effectiveAcct, "system.announcements.create");

  async function publishAnnouncement(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
    if (!acct || String(acct.status || "") === "disabled") return;
    if (!hasAccountCapability(acct, "system.announcements.create")) return;

    const title = String(formData.get("title") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const audience = String(formData.get("audience") || "all").trim();
    if (!title || !message) return;
    if (!["all", "internal", "clients"].includes(audience)) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const now = new Date().toISOString();
    await writeClient.create({
      _type: "announcement",
      title,
      message,
      audience,
      status: "published",
      createdAt: now,
      publishedAt: now,
      createdBy: { _type: "reference", _ref: String(acct._id) },
    });

    revalidatePath("/dashboard/announcements");
    redirect("/dashboard/announcements");
  }

  const { data } = await sanityFetch({
    query: `*[_type == "announcement" && status == "published" && audience in $audiences] | order(publishedAt desc, _createdAt desc)[0..19]{
      _id, title, message, audience, publishedAt, createdAt,
      "createdByName": createdBy->name,
      "createdByEmail": createdBy->email
    }`,
    params: { audiences: allowedAudiences },
  });

  const announcements = (data ?? []) as any[];

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Announcements</h1>
        <div className="text-sm text-muted-foreground">{String(effectiveAcct.email || "")}</div>
      </div>

      {canCreate ? (
        <div className="mt-6 rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Publish</div>
          <form action={publishAnnouncement} className="mt-3 grid gap-3">
            <input
              name="title"
              placeholder="Title"
              className="rounded-md border px-3 py-2 text-sm"
              disabled={!canWrite}
            />
            <textarea
              name="message"
              placeholder="Message"
              className="min-h-[110px] rounded-md border px-3 py-2 text-sm"
              disabled={!canWrite}
            />
            <select name="audience" className="rounded-md border px-3 py-2 text-sm" defaultValue="all" disabled={!canWrite}>
              <option value="all">All users</option>
              <option value="internal">Internal only</option>
              <option value="clients">Clients only</option>
            </select>
            <button className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
              Publish
            </button>
            {!canWrite ? (
              <div className="text-sm text-red-700">
                {isImpersonating
                  ? "Impersonation mode: publishing is read-only."
                  : "Missing SANITY_API_WRITE_TOKEN: publishing is disabled."}
              </div>
            ) : null}
          </form>
        </div>
      ) : null}

      <div className="mt-8 space-y-3">
        {announcements.map((a) => (
          <div key={String(a._id)} className="rounded-xl border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-lg font-medium">{String(a.title || "")}</div>
                <div className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{String(a.message || "")}</div>
              </div>
              <div className="text-xs text-muted-foreground shrink-0">
                {String(a.publishedAt || "") ? new Date(String(a.publishedAt)).toLocaleString() : ""}
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              {String(a.createdByName || a.createdByEmail || "") ? `By ${String(a.createdByName || a.createdByEmail)}` : ""}
            </div>
          </div>
        ))}
        {announcements.length === 0 ? <div className="text-sm text-muted-foreground">No announcements yet.</div> : null}
      </div>
    </div>
  );
}
