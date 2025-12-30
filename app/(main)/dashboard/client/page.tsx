import { hasAccountCapability, safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const IMPERSONATE_COOKIE = "impersonateAccountId";

export default async function ClientDashboardPage() {
  const session = await safeGetServerSession();
  if (!session) {
    redirect("/login?next=/dashboard/client");
  }
  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  const type = String(acct?.type || (session as any)?.type || "");
  if (!type) {
    redirect("/login?error=no_account&next=/dashboard/client");
  }
  if (String((acct as any)?.status || "") === "disabled") {
    redirect("/login?error=disabled&next=/dashboard/client");
  }

  const canImpersonate = Boolean(acct && acct.type === "admin" && hasAccountCapability(acct, "users.impersonate.read_only"));
  const cookieStore = await cookies();
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value || "";

  let effectiveAcct: any = acct;
  let effectiveType = type;
  let isImpersonating = false;

  if (impersonateId && canImpersonate) {
    const targetRes = await sanityFetch({
      query: `*[_type == "account" && _id == $id][0]{_id, email, name, type, status}`,
      params: { id: impersonateId },
      perspective: "published",
    });
    const target = (targetRes as any)?.data as any;
    if (target?._id && String(target.status || "") !== "disabled") {
      effectiveAcct = target;
      effectiveType = String(target.type || "");
      isImpersonating = true;
    }
  }

  if (effectiveType !== "client") {
    redirect("/dashboard");
  }

  const name = String((session as any)?.user?.name || "");
  const emailLower = String(effectiveAcct?.email || email || "").toLowerCase();
  const canWrite = Boolean(process.env.SANITY_API_WRITE_TOKEN) && !isImpersonating;
  const canViewServices = hasAccountCapability(effectiveAcct, "client.services.view");
  const canToggleServices = hasAccountCapability(effectiveAcct, "client.services.toggle");
  const canRequestServices = hasAccountCapability(effectiveAcct, "client.services.request_new");
  const acctId = String(effectiveAcct?._id || "");

  async function submitClientRequest(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "client") return;
    if (!hasAccountCapability(acct, "support.ticket.create")) return;

    const organizationId = String(formData.get("organizationId") || "").trim();
    const subject = String(formData.get("subject") || "").trim();
    const message = String(formData.get("message") || "").trim();
    if (!subject || !message) return;
    const attachment = formData.get("attachment");

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    let uploadedAssetId: string | null = null;
    if (attachment && typeof attachment !== "string") {
      const file = attachment as File;
      if (file.size > 0) {
        const asset = await writeClient.assets.upload("file", file, { filename: file.name });
        uploadedAssetId = String(asset?._id || "");
      }
    }

    let organizationRef: { _type: "reference"; _ref: string } | undefined;
    if (organizationId) {
      const org = await writeClient.fetch(
        `*[_type == "organization" && _id == $id && ((contactEmail != null && lower(contactEmail) == $email) || clientAccount._ref == $acctId)][0]{_id}`,
        { id: organizationId, email: email.toLowerCase(), acctId: String(acct._id) },
      );
      if (org?._id) {
        organizationRef = { _type: "reference", _ref: String(org._id) };
      }
    }

    await writeClient.create({
      _type: "clientRequest",
      subject,
      message,
      clientEmail: email.toLowerCase(),
      clientAccount: { _type: "reference", _ref: String(acct._id) },
      ...(organizationRef ? { organization: organizationRef } : {}),
      status: "submitted",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          _type: "clientRequestMessage",
          author: { _type: "reference", _ref: String(acct._id) },
          visibility: "client",
          message,
          createdAt: new Date().toISOString(),
          ...(uploadedAssetId
            ? { attachments: [{ _type: "file", asset: { _type: "reference", _ref: uploadedAssetId } }] }
            : {}),
        },
      ],
    });

    revalidatePath("/dashboard/client");
  }

  async function addClientRequestMessage(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "client") return;
    if (!hasAccountCapability(acct, "support.threads.participate")) return;

    const id = String(formData.get("id") || "").trim();
    const message = String(formData.get("message") || "").trim();
    if (!id || !message) return;
    const attachment = formData.get("attachment");

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const canUpdate = await writeClient.fetch(
      `*[_type == "clientRequest" && _id == $id && clientEmail != null && lower(clientEmail) == $email][0]{_id}`,
      { id, email: email.toLowerCase() },
    );
    if (!canUpdate?._id) return;

    let uploadedAssetId: string | null = null;
    if (attachment && typeof attachment !== "string") {
      const file = attachment as File;
      if (file.size > 0) {
        const asset = await writeClient.assets.upload("file", file, { filename: file.name });
        uploadedAssetId = String(asset?._id || "");
      }
    }

    await writeClient
      .patch(id)
      .set({ updatedAt: new Date().toISOString() })
      .setIfMissing({ messages: [] })
      .append("messages", [
        {
          _type: "clientRequestMessage",
          author: { _type: "reference", _ref: String(acct._id) },
          visibility: "client",
          message,
          createdAt: new Date().toISOString(),
          ...(uploadedAssetId
            ? { attachments: [{ _type: "file", asset: { _type: "reference", _ref: uploadedAssetId } }] }
            : {}),
        },
      ])
      .commit();

    revalidatePath("/dashboard/client");
  }

  async function createOrOpenSupportThread(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "client") return;
    if (!hasAccountCapability(acct, "support.threads.participate")) return;

    const recipientId = String(formData.get("recipientId") || "").trim();
    if (!recipientId) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const recipient = await writeClient.fetch(
      `*[_type == "account" && _id == $id][0]{_id, type, status}`,
      { id: recipientId },
    );
    if (!recipient?._id) return;
    if (String(recipient.status || "") === "disabled") return;
    if (!["admin", "manager"].includes(String(recipient.type || ""))) return;

    const existing = await writeClient.fetch(
      `*[_type == "messageThread" && type in ["support","dm"] && visibility == "client" && count(participants) == 2 && $a in participants[]._ref && $b in participants[]._ref][0]{_id}`,
      { a: String(acct._id), b: recipientId },
    );
    if (existing?._id) {
      revalidatePath("/dashboard/client");
      redirect(`/dashboard/client/threads/${String(existing._id)}`);
    }

    const created = await writeClient.create({
      _type: "messageThread",
      title: "Support",
      type: "support",
      visibility: "client",
      participants: [
        { _type: "reference", _ref: String(acct._id) },
        { _type: "reference", _ref: recipientId },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    });

    revalidatePath("/dashboard/client");
    redirect(`/dashboard/client/threads/${String(created?._id || "")}`);
  }

  async function setClientServiceEnabled(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "client") return;
    if (!hasAccountCapability(acct, "client.services.toggle")) return;

    const id = String(formData.get("id") || "").trim();
    const enabled = String(formData.get("enabled") || "") === "on";
    if (!id) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const svc = await writeClient.fetch(
      `*[_type == "clientService" && _id == $id && clientCanToggle == true && ((organization->contactEmail != null && lower(organization->contactEmail) == $email) || organization->clientAccount._ref == $acctId)][0]{_id}`,
      { id, email: email.toLowerCase(), acctId: String(acct._id) },
    );
    if (!svc?._id) return;

    await writeClient
      .patch(id)
      .set({
        clientEnabled: enabled,
        updatedAt: new Date().toISOString(),
      })
      .commit();

    revalidatePath("/dashboard/client");
  }

  async function submitServiceRequest(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "client") return;
    if (!hasAccountCapability(acct, "client.services.request_new")) return;

    const organizationId = String(formData.get("organizationId") || "").trim();
    const requestedServiceType = String(formData.get("requestedServiceType") || "other").trim();
    const details = String(formData.get("details") || "").trim();
    const attachment = formData.get("attachment");
    if (!organizationId) return;
    if (!["instagram", "facebook", "email", "website", "ads", "seo", "other"].includes(requestedServiceType)) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const org = await writeClient.fetch(
      `*[_type == "organization" && _id == $id && ((contactEmail != null && lower(contactEmail) == $email) || clientAccount._ref == $acctId)][0]{_id}`,
      { id: organizationId, email: email.toLowerCase(), acctId: String(acct._id) },
    );
    if (!org?._id) return;

    let uploadedAssetId: string | null = null;
    if (attachment && typeof attachment !== "string") {
      const file = attachment as File;
      if (file.size > 0) {
        const asset = await writeClient.assets.upload("file", file, { filename: file.name });
        uploadedAssetId = String(asset?._id || "");
      }
    }

    const now = new Date().toISOString();
    await writeClient.create({
      _type: "serviceRequest",
      organization: { _type: "reference", _ref: organizationId },
      clientAccount: { _type: "reference", _ref: String(acct._id) },
      requestedServiceType,
      details: details || undefined,
      status: "submitted",
      createdAt: now,
      updatedAt: now,
      ...(uploadedAssetId ? { attachments: [{ _type: "file", asset: { _type: "reference", _ref: uploadedAssetId } }] } : {}),
    });

    revalidatePath("/dashboard/client");
  }

  const [
    myRequestsRes,
    supportStaffRes,
    myThreadsRes,
    clientWorkItemsRes,
    organizationsRes,
    clientServicesRes,
    myServiceRequestsRes,
  ] = await Promise.all([
    sanityFetch({
      query: `*[_type == "clientRequest" && clientEmail != null && lower(clientEmail) == $email] | order(createdAt desc)[0..9]{
        _id, subject, status, createdAt, response,
        statusHistory[]{fromStatus, toStatus, changedAt},
        messages[visibility == "client"]{
          message, createdAt, visibility,
          author->{name, email},
          attachments[]{asset->{url, originalFilename}}
        }
      }`,
      params: { email: emailLower },
    }),
    sanityFetch({
      query: `*[_type == "account" && status != "disabled" && type in ["admin","manager"]] | order(type asc, name asc, email asc){
        _id, name, email, type
      }`,
    }),
    sanityFetch({
      query: `*[_type == "messageThread" && visibility == "client" && $acctId in participants[]._ref] | order(coalesce(updatedAt, createdAt) desc)[0..9]{
        _id, title, type, visibility, createdAt, updatedAt,
        "readStates": readStates[]{user, lastReadAt},
        "messageCount": count(messages[visibility == "client"]),
        "recentMessages": messages[visibility == "client"][-3..-1]{message, createdAt, author->{name, email}, attachments[]{asset->{url, originalFilename}}},
        "lastMessage": messages[visibility == "client"][-1]{message, createdAt, author->{name, email}, attachments[]{asset->{url, originalFilename}}},
        "participants": participants[]->{_id, name, email, type}
      }`,
      params: { acctId: String(effectiveAcct?._id || "") },
    }),
    sanityFetch({
      query: `*[_type == "workItem" && isTemplate != true && visibility == "client" && ((relatedOrganization->contactEmail != null && lower(relatedOrganization->contactEmail) == $email) || relatedOrganization->clientAccount._ref == $acctId)] | order(coalesce(dueDate, createdAt) asc)[0..19]{
        _id, title, description, status, priority, dueDate, createdAt,
        "commentsCount": count(comments),
        attachments[]{asset->{url, originalFilename}}
      }`,
      params: { email: emailLower, acctId },
    }),
    sanityFetch({
      query: `*[_type == "organization" && ((contactEmail != null && lower(contactEmail) == $email) || clientAccount._ref == $acctId)] | order(name asc){_id, name, contactEmail}`,
      params: { email: emailLower, acctId },
    }),
    canViewServices
      ? sanityFetch({
          query: `*[_type == "clientService" && ((organization->contactEmail != null && lower(organization->contactEmail) == $email) || organization->clientAccount._ref == $acctId)] | order(coalesce(updatedAt, createdAt) desc)[0..49]{
            _id, title, serviceType, status, statusNote, clientCanToggle, clientEnabled, createdAt, updatedAt,
            organization->{_id, name, contactEmail}
          }`,
          params: { email: emailLower, acctId },
        })
      : Promise.resolve({ data: [] }),
    sanityFetch({
      query: `*[_type == "serviceRequest" && ((organization->contactEmail != null && lower(organization->contactEmail) == $email) || organization->clientAccount._ref == $acctId)] | order(createdAt desc)[0..19]{
        _id, status, requestedServiceType, details, resolutionNote, createdAt, updatedAt,
        organization->{_id, name, contactEmail},
        attachments[]{asset->{url, originalFilename}}
      }`,
      params: { email: emailLower, acctId },
    }),
  ]);

  const myRequests = ((myRequestsRes as any)?.data ?? []) as any[];
  const supportStaff = ((supportStaffRes as any)?.data ?? []) as any[];
  const myThreads = ((myThreadsRes as any)?.data ?? []) as any[];
  const clientWorkItems = ((clientWorkItemsRes as any)?.data ?? []) as any[];
  const organizations = ((organizationsRes as any)?.data ?? []) as any[];
  const clientServices = ((clientServicesRes as any)?.data ?? []) as any[];
  const myServiceRequests = ((myServiceRequestsRes as any)?.data ?? []) as any[];

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Client Dashboard</h1>
        <div className="text-sm text-muted-foreground">Welcome{name ? `, ${name}` : ""}</div>
      </div>

      {!canWrite ? (
        <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {isImpersonating ? "Impersonation mode: actions are read-only." : "Missing SANITY_API_WRITE_TOKEN: messaging updates are disabled."}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Support</div>
          <div className="mt-2 text-2xl font-medium">Submit a request</div>
          <form action={submitClientRequest} className="mt-4 space-y-3" encType="multipart/form-data">
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Organization</div>
              <select
                name="organizationId"
                defaultValue={String(organizations?.[0]?._id || "")}
                className="w-full rounded-md border px-3 py-2 text-sm"
                disabled={!canWrite || !organizations.length}
              >
                {(organizations ?? []).map((o: any) => (
                  <option key={String(o._id)} value={String(o._id)}>
                    {String(o.name || o.contactEmail || o._id)}
                  </option>
                ))}
              </select>
              {!organizations.length ? <div className="text-xs text-muted-foreground">No organization is linked to your email.</div> : null}
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Subject</div>
              <input
                name="subject"
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="What do you need help with?"
                required
                disabled={!organizations.length}
              />
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Message</div>
              <textarea
                name="message"
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Share details so we can help faster."
                rows={6}
                required
                disabled={!organizations.length}
              />
            </div>
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Attachment (optional)</div>
              <input name="attachment" type="file" className="text-sm" />
            </div>
            <button className="rounded-md border px-4 py-2 text-sm" disabled={!canWrite || !organizations.length}>
              Send
            </button>
          </form>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Requests</div>
          <div className="mt-2 text-2xl font-medium">Your latest</div>
          <div className="mt-4 space-y-3">
            {(myRequests ?? []).map((r: any) => (
              <div key={r._id} className="rounded-lg border px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">{r.subject}</div>
                  <div className="text-xs text-muted-foreground">{String(r.status || "")}</div>
                </div>
                {Array.isArray(r.statusHistory) && r.statusHistory.length ? (
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {r.statusHistory.slice(-4).map((h: any, idx: number) => (
                      <div key={idx}>
                        {String(h.toStatus || "")}
                        {h.changedAt ? ` • ${String(h.changedAt)}` : ""}
                      </div>
                    ))}
                  </div>
                ) : null}
                {Array.isArray(r.messages) && r.messages.length ? (
                  <div className="mt-3 space-y-2">
                    {r.messages
                      .filter((m: any) => String(m.visibility || "client") === "client")
                      .slice(-4)
                      .map((m: any, idx: number) => (
                        <div key={idx} className="rounded-md border px-3 py-2">
                          <div className="text-xs text-muted-foreground">
                            {String(m.author?.name || m.author?.email || "Support")} • {String(m.createdAt || "")}
                          </div>
                          <div className="mt-1 text-sm">{String(m.message || "")}</div>
                          {Array.isArray(m.attachments) && m.attachments.length ? (
                            <div className="mt-2 space-y-1">
                              {m.attachments.map((a: any, i: number) => (
                                <div key={i} className="text-sm">
                                  <a className="underline" href={String(a.asset?.url || "#")} target="_blank" rel="noreferrer">
                                    {String(a.asset?.originalFilename || "Attachment")}
                                  </a>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                  </div>
                ) : r.response ? (
                  <div className="mt-2 text-sm text-muted-foreground">{String(r.response)}</div>
                ) : null}

                <form action={addClientRequestMessage} className="mt-3 grid gap-2" encType="multipart/form-data">
                  <input type="hidden" name="id" value={String(r._id)} />
                  <textarea
                    name="message"
                    className="min-h-[70px] rounded-md border px-3 py-2 text-sm"
                    placeholder="Send a follow-up…"
                    required
                  />
                  <input name="attachment" type="file" className="text-sm" />
                  <button className="justify-self-start rounded-md border px-3 py-1 text-sm" disabled={!canWrite}>
                    Send message
                  </button>
                </form>
              </div>
            ))}
            {(myRequests ?? []).length === 0 ? (
              <div className="text-sm text-muted-foreground">No requests yet.</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border bg-card p-5">
        <div className="text-sm text-muted-foreground">Tasks</div>
        <div className="mt-2 text-2xl font-medium">Client-visible</div>
        <div className="mt-4 space-y-3">
          {(clientWorkItems ?? []).map((w: any) => (
            <div key={w._id} className="rounded-lg border px-3 py-2">
              <div className="flex items-start justify-between gap-3">
                <div className="font-medium">{String(w.title || "")}</div>
                <div className="text-xs text-muted-foreground">{String(w.status || "")}</div>
              </div>
              {w.description ? <div className="mt-1 text-sm text-muted-foreground">{String(w.description)}</div> : null}
              <div className="mt-2 text-xs text-muted-foreground">
                {w.dueDate ? `Due: ${String(w.dueDate)}` : "No due date"}
                {w.priority ? ` • ${String(w.priority)}` : ""}
                {Number(w.commentsCount || 0) ? ` • ${Number(w.commentsCount || 0)} comments` : ""}
              </div>
              {Array.isArray(w.attachments) && w.attachments.length ? (
                <div className="mt-2 space-y-1">
                  {w.attachments.map((a: any, idx: number) => (
                    <div key={idx} className="text-sm">
                      <a className="underline" href={String(a.asset?.url || "#")} target="_blank" rel="noreferrer">
                        {String(a.asset?.originalFilename || "Attachment")}
                      </a>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {(clientWorkItems ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No client-visible tasks yet.</div>
          ) : null}
        </div>
      </div>

      {canViewServices || canRequestServices ? (
        <div className="mt-8 rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Services</div>
          <div className="mt-2 text-2xl font-medium">Your services</div>

          {canRequestServices ? (
            <div className="mt-4 rounded-lg border p-4">
              <div className="font-medium">Request a new service</div>
              <form action={submitServiceRequest} className="mt-3 grid gap-3" encType="multipart/form-data">
                <select name="organizationId" defaultValue={String(organizations?.[0]?._id || "")} className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
                  {(organizations ?? []).map((o: any) => (
                    <option key={String(o._id)} value={String(o._id)}>
                      {String(o.name || o.contactEmail || o._id)}
                    </option>
                  ))}
                </select>
                <select name="requestedServiceType" defaultValue="other" className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="email">Email</option>
                  <option value="website">Website</option>
                  <option value="ads">Ads</option>
                  <option value="seo">SEO</option>
                  <option value="other">Other</option>
                </select>
                <textarea
                  name="details"
                  className="min-h-[90px] rounded-md border px-3 py-2 text-sm"
                  placeholder="Details (optional)"
                  disabled={!canWrite}
                />
                <input name="attachment" type="file" className="text-sm" />
                <button className="justify-self-start rounded-md border px-3 py-2 text-sm" disabled={!canWrite || !organizations.length}>
                  Submit request
                </button>
                {!organizations.length ? <div className="text-sm text-muted-foreground">No organization is linked to your email.</div> : null}
              </form>
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {(clientServices ?? []).map((s: any) => (
              <div key={String(s._id)} className="rounded-lg border px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{String(s.title || "")}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {String(s.serviceType || "")} • {String(s.status || "")}
                      {s.statusNote ? ` • ${String(s.statusNote)}` : ""}
                    </div>
                  </div>
                  {canToggleServices && s.clientCanToggle ? (
                    <form action={setClientServiceEnabled} className="shrink-0 flex items-center gap-2">
                      <input type="hidden" name="id" value={String(s._id)} />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          name="enabled"
                          type="checkbox"
                          className="h-4 w-4"
                          defaultChecked={Boolean(s.clientEnabled)}
                          disabled={!canWrite}
                        />
                        Enabled
                      </label>
                      <button className="rounded-md border px-3 py-1 text-sm" disabled={!canWrite}>
                        Save
                      </button>
                    </form>
                  ) : (
                    <div className="shrink-0 text-xs text-muted-foreground">{s.clientEnabled ? "Enabled" : "Disabled"}</div>
                  )}
                </div>
              </div>
            ))}
            {!clientServices.length ? <div className="text-sm text-muted-foreground">No services yet.</div> : null}
          </div>

          <div className="mt-8 text-2xl font-medium">Service requests</div>
          <div className="mt-4 space-y-3">
            {(myServiceRequests ?? []).map((r: any) => (
              <div key={String(r._id)} className="rounded-lg border px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{String(r.requestedServiceType || "")}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {String(r.status || "")}
                      {r.createdAt ? ` • ${String(r.createdAt)}` : ""}
                    </div>
                  </div>
                </div>
                {r.details ? <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{String(r.details)}</div> : null}
                {r.resolutionNote ? (
                  <div className="mt-2 text-sm">
                    <span className="text-muted-foreground">Resolution: </span>
                    {String(r.resolutionNote)}
                  </div>
                ) : null}
                {Array.isArray(r.attachments) && r.attachments.length ? (
                  <div className="mt-2 space-y-1">
                    {r.attachments.map((a: any, i: number) => (
                      <div key={i} className="text-sm">
                        <a className="underline" href={String(a.asset?.url || "#")} target="_blank" rel="noreferrer">
                          {String(a.asset?.originalFilename || "Attachment")}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {!myServiceRequests.length ? <div className="text-sm text-muted-foreground">No service requests yet.</div> : null}
          </div>
        </div>
      ) : null}

      <div className="mt-8 rounded-xl border bg-card p-5">
        <div className="text-sm text-muted-foreground">Messages</div>
        <div className="mt-2 text-2xl font-medium">Chat with support</div>

        <form action={createOrOpenSupportThread} className="mt-4 flex items-center gap-2">
          <select name="recipientId" className="w-full rounded-md border px-3 py-2 text-sm" defaultValue="">
            <option value="" disabled>
              Choose a support contact…
            </option>
            {(supportStaff ?? []).map((s: any) => (
              <option key={s._id} value={String(s._id)}>
                {String(s.name || s.email || s._id)} ({String(s.type || "")})
              </option>
            ))}
          </select>
          <button className="shrink-0 rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
            Start
          </button>
        </form>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(myThreads ?? []).map((t: any) => {
            const lastMessageAt = String(t?.lastMessage?.createdAt || t?.updatedAt || t?.createdAt || "");
            const effectiveAccountId = String(effectiveAcct?._id || "");
            const lastReadAt = Array.isArray(t?.readStates)
              ? String(t.readStates.find((rs: any) => String(rs?.user?._ref || "") === effectiveAccountId)?.lastReadAt || "")
              : "";
            const isUnread = Boolean(lastMessageAt && (!lastReadAt || lastReadAt < lastMessageAt));

            return (
              <div key={t._id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{String(t.title || "Thread")}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {Array.isArray(t.participants)
                        ? t.participants
                            .filter((p: any) => String(p?._id || "") !== String(effectiveAcct?._id || ""))
                            .map((p: any) => String(p?.name || p?.email || "Support"))
                            .join(", ")
                        : ""}
                      {Number(t.messageCount || 0) ? ` • ${Number(t.messageCount || 0)} messages` : ""}
                    </div>
                    {Array.isArray(t.recentMessages) && t.recentMessages.length ? (
                      <div className="mt-2 space-y-2">
                        {t.recentMessages.map((m: any, idx: number) => (
                          <div key={idx}>
                            <div className="text-xs text-muted-foreground">
                              {String(m.author?.name || m.author?.email || "Support")} • {String(m.createdAt || "")}
                            </div>
                            {m.message ? (
                              <div className="mt-1 text-sm text-muted-foreground line-clamp-2">{String(m.message)}</div>
                            ) : null}
                            {Array.isArray(m.attachments) && m.attachments.length ? (
                              <div className="mt-1 space-y-1">
                                {m.attachments.map((a: any, aIdx: number) => (
                                  <div key={aIdx} className="text-sm">
                                    <a className="underline" href={String(a.asset?.url || "#")} target="_blank" rel="noreferrer">
                                      {String(a.asset?.originalFilename || "Attachment")}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    {isUnread ? <div className="text-xs text-amber-700">Unread</div> : null}
                    <Link className="text-sm underline" href={`/dashboard/client/threads/${String(t._id)}`}>
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
          {(myThreads ?? []).length === 0 ? <div className="text-sm text-muted-foreground">No message threads yet.</div> : null}
        </div>
      </div>
    </div>
  );
}
