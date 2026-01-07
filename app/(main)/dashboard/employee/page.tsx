import { safeGetServerSession } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EmployeeView } from "@/components/dashboard/employee/employee-view";
import { createWorkItem, createWorkItemFromTemplate, bulkUpdateWorkItems } from "@/app/actions/work-items";

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

  const [myWorkItemsRes, staffRes, myThreadsRes, myScheduleRes, templatesRes] = await Promise.all([
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
        checklist
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
    sanityFetch({
      query: `*[_type == "workItem" && isTemplate == true] | order(title asc){
        _id, title, description, priority, visibility, defaultDueOffset, checklist
      }`,
    }),
  ]);

  const myWorkItems = ((myWorkItemsRes as any)?.data ?? []) as any[];
  const staff = ((staffRes as any)?.data ?? []) as any[];
  const myThreads = ((myThreadsRes as any)?.data ?? []) as any[];
  const mySchedule = ((myScheduleRes as any)?.data ?? []) as any[];
  const templates = ((templatesRes as any)?.data ?? []) as any[];
  const todayStr = new Date().toISOString().slice(0, 10);
  const dueTodayCount = myWorkItems.filter((w: any) => String(w.dueDate || "").slice(0, 10) === todayStr).length;
  const blockedCount = myWorkItems.filter((w: any) => w.status === 'blocked').length;
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
      {!canWrite ? (
        <div className="mb-6 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {isImpersonating ? "Impersonation mode: actions are read-only." : "Missing SANITY_API_WRITE_TOKEN: messaging updates are disabled."}
        </div>
      ) : null}

      <EmployeeView
        data={{
          user: { name, email: emailLower },
          myWorkItems,
          staff,
          myThreads,
          mySchedule,
          workItemTemplates: templates,
          stats: { dueTodayCount, unreadThreadsCount, blockedCount },
        }}
        actions={{
          updateWorkItemStatus,
          addWorkItemComment,
          requestReassignment,
          updateWorkItemDescription,
          markWorkItemBlocked,
          uploadWorkItemAttachment,
          createOrOpenDmThread,
          createOrOpenTaskThread,
          createWorkItem,
          createWorkItemFromTemplate,
          bulkUpdateWorkItems,
        }}
      />
    </div>
  );
}
