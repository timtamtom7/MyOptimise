import { hasAccountCapability, safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const IMPERSONATE_COOKIE = "impersonateAccountId";

async function sendResendEmailWithFallback({
  resend,
  from,
  to,
  subject,
  html,
}: {
  resend: Resend;
  from: string;
  to: string | string[];
  subject: string;
  html: string;
}) {
  try {
    await resend.emails.send({ from, to, subject, html });
    return;
  } catch {
    if (from.toLowerCase().includes("onboarding@resend.dev")) throw new Error("resend_send_failed");
    await resend.emails.send({
      from: "Optimise Operations <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
  }
}

export default async function ManagerDashboardPage() {
  const session = await safeGetServerSession();
  if (!session) {
    redirect("/login?next=/dashboard/manager");
  }

  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  const type = String(acct?.type || (session as any)?.type || "");
  if (!type) {
    redirect("/login?error=no_account&next=/dashboard/manager");
  }
  if (String((acct as any)?.status || "") === "disabled") {
    redirect("/login?error=disabled&next=/dashboard/manager");
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

  if (effectiveType !== "manager") {
    redirect("/dashboard");
  }

  const name = String((session as any)?.user?.name || "");
  const emailLower = String(effectiveAcct?.email || email || "").toLowerCase();
  const effectiveAcctId = String(effectiveAcct?._id || "");

  const canWrite = Boolean(process.env.SANITY_API_WRITE_TOKEN) && !isImpersonating;
  const canInviteEmployees = hasAccountCapability(effectiveAcct, "users.invite.limited");
  const canCreateTasks = hasAccountCapability(effectiveAcct, "task.create");
  const canManageServices = hasAccountCapability(effectiveAcct, "client.services.manage");

  async function inviteEmployee(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
    if (!hasAccountCapability(acct, "users.invite.limited")) return;

    const inviteEmail = String(formData.get("email") || "").trim();
    if (!inviteEmail) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const existing = await fetchSanityAccountByEmail({ email: inviteEmail });
    if (!existing) {
      await writeClient.create({
        _type: "account",
        email: inviteEmail,
        name: "",
        type: "employee",
        status: "active",
        sessionVersion: 1,
      });
    } else {
      if (String(existing.type || "") !== "employee") return;
      await writeClient.patch(existing._id).set({ status: "active" }).commit();
    }

    if (process.env.RESEND_API_KEY) {
      const resendFrom = process.env.RESEND_FROM || "Optimise Operations <onboarding@resend.dev>";
      const resend = new Resend(process.env.RESEND_API_KEY);
      const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(
        /\/$/,
        "",
      );
      const loginUrl = `${baseUrl}/login?email=${encodeURIComponent(inviteEmail)}`;
      await sendResendEmailWithFallback({
        resend,
        from: resendFrom,
        to: inviteEmail,
        subject: "Your Optimise Operations access link",
        html: `<p>You’ve been granted access. Sign in with Google using <strong>${inviteEmail}</strong>.</p><p><a href="${loginUrl}">Open sign-in</a></p>`,
      });
    }

    revalidatePath("/dashboard/manager");
  }

  async function createWorkItem(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
    if (!hasAccountCapability(acct, "task.create")) return;

    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const priority = String(formData.get("priority") || "medium").trim();
    const dueDateRaw = String(formData.get("dueDate") || "").trim();
    const assigneeId = String(formData.get("assigneeId") || "").trim();
    if (!title) return;
    if (!["low", "medium", "high"].includes(priority)) return;

    const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
    if (dueDate && Number.isNaN(dueDate.getTime())) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    let assignedTo: { _type: "reference"; _ref: string } | undefined;
    if (assigneeId) {
      if (!hasAccountCapability(acct, "task.assign.team")) return;
      const canAssign = await writeClient.fetch(`*[_type == "account" && _id == $id && type == "employee" && status != "disabled"][0]{_id}`, {
        id: assigneeId,
      });
      if (!canAssign?._id) return;
      assignedTo = { _type: "reference", _ref: assigneeId };
    }

    await writeClient.create({
      _type: "workItem",
      title,
      description: description || undefined,
      createdBy: { _type: "reference", _ref: String(acct._id) },
      ...(assignedTo ? { assignedTo } : {}),
      priority,
      status: "todo",
      createdAt: new Date().toISOString(),
      ...(dueDate ? { dueDate: dueDate.toISOString() } : {}),
    });

    revalidatePath("/dashboard/manager");
    redirect("/dashboard/manager");
  }

  async function assignSignup(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
    if (!hasAccountCapability(acct, "task.create")) return;
    if (!hasAccountCapability(acct, "task.assign.team")) return;

    const signupId = String(formData.get("signupId") || "");
    const assigneeId = String(formData.get("assigneeId") || "");
    if (!signupId || !assigneeId) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const signup = await writeClient.fetch(
      `*[_type == "signup" && _id == $id][0]{_id, name, email, event->{_id, organization}}`,
      { id: signupId },
    );
    if (!signup?._id) return;

    const relatedEventRef = signup?.event?._id ? { _type: "reference", _ref: signup.event._id } : undefined;
    const relatedOrgRef = signup?.event?.organization?._ref
      ? { _type: "reference", _ref: signup.event.organization._ref }
      : undefined;

    await writeClient.create({
      _type: "workItem",
      title: `Handle signup: ${String(signup.name || signup.email || "Unknown")}`,
      assignedTo: { _type: "reference", _ref: assigneeId },
      createdBy: { _type: "reference", _ref: String(acct._id) },
      relatedSignup: { _type: "reference", _ref: signupId },
      ...(relatedEventRef ? { relatedEvent: relatedEventRef } : {}),
      ...(relatedOrgRef ? { relatedOrganization: relatedOrgRef } : {}),
      priority: "high",
      status: "todo",
      createdAt: new Date().toISOString(),
    });

    revalidatePath("/dashboard/manager");
  }

  async function assignSponsorship(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
    if (!hasAccountCapability(acct, "task.create")) return;
    if (!hasAccountCapability(acct, "task.assign.team")) return;

    const sponsorshipId = String(formData.get("sponsorshipId") || "");
    const assigneeId = String(formData.get("assigneeId") || "");
    if (!sponsorshipId || !assigneeId) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const sponsorship = await writeClient.fetch(
      `*[_type == "sponsorship" && _id == $id][0]{_id, businessName, contactEmail}`,
      { id: sponsorshipId },
    );
    if (!sponsorship?._id) return;

    await writeClient.create({
      _type: "workItem",
      title: `Handle sponsorship: ${String(sponsorship.businessName || sponsorship.contactEmail || "Unknown")}`,
      assignedTo: { _type: "reference", _ref: assigneeId },
      createdBy: { _type: "reference", _ref: String(acct._id) },
      relatedSponsorship: { _type: "reference", _ref: sponsorshipId },
      priority: "high",
      status: "todo",
      createdAt: new Date().toISOString(),
    });

    revalidatePath("/dashboard/manager");
  }

  async function updateWorkItemStatus(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
    if (!hasAccountCapability(acct, "task.status.change.team")) return;

    const id = String(formData.get("id") || "");
    const status = String(formData.get("status") || "");
    if (!id || !status) return;
    if (!["todo", "in_progress", "blocked", "done"].includes(status)) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const canUpdate = await writeClient.fetch(
      `*[_type == "workItem" && _id == $id && (assignedTo._ref == $acctId || createdBy._ref == $acctId)][0]{_id}`,
      { id, acctId: String(acct._id) },
    );
    if (!canUpdate?._id) return;

    await writeClient.patch(id).set({ status }).commit();
    revalidatePath("/dashboard/manager");
  }

  async function updateClientRequest(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
    if (!hasAccountCapability(acct, "support.ticket.manage")) return;

    const id = String(formData.get("id") || "");
    const status = String(formData.get("status") || "");
    const response = String(formData.get("response") || "");
    if (!id || !status) return;
    if (!["submitted", "in_review", "responded", "closed"].includes(status)) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const existing = await writeClient.fetch(
      `*[_type == "clientRequest" && _id == $id && (assignedTo._ref == $acctId || organization._ref in *[_type == "organization" && $acctId in teamMembers[]._ref]._id)][0]{_id, status}`,
      { id, acctId: String(acct._id) },
    );
    const fromStatus = String(existing?.status || "");

    const patch: Record<string, unknown> = { status };
    if (response) patch.response = response;
    if (status === "responded") patch.respondedAt = new Date().toISOString();
    patch.updatedAt = new Date().toISOString();

    const p = writeClient.patch(id).set(patch);
    const toStatus = status;
    const changedAt = new Date().toISOString();
    if (fromStatus && fromStatus !== toStatus) {
      p.setIfMissing({ statusHistory: [] }).append("statusHistory", [
        {
          _type: "clientRequestStatusChange",
          fromStatus,
          toStatus,
          changedBy: { _type: "reference", _ref: String(acct._id) },
          changedAt,
        },
      ]);
    }
    const shouldAppendResponseMessage = response && status === "responded";
    if (shouldAppendResponseMessage) {
      p.setIfMissing({ messages: [] }).append("messages", [
        {
          _type: "clientRequestMessage",
          author: { _type: "reference", _ref: String(acct._id) },
          visibility: "client",
          message: response,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    await p.commit();
    revalidatePath("/dashboard/manager");
  }

  async function addWorkItemComment(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
    if (!hasAccountCapability(acct, "task.comment")) return;

    const id = String(formData.get("id") || "");
    const message = String(formData.get("message") || "").trim();
    if (!id || !message) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const canUpdate = await writeClient.fetch(
      `*[_type == "workItem" && _id == $id && (assignedTo._ref == $acctId || createdBy._ref == $acctId)][0]{_id}`,
      { id, acctId: String(acct._id) },
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

    revalidatePath("/dashboard/manager");
  }

  async function clearReassignmentRequest(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
    if (!hasAccountCapability(acct, "task.reassign.manage")) return;

    const id = String(formData.get("id") || "");
    if (!id) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const canUpdate = await writeClient.fetch(
      `*[_type == "workItem" && _id == $id && (assignedTo._ref == $acctId || createdBy._ref == $acctId)][0]{_id}`,
      { id, acctId: String(acct._id) },
    );
    if (!canUpdate?._id) return;

    await writeClient.patch(id).unset(["reassignmentRequestedAt", "reassignmentNote"]).commit();
    revalidatePath("/dashboard/manager");
  }

  async function createOrOpenDmThread(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
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
      revalidatePath("/dashboard/manager");
      redirect(`/dashboard/manager/threads/${String(existing._id)}`);
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

    revalidatePath("/dashboard/manager");
    redirect(`/dashboard/manager/threads/${String(created?._id || "")}`);
  }

  async function createOrOpenTaskThread(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
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
      revalidatePath("/dashboard/manager");
      redirect(`/dashboard/manager/threads/${String(existing._id)}`);
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

    revalidatePath("/dashboard/manager");
    redirect(`/dashboard/manager/threads/${String(created?._id || "")}`);
  }

  async function createClientService(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
    if (!hasAccountCapability(acct, "client.services.manage")) return;

    const title = String(formData.get("title") || "").trim();
    const serviceType = String(formData.get("serviceType") || "other").trim();
    const organizationId = String(formData.get("organizationId") || "").trim();
    const status = String(formData.get("status") || "active").trim();
    const statusNote = String(formData.get("statusNote") || "").trim();
    const clientCanToggle = String(formData.get("clientCanToggle") || "") === "on";
    const clientEnabled = String(formData.get("clientEnabled") || "") === "on";
    if (!title || !organizationId) return;
    if (!["instagram", "facebook", "email", "website", "ads", "seo", "other"].includes(serviceType)) return;
    if (!["active", "paused", "cancelled"].includes(status)) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const org = await writeClient.fetch(
      `*[_type == "organization" && _id == $id && $acctId in teamMembers[]._ref][0]{_id}`,
      { id: organizationId, acctId: String(acct._id) },
    );
    if (!org?._id) return;

    await writeClient.create({
      _type: "clientService",
      title,
      serviceType,
      organization: { _type: "reference", _ref: organizationId },
      status,
      statusNote: statusNote || undefined,
      clientCanToggle,
      clientEnabled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/dashboard/manager");
  }

  async function updateClientService(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
    if (!hasAccountCapability(acct, "client.services.manage")) return;

    const id = String(formData.get("id") || "").trim();
    const status = String(formData.get("status") || "").trim();
    const statusNote = String(formData.get("statusNote") || "").trim();
    const clientCanToggle = String(formData.get("clientCanToggle") || "") === "on";
    const clientEnabled = String(formData.get("clientEnabled") || "") === "on";
    if (!id) return;
    if (!["active", "paused", "cancelled"].includes(status)) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const existing = await writeClient.fetch(
      `*[_type == "clientService" && _id == $id && organization._ref in *[_type == "organization" && $acctId in teamMembers[]._ref]._id][0]{_id}`,
      { id, acctId: String(acct._id) },
    );
    if (!existing?._id) return;

    await writeClient
      .patch(id)
      .set({
        status,
        statusNote: statusNote || undefined,
        clientCanToggle,
        clientEnabled,
        updatedAt: new Date().toISOString(),
      })
      .commit();

    revalidatePath("/dashboard/manager");
  }

  async function updateServiceRequestStatus(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const cookieStore = await cookies();
    if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
    if (!hasAccountCapability(acct, "client.services.manage")) return;

    const id = String(formData.get("id") || "").trim();
    const status = String(formData.get("status") || "").trim();
    const resolutionNote = String(formData.get("resolutionNote") || "").trim();
    if (!id) return;
    if (!["in_review", "approved", "rejected"].includes(status)) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const req = await writeClient.fetch(
      `*[_type == "serviceRequest" && _id == $id && organization._ref in *[_type == "organization" && $acctId in teamMembers[]._ref]._id][0]{_id, status, requestedServiceType, organization->{_id}}`,
      { id, acctId: String(acct._id) },
    );
    if (!req?._id) return;

    const now = new Date().toISOString();

    if (status === "approved") {
      const orgId = String(req.organization?._id || "");
      const requestedServiceType = String(req.requestedServiceType || "other");
      if (orgId && ["instagram", "facebook", "email", "website", "ads", "seo", "other"].includes(requestedServiceType)) {
        const existingService = await writeClient.fetch(
          `*[_type == "clientService" && organization._ref == $orgId && serviceType == $type && status != "cancelled"][0]{_id}`,
          { orgId, type: requestedServiceType },
        );
        if (!existingService?._id) {
          await writeClient.create({
            _type: "clientService",
            title: `Service: ${requestedServiceType}`,
            serviceType: requestedServiceType,
            organization: { _type: "reference", _ref: orgId },
            status: "active",
            clientCanToggle: false,
            clientEnabled: true,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    const patch: Record<string, unknown> = { status, updatedAt: now };
    if (status === "approved" || status === "rejected") {
      patch.resolutionNote = resolutionNote || undefined;
      patch.resolvedAt = now;
      patch.resolvedBy = { _type: "reference", _ref: String(acct._id) };
    }

    await writeClient.patch(id).set(patch).commit();

    revalidatePath("/dashboard/manager");
  }

  const [
    employeesRes,
    organizationsRes,
    unassignedWorkItemsRes,
    myWorkItemsRes,
    receivedSignupsRes,
    submittedSponsorshipsRes,
    openClientRequestsRes,
    clientServicesRes,
    openServiceRequestsRes,
    staffRes,
    myThreadsRes,
  ] = await Promise.all([
    sanityFetch({
      query: `*[_type == "account" && type == "employee" && status != "disabled"] | order(name asc, email asc){_id, name, email}`,
    }),
    sanityFetch({
      query: `*[_type == "organization" && $acctId in teamMembers[]._ref] | order(name asc){_id, name, contactEmail}`,
      params: { acctId: effectiveAcctId },
    }),
    sanityFetch({
      query: `*[_type == "workItem" && (!defined(isTemplate) || isTemplate != true) && status != "done" && !defined(assignedTo)] | order(priority desc, dueDate asc, createdAt desc)[0..9]{
        _id, title, status, priority, dueDate, createdAt
      }`,
    }),
    sanityFetch({
      query: `*[_type == "workItem" && (!defined(isTemplate) || isTemplate != true) && status != "done" && assignedTo->email != null && lower(assignedTo->email) == $email] | order(priority desc, dueDate asc, createdAt desc)[0..9]{
        _id, title, status, priority, dueDate, createdAt,
        "assigneeName": assignedTo->name,
        blockedReason, reassignmentRequestedAt, reassignmentNote,
        "commentsCount": count(comments)
      }`,
      params: { email: emailLower },
    }),
    sanityFetch({
      query: `*[_type == "signup" && status == "received"] | order(createdAt desc)[0..9]{
        _id, name, email, status, createdAt,
        event->{_id, title, "organizationName": organization->name}
      }`,
    }),
    sanityFetch({
      query: `*[_type == "sponsorship" && status == "submitted"] | order(_createdAt desc)[0..9]{_id, businessName, contactEmail, mealsCount, date, location, status}`,
    }),
    sanityFetch({
      query: `*[_type == "clientRequest" && status in ["submitted","in_review"] && (assignedTo._ref == $acctId || organization._ref in *[_type == "organization" && $acctId in teamMembers[]._ref]._id)] | order(createdAt desc)[0..9]{
        _id, subject, status, createdAt, clientEmail, response, assignedTo->{name, email},
        statusHistory[]{fromStatus, toStatus, changedAt, changedBy->{name, email}},
        messages[]{
          message, createdAt, visibility,
          author->{name, email},
          attachments[]{asset->{url, originalFilename}}
        }
      }`,
      params: { acctId: effectiveAcctId },
    }),
    sanityFetch({
      query: `*[_type == "clientService" && organization._ref in *[_type == "organization" && $acctId in teamMembers[]._ref]._id] | order(coalesce(updatedAt, createdAt) desc)[0..19]{
        _id, title, serviceType, status, statusNote, clientCanToggle, clientEnabled, createdAt, updatedAt,
        organization->{_id, name, contactEmail}
      }`,
      params: { acctId: effectiveAcctId },
    }),
    sanityFetch({
      query: `*[_type == "serviceRequest" && status in ["submitted","in_review"] && organization._ref in *[_type == "organization" && $acctId in teamMembers[]._ref]._id] | order(createdAt desc)[0..19]{
        _id, status, requestedServiceType, details, resolutionNote, createdAt, updatedAt,
        organization->{_id, name, contactEmail},
        clientAccount->{_id, name, email},
        attachments[]{asset->{url, originalFilename}}
      }`,
      params: { acctId: effectiveAcctId },
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
      params: { acctId: effectiveAcctId },
    }),
  ]);

  const employees = ((employeesRes as any)?.data ?? []) as Array<{ _id: string; name?: string; email?: string }>;
  const organizations = ((organizationsRes as any)?.data ?? []) as any[];
  const unassignedWorkItems = ((unassignedWorkItemsRes as any)?.data ?? []) as any[];
  const myWorkItems = ((myWorkItemsRes as any)?.data ?? []) as any[];
  const receivedSignups = ((receivedSignupsRes as any)?.data ?? []) as any[];
  const submittedSponsorships = ((submittedSponsorshipsRes as any)?.data ?? []) as any[];
  const openClientRequests = ((openClientRequestsRes as any)?.data ?? []) as any[];
  const clientServices = ((clientServicesRes as any)?.data ?? []) as any[];
  const openServiceRequests = ((openServiceRequestsRes as any)?.data ?? []) as any[];
  const staff = ((staffRes as any)?.data ?? []) as any[];
  const myThreads = ((myThreadsRes as any)?.data ?? []) as any[];

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manager Dashboard</h1>
        <div className="text-sm text-muted-foreground">Welcome{name ? `, ${name}` : ""}</div>
      </div>

      {!canWrite ? (
        <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          {isImpersonating ? "Impersonation mode: actions are read-only." : "Missing SANITY_API_WRITE_TOKEN: messaging updates are disabled."}
        </div>
      ) : null}

      {canInviteEmployees ? (
        <div className="mt-6 rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Team</div>
          <div className="mt-2 text-2xl font-medium">Invite employee (Google)</div>
          <form action={inviteEmployee} className="mt-4 flex flex-col gap-3 max-w-lg">
            <input name="email" type="email" placeholder="employee@company.com" required className="rounded-md border px-3 py-2 text-sm" />
            <button className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
              Invite
            </button>
            {!process.env.RESEND_API_KEY ? (
              <div className="text-xs text-muted-foreground">
                RESEND_API_KEY is missing: invite emails are disabled (account will still be created).
              </div>
            ) : null}
          </form>
        </div>
      ) : null}

      {canCreateTasks ? (
        <div className="mt-6 rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Tasks</div>
          <div className="mt-2 text-2xl font-medium">Create work item</div>
          <form action={createWorkItem} className="mt-4 grid gap-3 max-w-lg">
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="createWorkItemTitle">
                Title
              </label>
              <input
                id="createWorkItemTitle"
                name="title"
                required
                className="rounded-md border px-3 py-2 text-sm"
                disabled={!canWrite}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="createWorkItemDescription">
                Description
              </label>
              <textarea
                id="createWorkItemDescription"
                name="description"
                className="min-h-[72px] rounded-md border px-3 py-2 text-sm"
                disabled={!canWrite}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="text-sm font-medium" htmlFor="createWorkItemAssigneeId">
                  Assign to
                </label>
                <select
                  id="createWorkItemAssigneeId"
                  name="assigneeId"
                  defaultValue=""
                  className="rounded-md border px-3 py-2 text-sm"
                  disabled={!canWrite}
                >
                  <option value="">Unassigned</option>
                  {(employees ?? []).map((e) => (
                    <option key={e._id} value={String(e._id)}>
                      {String(e.name || e.email || e._id)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-1">
                <label className="text-sm font-medium" htmlFor="createWorkItemPriority">
                  Priority
                </label>
                <select
                  id="createWorkItemPriority"
                  name="priority"
                  defaultValue="medium"
                  className="rounded-md border px-3 py-2 text-sm"
                  disabled={!canWrite}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="createWorkItemDueDate">
                Due date
              </label>
              <input
                id="createWorkItemDueDate"
                name="dueDate"
                type="datetime-local"
                className="rounded-md border px-3 py-2 text-sm"
                disabled={!canWrite}
              />
            </div>
            <button className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
              Create
            </button>
          </form>
        </div>
      ) : null}

      {canManageServices ? (
        <div className="mt-6 rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Services</div>
          <div className="mt-2 text-2xl font-medium">Create client service</div>
          <form action={createClientService} className="mt-4 grid gap-3 max-w-2xl">
            <div className="grid gap-1">
              <div className="text-sm font-medium">Organization</div>
              <select name="organizationId" defaultValue="" className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
                <option value="" disabled>
                  Choose an organization…
                </option>
                {(organizations ?? []).map((o: any) => (
                  <option key={String(o._id)} value={String(o._id)}>
                    {String(o.name || o.contactEmail || o._id)}
                    {o.contactEmail ? ` (${String(o.contactEmail)})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <div className="text-sm font-medium">Title</div>
                <input name="title" className="rounded-md border px-3 py-2 text-sm" required disabled={!canWrite} />
              </div>
              <div className="grid gap-1">
                <div className="text-sm font-medium">Type</div>
                <select name="serviceType" defaultValue="other" className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="email">Email</option>
                  <option value="website">Website</option>
                  <option value="ads">Ads</option>
                  <option value="seo">SEO</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <div className="text-sm font-medium">Status</div>
                <select name="status" defaultValue="active" className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="grid gap-1">
                <div className="text-sm font-medium">Status note</div>
                <input name="statusNote" className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input name="clientCanToggle" type="checkbox" className="h-4 w-4" disabled={!canWrite} />
                Client can toggle
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input name="clientEnabled" type="checkbox" className="h-4 w-4" defaultChecked disabled={!canWrite} />
                Client enabled
              </label>
            </div>
            <button className="justify-self-start rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
              Create service
            </button>
          </form>

          <div className="mt-8 text-2xl font-medium">Services</div>
          <div className="mt-4 space-y-3">
            {(clientServices ?? []).map((s: any) => (
              <div key={String(s._id)} className="rounded-lg border px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{String(s.title || "")}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {String(s.organization?.name || s.organization?.contactEmail || "")}
                      {s.organization?.contactEmail ? ` • ${String(s.organization.contactEmail)}` : ""}
                      {s.serviceType ? ` • ${String(s.serviceType)}` : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">{String(s.status || "")}</div>
                </div>
                <form action={updateClientService} className="mt-3 grid gap-2">
                  <input type="hidden" name="id" value={String(s._id)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select name="status" defaultValue={String(s.status || "active")} className="rounded-md border px-3 py-2 text-sm">
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <input
                      name="statusNote"
                      defaultValue={String(s.statusNote || "")}
                      placeholder="Status note…"
                      className="rounded-md border px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        name="clientCanToggle"
                        type="checkbox"
                        className="h-4 w-4"
                        defaultChecked={Boolean(s.clientCanToggle)}
                        disabled={!canWrite}
                      />
                      Client can toggle
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        name="clientEnabled"
                        type="checkbox"
                        className="h-4 w-4"
                        defaultChecked={Boolean(s.clientEnabled)}
                        disabled={!canWrite}
                      />
                      Client enabled
                    </label>
                  </div>
                  <button className="justify-self-start rounded-md border px-3 py-1 text-sm" disabled={!canWrite}>
                    Update
                  </button>
                </form>
              </div>
            ))}
            {(clientServices ?? []).length === 0 ? <div className="text-sm text-muted-foreground">No services yet.</div> : null}
          </div>

          <div className="mt-8 text-2xl font-medium">Service requests</div>
          <div className="mt-4 space-y-3">
            {(openServiceRequests ?? []).map((r: any) => (
              <div key={String(r._id)} className="rounded-lg border px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {String(r.organization?.name || r.organization?.contactEmail || "Organization")} •{" "}
                      {String(r.requestedServiceType || "")}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {String(r.status || "")}
                      {r.createdAt ? ` • ${String(r.createdAt)}` : ""}
                      {r.clientAccount?.email ? ` • ${String(r.clientAccount.email)}` : ""}
                    </div>
                  </div>
                </div>
                {r.details ? <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{String(r.details)}</div> : null}
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
                <form action={updateServiceRequestStatus} className="mt-3 grid gap-2">
                  <input type="hidden" name="id" value={String(r._id)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select name="status" defaultValue={String(r.status || "submitted")} className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
                      <option value="submitted" disabled>
                        submitted
                      </option>
                      <option value="in_review">in_review</option>
                      <option value="approved">approved</option>
                      <option value="rejected">rejected</option>
                    </select>
                    <input
                      name="resolutionNote"
                      defaultValue={String(r.resolutionNote || "")}
                      placeholder="Resolution note…"
                      className="rounded-md border px-3 py-2 text-sm"
                      disabled={!canWrite}
                    />
                  </div>
                  <button className="justify-self-start rounded-md border px-3 py-1 text-sm" disabled={!canWrite}>
                    Update status
                  </button>
                </form>
              </div>
            ))}
            {(openServiceRequests ?? []).length === 0 ? (
              <div className="text-sm text-muted-foreground">No open service requests.</div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Work Items</div>
          <div className="mt-2 text-2xl font-medium">Unassigned</div>
          <div className="mt-4 space-y-3">
            {(unassignedWorkItems ?? []).map((w: any) => (
              <div key={w._id} className="rounded-lg border px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">{w.title}</div>
                  <div className="text-xs text-muted-foreground">{String(w.priority || "medium")}</div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="text-sm text-muted-foreground">{String(w.status || "")}</div>
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
                </div>
              </div>
            ))}
            {(unassignedWorkItems ?? []).length === 0 ? (
              <div className="text-sm text-muted-foreground">Nothing unassigned right now.</div>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">My Work</div>
          <div className="mt-2 text-2xl font-medium">Open</div>
          <div className="mt-4 space-y-3">
            {(myWorkItems ?? []).map((w: any) => (
              <div key={w._id} className="rounded-lg border px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">{w.title}</div>
                  <div className="text-xs text-muted-foreground">{String(w.priority || "medium")}</div>
                </div>
                {String(w.reassignmentRequestedAt || "") ? (
                  <div className="mt-1 text-sm text-amber-700">
                    Reassignment requested{w.reassignmentNote ? `: ${String(w.reassignmentNote)}` : ""}
                  </div>
                ) : null}
                {String(w.blockedReason || "") ? (
                  <div className="mt-1 text-sm text-amber-700">Blocked reason: {String(w.blockedReason)}</div>
                ) : null}
                {Number(w.commentsCount || 0) ? (
                  <div className="mt-1 text-xs text-muted-foreground">{Number(w.commentsCount)} comments</div>
                ) : null}
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
                <div className="mt-3 grid gap-2">
                  <form action={addWorkItemComment} className="flex items-start gap-2">
                    <input type="hidden" name="id" value={w._id} />
                    <textarea
                      name="message"
                      className="min-h-[42px] w-full rounded-md border px-2 py-1 text-sm"
                      placeholder="Add a comment…"
                      required
                    />
                    <button className="shrink-0 rounded-md border px-3 py-2 text-sm">Post</button>
                  </form>
                  {String(w.reassignmentRequestedAt || "") ? (
                    <form action={clearReassignmentRequest}>
                      <input type="hidden" name="id" value={w._id} />
                      <button className="rounded-md border px-3 py-1 text-sm">Clear reassignment request</button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
            {(myWorkItems ?? []).length === 0 ? (
              <div className="text-sm text-muted-foreground">No open work items assigned to you.</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border bg-card p-5">
        <div className="text-sm text-muted-foreground">Messages</div>
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
                    <Link className="text-sm underline" href={`/dashboard/manager/threads/${String(t._id)}`}>
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

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Intake</div>
          <div className="mt-2 text-2xl font-medium">New Signups</div>
          <div className="mt-4 space-y-3">
            {receivedSignups.map((s: any) => (
              <div key={s._id} className="rounded-lg border px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{String(s.name || s.email || "")}</div>
                    <div className="text-sm text-muted-foreground">
                      {String(s.event?.title || "Event")} • {String(s.event?.organizationName || "Organization")}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{String(s.status || "")}</div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">{String(s.email || "")}</div>
                  <form action={assignSignup} className="flex items-center gap-2">
                    <input type="hidden" name="signupId" value={s._id} />
                    <select name="assigneeId" className="rounded-md border px-2 py-1 text-sm" defaultValue={employees[0]?._id || ""}>
                      {(employees ?? []).map((e) => (
                        <option key={e._id} value={e._id}>
                          {e.name || e.email || e._id}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-md border px-3 py-1 text-sm" disabled={!employees.length}>
                      Assign
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {receivedSignups.length === 0 ? (
              <div className="text-sm text-muted-foreground">No new signups.</div>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Intake</div>
          <div className="mt-2 text-2xl font-medium">New Sponsorships</div>
          <div className="mt-4 space-y-3">
            {submittedSponsorships.map((sp: any) => (
              <div key={sp._id} className="rounded-lg border px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{String(sp.businessName || "Sponsorship")}</div>
                    <div className="text-sm text-muted-foreground">{String(sp.contactEmail || "")}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{String(sp.status || "")}</div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {sp.mealsCount ? `${sp.mealsCount} meals` : ""}{sp.location ? ` • ${sp.location}` : ""}
                  </div>
                  <form action={assignSponsorship} className="flex items-center gap-2">
                    <input type="hidden" name="sponsorshipId" value={sp._id} />
                    <select name="assigneeId" className="rounded-md border px-2 py-1 text-sm" defaultValue={employees[0]?._id || ""}>
                      {(employees ?? []).map((e) => (
                        <option key={e._id} value={e._id}>
                          {e.name || e.email || e._id}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-md border px-3 py-1 text-sm" disabled={!employees.length}>
                      Assign
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {submittedSponsorships.length === 0 ? (
              <div className="text-sm text-muted-foreground">No new sponsorships.</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border bg-card p-5">
        <div className="text-sm text-muted-foreground">Clients</div>
        <div className="mt-2 text-2xl font-medium">Requests</div>
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {openClientRequests.map((r: any) => (
            <div key={r._id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{String(r.subject || "")}</div>
                  <div className="text-sm text-muted-foreground">{String(r.clientEmail || "")}</div>
                </div>
                <div className="text-xs text-muted-foreground">{String(r.status || "")}</div>
              </div>
              {Array.isArray(r.statusHistory) && r.statusHistory.length ? (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {r.statusHistory.slice(-3).map((h: any, idx: number) => (
                    <div key={idx}>
                      {String(h.fromStatus || "")} → {String(h.toStatus || "")}
                      {h.changedAt ? ` • ${String(h.changedAt)}` : ""}
                      {h.changedBy?.name || h.changedBy?.email ? ` • ${String(h.changedBy?.name || h.changedBy?.email)}` : ""}
                    </div>
                  ))}
                </div>
              ) : null}
              {Array.isArray(r.messages) && r.messages.length ? (
                <div className="mt-4 space-y-2">
                  {r.messages
                    .filter((m: any) => String(m.visibility || "client") === "client")
                    .slice(-3)
                    .map((m: any, idx: number) => (
                      <div key={idx} className="rounded-md border px-3 py-2">
                        <div className="text-xs text-muted-foreground">
                          {String(m.author?.name || m.author?.email || "Unknown")} • {String(m.createdAt || "")}
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
              ) : null}
              <form action={updateClientRequest} className="mt-4 grid gap-2">
                <input type="hidden" name="id" value={r._id} />
                <select name="status" defaultValue={String(r.status || "submitted")} className="rounded-md border px-3 py-2 text-sm">
                  <option value="submitted">Submitted</option>
                  <option value="in_review">In Review</option>
                  <option value="responded">Responded</option>
                  <option value="closed">Closed</option>
                </select>
                <textarea
                  name="response"
                  defaultValue={String(r.response || "")}
                  className="min-h-[90px] rounded-md border px-3 py-2 text-sm"
                  placeholder="Response (optional)"
                />
                <button className="rounded-md border px-3 py-2 text-sm justify-self-start">Save</button>
              </form>
            </div>
          ))}
          {openClientRequests.length === 0 ? (
            <div className="text-sm text-muted-foreground">No open client requests.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
