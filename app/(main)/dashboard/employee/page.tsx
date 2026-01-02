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

export default async function EmployeeDashboardPage() {
  const session = await safeGetServerSession();
  if (!session) {
    redirect("/login?next=/dashboard/employee");
  }
  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  const type = String(acct?.type || (session as any)?.type || "");
  if (!type) {
    redirect("/login?error=no_account&next=/dashboard/employee");
  }
  if (String((acct as any)?.status || "") === "disabled") {
    redirect("/login?error=disabled&next=/dashboard/employee");
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

  if (effectiveType !== "employee") {
    redirect("/dashboard");
  }

  const name = String((session as any)?.user?.name || "");
  const emailLower = String(effectiveAcct?.email || email || "").toLowerCase();

  async function updateWorkItemStatus(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "employee") return;
    if (!hasAccountCapability(acct, "task.status.change.own")) return;

    const id = String(formData.get("id") || "");
    const status = String(formData.get("status") || "");
    if (!id || !status) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const canUpdate = await writeClient.fetch(
      `*[_type == "workItem" && _id == $id && assignedTo->email != null && lower(assignedTo->email) == $email][0]{_id}`,
      { id, email: email.toLowerCase() },
    );
    if (!canUpdate?._id) return;

    await writeClient.patch(id).set({ status }).commit();
    revalidatePath("/dashboard/employee");
  }

  async function addWorkItemComment(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "employee") return;
    if (!hasAccountCapability(acct, "task.comment")) return;

    const id = String(formData.get("id") || "");
    const message = String(formData.get("message") || "").trim();
    if (!id || !message) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const canUpdate = await writeClient.fetch(
      `*[_type == "workItem" && _id == $id && assignedTo->email != null && lower(assignedTo->email) == $email][0]{_id}`,
      { id, email: email.toLowerCase() },
    );
    if (!canUpdate?._id) return;

    await writeClient
      .patch(id)
      .setIfMissing({ comments: [] })
      .append("comments", [
        {
          _type: "workItemComment",
          author: { _type: "reference", _ref: String(acct._id) },
          message,
          createdAt: new Date().toISOString(),
        },
      ])
      .commit();
    revalidatePath("/dashboard/employee");
  }

  async function requestReassignment(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "employee") return;
    if (!hasAccountCapability(acct, "task.reassign.request")) return;

    const id = String(formData.get("id") || "");
    const note = String(formData.get("note") || "").trim();
    if (!id) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const canUpdate = await writeClient.fetch(
      `*[_type == "workItem" && _id == $id && assignedTo->email != null && lower(assignedTo->email) == $email][0]{_id, status}`,
      { id, email: email.toLowerCase() },
    );
    if (!canUpdate?._id) return;

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {
      reassignmentRequestedAt: now,
      ...(note ? { reassignmentNote: note } : {}),
    };
    if (String(canUpdate.status || "") !== "done") patch.status = "blocked";

    await writeClient.patch(id).set(patch).commit();
    revalidatePath("/dashboard/employee");
  }

  async function updateWorkItemDescription(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "employee") return;
    if (!hasAccountCapability(acct, "task.update.description.own")) return;
    const id = String(formData.get("id") || "");
    const description = String(formData.get("description") || "").trim();
    if (!id) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const canUpdate = await writeClient.fetch(
      `*[_type == "workItem" && _id == $id && assignedTo->email != null && lower(assignedTo->email) == $email][0]{_id}`,
      { id, email: email.toLowerCase() },
    );
    if (!canUpdate?._id) return;

    await writeClient.patch(id).set({ description }).commit();
    revalidatePath("/dashboard/employee");
  }

  async function markWorkItemBlocked(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "employee") return;
    if (!hasAccountCapability(acct, "task.blockers.mark")) return;

    const id = String(formData.get("id") || "");
    const blockedReason = String(formData.get("blockedReason") || "").trim();
    if (!id || !blockedReason) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const canUpdate = await writeClient.fetch(
      `*[_type == "workItem" && _id == $id && assignedTo->email != null && lower(assignedTo->email) == $email][0]{_id}`,
      { id, email: email.toLowerCase() },
    );
    if (!canUpdate?._id) return;

    await writeClient.patch(id).set({ blockedReason, status: "blocked" }).commit();
    revalidatePath("/dashboard/employee");
  }

  async function uploadWorkItemAttachment(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "employee") return;
    if (!hasAccountCapability(acct, "task.attachments.upload")) return;

    const id = String(formData.get("id") || "");
    if (!id) return;
    const attachment = formData.get("attachment");

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const canUpdate = await writeClient.fetch(
      `*[_type == "workItem" && _id == $id && assignedTo->email != null && lower(assignedTo->email) == $email][0]{_id}`,
      { id, email: email.toLowerCase() },
    );
    if (!canUpdate?._id) return;

    if (!attachment || typeof attachment === "string") return;
    const file = attachment as File;
    if (!file || file.size <= 0) return;

    const asset = await writeClient.assets.upload("file", file, { filename: file.name });
    const uploadedAssetId = String(asset?._id || "");
    if (!uploadedAssetId) return;

    await writeClient
      .patch(id)
      .setIfMissing({ attachments: [] })
      .append("attachments", [{ _type: "file", asset: { _type: "reference", _ref: uploadedAssetId } }])
      .commit();

    revalidatePath("/dashboard/employee");
  }

  async function createOrOpenDmThread(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "employee") return;
    if (!hasAccountCapability(acct, "message.create")) return;

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
    if (!["admin", "manager", "employee"].includes(String(recipient.type || ""))) return;

    const existing = await writeClient.fetch(
      `*[_type == "messageThread" && type == "dm" && visibility == "internal" && count(participants) == 2 && $a in participants[]._ref && $b in participants[]._ref][0]{_id}`,
      { a: String(acct._id), b: recipientId },
    );
    if (existing?._id) {
      revalidatePath("/dashboard/employee");
      redirect(`/dashboard/employee/threads/${String(existing._id)}`);
    }

    const created = await writeClient.create({
      _type: "messageThread",
      title: "Direct message",
      type: "dm",
      visibility: "internal",
      participants: [
        { _type: "reference", _ref: String(acct._id) },
        { _type: "reference", _ref: recipientId },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    });

    revalidatePath("/dashboard/employee");
    redirect(`/dashboard/employee/threads/${String(created?._id || "")}`);
  }

  async function createOrOpenTaskThread(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "employee") return;
    if (!hasAccountCapability(acct, "message.create")) return;

    const workItemId = String(formData.get("workItemId") || "").trim();
    if (!workItemId) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const w = await writeClient.fetch(
      `*[_type == "workItem" && _id == $id][0]{
        _id,
        title,
        assignedTo->{_id, type, status},
        createdBy->{_id, type, status}
      }`,
      { id: workItemId },
    );
    if (!w?._id) return;

    const assignedId = String(w.assignedTo?._id || "");
    const createdById = String(w.createdBy?._id || "");
    if (!assignedId || !createdById) return;
    if (assignedId === createdById) return;
    if (String(w.assignedTo?.status || "") === "disabled") return;
    if (String(w.createdBy?.status || "") === "disabled") return;
    if (!["admin", "manager", "employee"].includes(String(w.assignedTo?.type || ""))) return;
    if (!["admin", "manager", "employee"].includes(String(w.createdBy?.type || ""))) return;
    if (![assignedId, createdById].includes(String(acct._id))) return;

    const existing = await writeClient.fetch(
      `*[_type == "messageThread" && type == "task" && visibility == "internal" && relatedWorkItem._ref == $id][0]{_id}`,
      { id: workItemId },
    );
    if (existing?._id) {
      revalidatePath("/dashboard/employee");
      redirect(`/dashboard/employee/threads/${String(existing._id)}`);
    }

    const created = await writeClient.create({
      _type: "messageThread",
      title: `Task: ${String(w.title || "Work item")}`,
      type: "task",
      visibility: "internal",
      relatedWorkItem: { _type: "reference", _ref: String(w._id) },
      participants: [
        { _type: "reference", _ref: createdById },
        { _type: "reference", _ref: assignedId },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    });

    revalidatePath("/dashboard/employee");
    redirect(`/dashboard/employee/threads/${String(created?._id || "")}`);
  }

  const canWrite = Boolean(process.env.SANITY_API_WRITE_TOKEN) && !isImpersonating;

  const [myWorkItemsRes, staffRes, myThreadsRes, myScheduleRes] = await Promise.all([
    sanityFetch({
      query: `*[_type == "workItem" && (!defined(isTemplate) || isTemplate != true) && status != "done" && assignedTo->email != null && lower(assignedTo->email) == $email] | order(priority desc, dueDate asc, createdAt desc)[0..19]{
        _id, title, description, status, priority, dueDate, createdAt,
        "createdByName": createdBy->name,
        blockedReason, reassignmentRequestedAt, reassignmentNote,
        comments[]{
          message, createdAt,
          author->{name, email}
        },
        attachments[]{asset->{url, originalFilename}},
        relatedEvent->{title, slug},
        relatedSignup->{name, email},
        relatedSponsorship->{businessName, contactEmail}
      }`,
      params: { email: emailLower },
    }),
    sanityFetch({
      query: `*[_type == "account" && status != "disabled" && type in ["admin","manager","employee"]] | order(type asc, name asc, email asc){
        _id, name, email, type
      }`,
    }),
    sanityFetch({
      query: `*[_type == "messageThread" && $acctId in participants[]._ref] | order(coalesce(updatedAt, createdAt) desc)[0..9]{
        _id, title, type, visibility, createdAt, updatedAt,
        "readStates": readStates[]{user, lastReadAt},
        "messageCount": count(messages),
        "recentMessages": messages[-3..-1]{message, createdAt, author->{name, email}, attachments[]{asset->{url, originalFilename}}},
        "lastMessage": messages[-1]{message, createdAt, author->{name, email}, attachments[]{asset->{url, originalFilename}}},
        "participants": participants[]->{_id, name, email, type}
      }`,
      params: { acctId: String(effectiveAcct?._id || "") },
    }),
    sanityFetch({
      query: `*[_type == "scheduleItem" && $acctId in participants[]._ref] | order(startsAt asc)[0..29]{
        _id, title, type, startsAt, endsAt
      }`,
      params: { acctId: String(effectiveAcct?._id || "") },
    }),
  ]);

  const myWorkItems = ((myWorkItemsRes as any)?.data ?? []) as any[];
  const staff = ((staffRes as any)?.data ?? []) as any[];
  const myThreads = ((myThreadsRes as any)?.data ?? []) as any[];
  const mySchedule = ((myScheduleRes as any)?.data ?? []) as any[];
  const todayStr = new Date().toISOString().slice(0, 10);
  const dueTodayCount = myWorkItems.filter((w: any) => String(w.dueDate || "").slice(0, 10) === todayStr).length;
  const unreadThreadsCount = myThreads.filter((t: any) => {
    const lastMessageAt = String(t?.lastMessage?.createdAt || t?.updatedAt || t?.createdAt || "");
    const effectiveAccountId = String(effectiveAcct?._id || "");
    const lastReadAt = Array.isArray(t?.readStates)
      ? String(t.readStates.find((rs: any) => String(rs?.user?._ref || "") === effectiveAccountId)?.lastReadAt || "")
      : "";
    return Boolean(lastMessageAt && (!lastReadAt || lastReadAt < lastMessageAt));
  }).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="rounded-2xl bg-header border border-input px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 w-full max-w-xl">
          <div className="relative flex-1">
            <input
              className="w-full h-11 pl-10 pr-16 rounded-full border border-input bg-white text-sm"
              placeholder="Search & Command"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">⌕</div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-input bg-white px-2 py-0.5 text-xs text-muted-foreground">⌘M</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full border border-input flex items-center justify-center text-muted-foreground">🔔</div>
          <div className="h-9 w-9 rounded-full border border-input flex items-center justify-center text-muted-foreground">⚙️</div>
          <div className="flex items-center gap-3 rounded-2xl border border-input px-3 py-2 bg-white">
            <div className="h-8 w-8 rounded-full bg-secondary"></div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{name || "—"}</div>
              <div className="text-xs text-muted-foreground truncate">{email}</div>
            </div>
          </div>
        </div>
      </div>

      {!canWrite ? (
        <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {isImpersonating ? "Impersonation mode: actions are read-only." : "Missing SANITY_API_WRITE_TOKEN: messaging updates are disabled."}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Work Items</div>
          <div className="mt-2 text-2xl font-medium">Assigned to you</div>
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted-foreground">You have </span>
              <span className="text-blue-600 font-semibold">{dueTodayCount} tasks</span>
              <span className="text-muted-foreground"> due today.</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-2xl bg-cta-blue text-header-foreground border border-cta-blue-border px-4 py-1.5 text-sm">Refresh</button>
              <button className="rounded-2xl bg-cta-blue text-header-foreground border border-cta-blue-border px-4 py-1.5 text-sm">New Task</button>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {(myWorkItems ?? []).map((w: any) => (
              <div key={w._id} className="rounded-lg border px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">{w.title}</div>
                  <div className="text-xs text-muted-foreground">{String(w.priority || "medium")}</div>
                </div>
                {String(w.description || "") ? (
                  <div className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{String(w.description)}</div>
                ) : null}
                <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                  {String(w.reassignmentRequestedAt || "") ? (
                    <div className="text-amber-700">
                      Reassignment requested{w.reassignmentNote ? `: ${String(w.reassignmentNote)}` : ""}
                    </div>
                  ) : null}

                  {String(w.blockedReason || "") ? (
                    <div className="text-amber-700">Blocked reason: {String(w.blockedReason)}</div>
                  ) : null}
                  {w.relatedEvent?.slug?.current ? (
                    <div>
                      Event:{" "}
                      <Link className="underline" href={`/events/${String(w.relatedEvent.slug.current)}`}>
                        {String(w.relatedEvent.title || w.relatedEvent.slug.current)}
                      </Link>
                    </div>
                  ) : w.relatedEvent?.title ? (
                    <div>Event: {String(w.relatedEvent.title)}</div>
                  ) : null}

                  {w.relatedSignup?.email ? <div>Signup: {String(w.relatedSignup.name || w.relatedSignup.email)}</div> : null}
                  {w.relatedSponsorship?.contactEmail ? (
                    <div>
                      Sponsorship: {String(w.relatedSponsorship.businessName || w.relatedSponsorship.contactEmail)}
                    </div>
                  ) : null}
                  {w.createdByName ? <div>Created by: {String(w.createdByName)}</div> : null}
                  {w.dueDate ? <div>Due: {String(w.dueDate)}</div> : null}
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="text-sm text-muted-foreground">{String(w.status || "")}</div>
                  <div className="flex items-center gap-2">
                    <form action={updateWorkItemStatus} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={w._id} />
                      <select name="status" defaultValue={String(w.status || "todo")} className="rounded-md border px-2 py-1 text-sm">
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="blocked">Blocked</option>
                        <option value="done">Done</option>
                      </select>
                      <button className="rounded-md border px-3 py-1 text-sm">Update</button>
                    </form>
                    <form action={createOrOpenTaskThread}>
                      <input type="hidden" name="workItemId" value={String(w._id)} />
                      <button className="rounded-md border px-3 py-1 text-sm" disabled={!canWrite}>
                        Start thread
                      </button>
                    </form>
                  </div>
                </div>

                <div className="mt-3 grid gap-3">
                  <form action={updateWorkItemDescription} className="grid gap-2">
                    <input type="hidden" name="id" value={w._id} />
                    <textarea
                      name="description"
                      className="min-h-[70px] rounded-md border px-3 py-2 text-sm"
                      placeholder="Update description…"
                      defaultValue={String(w.description || "")}
                    />
                    <button className="justify-self-start rounded-md border px-3 py-1 text-sm">Save description</button>
                  </form>

                  <form action={addWorkItemComment} className="grid gap-2">
                    <input type="hidden" name="id" value={w._id} />
                    <textarea
                      name="message"
                      className="min-h-[70px] rounded-md border px-3 py-2 text-sm"
                      placeholder="Add a comment…"
                      required
                    />
                    <button className="justify-self-start rounded-md border px-3 py-1 text-sm">Post comment</button>
                  </form>

                  <form action={markWorkItemBlocked} className="grid gap-2">
                    <input type="hidden" name="id" value={w._id} />
                    <textarea
                      name="blockedReason"
                      className="min-h-[70px] rounded-md border px-3 py-2 text-sm"
                      placeholder="Mark blocked (reason)…"
                      required
                    />
                    <button className="justify-self-start rounded-md border px-3 py-1 text-sm">Mark blocked</button>
                  </form>

                  <form action={requestReassignment} className="grid gap-2">
                    <input type="hidden" name="id" value={w._id} />
                    <textarea
                      name="note"
                      className="min-h-[70px] rounded-md border px-3 py-2 text-sm"
                      placeholder="Request reassignment (optional note)…"
                    />
                    <button className="justify-self-start rounded-md border px-3 py-1 text-sm">Request reassignment</button>
                  </form>

                  <form action={uploadWorkItemAttachment} className="grid gap-2" encType="multipart/form-data">
                    <input type="hidden" name="id" value={w._id} />
                    <input name="attachment" type="file" className="text-sm" disabled={!canWrite} />
                    <button className="justify-self-start rounded-md border px-3 py-1 text-sm" disabled={!canWrite}>
                      Upload attachment
                    </button>
                  </form>

                  {Array.isArray(w.attachments) && w.attachments.length ? (
                    <div className="rounded-md border p-3">
                      <div className="text-sm font-medium">Attachments</div>
                      <div className="mt-2 space-y-1">
                        {w.attachments.slice(-5).map((a: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            <a className="underline" href={String(a?.asset?.url || "#")} target="_blank" rel="noreferrer">
                              {String(a?.asset?.originalFilename || "Attachment")}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {Array.isArray(w.comments) && w.comments.length ? (
                    <div className="rounded-md border p-3">
                      <div className="text-sm font-medium">Comments</div>
                      <div className="mt-2 space-y-2">
                        {w.comments.slice(-3).map((c: any, idx: number) => (
                          <div key={idx} className="rounded-md border px-3 py-2">
                            <div className="text-xs text-muted-foreground">
                              {String(c.author?.name || c.author?.email || "Unknown")} • {String(c.createdAt || "")}
                            </div>
                            <div className="mt-1 text-sm">{String(c.message || "")}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {(myWorkItems ?? []).length === 0 ? (
              <div className="text-sm text-muted-foreground">No work items assigned right now.</div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-2xl border bg-card p-5">
            <div className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long' })}</div>
            <div className="mt-2 text-2xl font-medium">Schedule</div>
            <div className="mt-4 space-y-3">
              {(mySchedule ?? []).slice(0, 3).map((s: any) => {
                const start = s.startsAt ? new Date(s.startsAt) : null;
                const timeLabel = start ? start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "—";
                return (
                  <div key={s._id} className="rounded-xl bg-blue-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <div className="text-sm">{timeLabel}</div>
                    </div>
                    <div className="text-sm font-medium">{String(s.title || "")}</div>
                  </div>
                );
              })}
              {(mySchedule ?? []).length === 0 ? <div className="text-sm text-muted-foreground">No scheduled items.</div> : null}
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <div className="text-sm text-muted-foreground">Profile</div>
            <div className="mt-2 text-2xl font-medium">Your details</div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{email}</div>
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div className="text-sm text-muted-foreground">Role</div>
                <div className="font-medium">{type}</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <div className="text-sm text-muted-foreground">{unreadThreadsCount} Unread Messages</div>
            <div className="mt-2 text-2xl font-medium">Direct messages</div>

            <form action={createOrOpenDmThread} className="mt-4 flex items-center gap-2">
              <select name="recipientId" className="w-full rounded-md border px-3 py-2 text-sm" defaultValue="">
                <option value="" disabled>
                  Choose a teammate…
                </option>
                {(staff ?? [])
                  .filter((s: any) => String(s._id || "") !== String(acct?._id || "") && String(s.type || "") !== "client")
                  .map((s: any) => (
                    <option key={s._id} value={String(s._id)}>
                      {String(s.name || s.email || s._id)} ({String(s.type || "")})
                    </option>
                  ))}
              </select>
              <button className="shrink-0 rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
                Start
              </button>
            </form>

            <div className="mt-4 space-y-3">
              {(myThreads ?? []).map((t: any) => {
                const lastMessageAt = String(t?.lastMessage?.createdAt || t?.updatedAt || t?.createdAt || "");
                const effectiveAccountId = String(effectiveAcct?._id || "");
                const lastReadAt = Array.isArray(t?.readStates)
                  ? String(t.readStates.find((rs: any) => String(rs?.user?._ref || "") === effectiveAccountId)?.lastReadAt || "")
                  : "";
                const isUnread = Boolean(lastMessageAt && (!lastReadAt || lastReadAt < lastMessageAt));

                return (
                  <div key={t._id} className="rounded-lg border px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{String(t.title || "Thread")}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {Array.isArray(t.participants)
                            ? t.participants
                                .filter((p: any) => String(p?._id || "") !== String(acct?._id || ""))
                                .map((p: any) => String(p?.name || p?.email || "Unknown"))
                                .join(", ")
                            : ""}
                          {Number(t.messageCount || 0) ? ` • ${Number(t.messageCount || 0)} messages` : ""}
                        </div>
                        {Array.isArray(t.recentMessages) && t.recentMessages.length ? (
                          <div className="mt-2 space-y-2">
                            {t.recentMessages.map((m: any, idx: number) => (
                              <div key={idx}>
                                <div className="text-xs text-muted-foreground">
                                  {String(m.author?.name || m.author?.email || "Unknown")} • {String(m.createdAt || "")}
                                </div>
                                {m.message ? (
                                  <div className="mt-1 text-sm text-muted-foreground line-clamp-2">{String(m.message)}</div>
                                ) : null}
                                {Array.isArray(m.attachments) && m.attachments.length ? (
                                  <div className="mt-1 space-y-1">
                                    {m.attachments.map((a: any, aIdx: number) => (
                                      <div key={aIdx} className="text-sm">
                                        <a
                                          className="underline"
                                          href={String(a.asset?.url || "#")}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
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
                        <Link className="text-sm underline" href={`/dashboard/employee/threads/${String(t._id)}`}>
                          Open
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
              {(myThreads ?? []).length === 0 ? (
                <div className="text-sm text-muted-foreground">No messages yet.</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
