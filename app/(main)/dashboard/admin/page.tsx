import { hasAccountCapability, safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

const IMPERSONATE_COOKIE = "impersonateAccountId";

async function requireActiveAdmin() {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return null;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct) return null;
  if (acct.status === "disabled") return null;
  if (acct.type !== "admin") return null;
  return { session, acct, email };
}

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

async function upsertAccount(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "users.capabilities.assign")) return;

  const email = String(formData.get("email") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "employee").trim();
  const status = String(formData.get("status") || "active").trim();
  const password = String(formData.get("password") || "");
  const capabilities = String(formData.get("capabilities") || "")
    .split(/[\n,]+/g)
    .map((v) => v.trim())
    .filter(Boolean);
  const revokedCapabilities = String(formData.get("revokedCapabilities") || "")
    .split(/[\n,]+/g)
    .map((v) => v.trim())
    .filter(Boolean);
  if (!email) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const existing = await fetchSanityAccountByEmail({ email });
  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

  if (!existing) {
    const created = await writeClient.create({
      _type: "account",
      email,
      name,
      type,
      status,
      capabilities,
      revokedCapabilities,
      sessionVersion: 1,
      ...(passwordHash ? { passwordHash } : {}),
    });
    await writeAuditLog({
      actorAccountId: String(admin.acct._id),
      action: "account.created",
      targetId: String(created?._id || ""),
      targetType: "account",
      targetLabel: email,
      context: { email, name, type, status, passwordSet: Boolean(passwordHash), capabilities, revokedCapabilities },
    });
  } else {
    const patch: Record<string, unknown> = { email, name, type, status, capabilities, revokedCapabilities };
    if (passwordHash) patch.passwordHash = passwordHash;
    await writeClient.patch(existing._id).set(patch).commit();
    await writeAuditLog({
      actorAccountId: String(admin.acct._id),
      action: "account.updated",
      targetId: String(existing._id),
      targetType: "account",
      targetLabel: email,
      context: { email, name, type, status, passwordUpdated: Boolean(passwordHash), capabilities, revokedCapabilities },
    });
  }

  revalidatePath("/dashboard/admin");
}

async function inviteGoogleAccount(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "users.invite")) return;

  const email = String(formData.get("email") || "").trim();
  const type = String(formData.get("type") || "employee").trim();
  if (!email) return;
  if (!["admin", "manager", "employee", "client"].includes(type)) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const existing = await fetchSanityAccountByEmail({ email });
  if (!existing) {
    const created = await writeClient.create({
      _type: "account",
      email,
      name: "",
      type,
      status: "active",
      sessionVersion: 1,
    });
    await writeAuditLog({
      actorAccountId: String(admin.acct._id),
      action: "account.invited_google",
      targetId: String(created?._id || ""),
      targetType: "account",
      targetLabel: email,
      context: { email, type, created: true },
    });
  } else {
    await writeClient.patch(existing._id).set({ status: "active", type }).commit();
    await writeAuditLog({
      actorAccountId: String(admin.acct._id),
      action: "account.invited_google",
      targetId: String(existing._id),
      targetType: "account",
      targetLabel: email,
      context: { email, type, created: false },
    });
  }

  if (process.env.RESEND_API_KEY) {
    const resendFrom = process.env.RESEND_FROM || "Optimise Operations <onboarding@resend.dev>";
    const resend = new Resend(process.env.RESEND_API_KEY);
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(
      /\/$/,
      "",
    );
    const loginUrl = `${baseUrl}/login?email=${encodeURIComponent(email)}`;
    await sendResendEmailWithFallback({
      resend,
      from: resendFrom,
      to: email,
      subject: "Your Optimise Operations access link",
      html: `<p>You’ve been granted access. Sign in with Google using <strong>${email}</strong>.</p><p><a href="${loginUrl}">Open sign-in</a></p>`,
    });
  }

  revalidatePath("/dashboard/admin");
}

async function updateAccount(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "users.capabilities.assign")) return;

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const capabilities = String(formData.get("capabilities") || "")
    .split(/[\n,]+/g)
    .map((v) => v.trim())
    .filter(Boolean);
  const revokedCapabilities = String(formData.get("revokedCapabilities") || "")
    .split(/[\n,]+/g)
    .map((v) => v.trim())
    .filter(Boolean);
  if (!id || !type || !status) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const patch: Record<string, unknown> = { type, status, name, capabilities, revokedCapabilities };
  await writeClient.patch(id).set(patch).commit();
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "account.updated",
    targetId: id,
    targetType: "account",
    targetLabel: id,
    context: { id, name, type, status, capabilities, revokedCapabilities },
  });

  revalidatePath("/dashboard/admin");
}

async function removeAccount(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "users.remove")) return;

  const id = String(formData.get("id") || "").trim();
  if (!id) return;
  if (id === String(admin.acct._id || "")) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const target = await writeClient.fetch(`*[_type == "account" && _id == $id][0]{_id, email, type}`, { id });
  if (!target?._id) return;

  await writeClient.delete(id);
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "account.removed",
    targetId: id,
    targetType: "account",
    targetLabel: String(target.email || id),
    context: { id, email: String(target.email || ""), type: String(target.type || "") },
  });

  revalidatePath("/dashboard/admin");
}

async function assignSignup(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "task.create")) return;
  if (!hasAccountCapability(admin.acct, "task.assign")) return;

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
    createdBy: { _type: "reference", _ref: String(admin.acct._id) },
    relatedSignup: { _type: "reference", _ref: signupId },
    ...(relatedEventRef ? { relatedEvent: relatedEventRef } : {}),
    ...(relatedOrgRef ? { relatedOrganization: relatedOrgRef } : {}),
    priority: "high",
    status: "todo",
    createdAt: new Date().toISOString(),
  });
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "workItem.created_from_signup",
    targetType: "signup",
    targetId: String(signupId),
    targetLabel: String(signup.name || signup.email || ""),
    context: { signupId, assigneeId },
  });

  revalidatePath("/dashboard/admin");
}

async function assignSponsorship(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "task.create")) return;
  if (!hasAccountCapability(admin.acct, "task.assign")) return;

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

  const created = await writeClient.create({
    _type: "workItem",
    title: `Handle sponsorship: ${String(sponsorship.businessName || sponsorship.contactEmail || "Unknown")}`,
    assignedTo: { _type: "reference", _ref: assigneeId },
    createdBy: { _type: "reference", _ref: String(admin.acct._id) },
    relatedSponsorship: { _type: "reference", _ref: sponsorshipId },
    priority: "high",
    status: "todo",
    createdAt: new Date().toISOString(),
  });
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "workItem.created_from_sponsorship",
    targetId: String(created?._id || ""),
    targetType: "workItem",
    targetLabel: String(created?.title || ""),
    context: { sponsorshipId, assigneeId },
  });

  revalidatePath("/dashboard/admin");
}

async function updateWorkItemStatus(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "task.status.override")) return;

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !status) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  await writeClient.patch(id).set({ status }).commit();
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "workItem.status_updated",
    targetId: id,
    targetType: "workItem",
    targetLabel: id,
    context: { id, status },
  });
  revalidatePath("/dashboard/admin");
}

async function assignWorkItem(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "task.assign")) return;

  const id = String(formData.get("id") || "");
  const assigneeId = String(formData.get("assigneeId") || "");
  if (!id || !assigneeId) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  await writeClient.patch(id).set({ assignedTo: { _type: "reference", _ref: assigneeId } }).commit();
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "workItem.assigned",
    targetId: id,
    targetType: "workItem",
    targetLabel: id,
    context: { id, assigneeId },
  });
  revalidatePath("/dashboard/admin");
}

async function createWorkItem(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "task.create")) return;

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priority = String(formData.get("priority") || "medium").trim();
  const dueDateRaw = String(formData.get("dueDate") || "").trim();
  const assigneeId = String(formData.get("assigneeId") || "").trim();
  const visibility = String(formData.get("visibility") || "internal").trim();
  if (!title) return;
  if (!["low", "medium", "high"].includes(priority)) return;
  if (!["internal", "client"].includes(visibility)) return;
  if (visibility !== "internal" && !hasAccountCapability(admin.acct, "task.visibility.set")) return;

  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
  if (dueDate && Number.isNaN(dueDate.getTime())) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  let assignedTo: { _type: "reference"; _ref: string } | undefined;
  if (assigneeId) {
    if (!hasAccountCapability(admin.acct, "task.assign")) return;
    const canAssign = await writeClient.fetch(
      `*[_type == "account" && _id == $id && status != "disabled" && type in ["admin","manager","employee"]][0]{_id, email, type}`,
      { id: assigneeId },
    );
    if (!canAssign?._id) return;
    assignedTo = { _type: "reference", _ref: assigneeId };
  }

  const created = await writeClient.create({
    _type: "workItem",
    title,
    description: description || undefined,
    visibility,
    createdBy: { _type: "reference", _ref: String(admin.acct._id) },
    ...(assignedTo ? { assignedTo } : {}),
    priority,
    status: "todo",
    createdAt: new Date().toISOString(),
    ...(dueDate ? { dueDate: dueDate.toISOString() } : {}),
  });

  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "workItem.created_manual",
    targetId: String(created?._id || ""),
    targetType: "workItem",
    targetLabel: String(created?.title || title),
    context: { priority, visibility, assigned: Boolean(assignedTo), dueDate: dueDate ? dueDate.toISOString() : "" },
  });

  revalidatePath("/dashboard/admin");
  redirect("/dashboard/admin");
}

async function createWorkItemTemplate(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "task.templates.manage")) return;

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priority = String(formData.get("priority") || "medium").trim();
  const visibilityRaw = String(formData.get("visibility") || "internal").trim();
  const visibility =
    visibilityRaw === "client" && !hasAccountCapability(admin.acct, "task.visibility.set") ? "internal" : visibilityRaw;
  if (!title) return;
  if (!["low", "medium", "high"].includes(priority)) return;
  if (!["internal", "client"].includes(visibility)) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const created = await writeClient.create({
    _type: "workItem",
    title,
    description: description || undefined,
    visibility,
    isTemplate: true,
    createdBy: { _type: "reference", _ref: String(admin.acct._id) },
    priority,
    status: "todo",
    createdAt: new Date().toISOString(),
  });

  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "workItemTemplate.created",
    targetId: String(created?._id || ""),
    targetType: "workItem",
    targetLabel: String(created?.title || title),
    context: { priority, visibility },
  });

  revalidatePath("/dashboard/admin");
  redirect("/dashboard/admin");
}

async function deleteWorkItemTemplate(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "task.templates.manage")) return;

  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const template = await writeClient.fetch(`*[_type == "workItem" && _id == $id && isTemplate == true][0]{_id, title}`, {
    id,
  });
  if (!template?._id) return;

  await writeClient.delete(id);
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "workItemTemplate.deleted",
    targetId: String(id),
    targetType: "workItem",
    targetLabel: String(template?.title || id),
    context: { id },
  });

  revalidatePath("/dashboard/admin");
}

async function createWorkItemFromTemplate(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "task.create")) return;

  const templateId = String(formData.get("templateId") || "").trim();
  const dueDateRaw = String(formData.get("dueDate") || "").trim();
  const assigneeId = String(formData.get("assigneeId") || "").trim();
  if (!templateId) return;

  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
  if (dueDate && Number.isNaN(dueDate.getTime())) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const template = await writeClient.fetch(
    `*[_type == "workItem" && _id == $id && isTemplate == true][0]{_id, title, description, priority, visibility}`,
    { id: templateId },
  );
  if (!template?._id) return;

  const visibility = String(template.visibility || "internal");
  if (visibility !== "internal" && !hasAccountCapability(admin.acct, "task.visibility.set")) return;

  let assignedTo: { _type: "reference"; _ref: string } | undefined;
  if (assigneeId) {
    if (!hasAccountCapability(admin.acct, "task.assign")) return;
    const canAssign = await writeClient.fetch(
      `*[_type == "account" && _id == $id && status != "disabled" && type in ["admin","manager","employee"]][0]{_id}`,
      { id: assigneeId },
    );
    if (!canAssign?._id) return;
    assignedTo = { _type: "reference", _ref: assigneeId };
  }

  const created = await writeClient.create({
    _type: "workItem",
    title: String(template.title || "Work item"),
    description: String(template.description || "") || undefined,
    visibility,
    createdBy: { _type: "reference", _ref: String(admin.acct._id) },
    ...(assignedTo ? { assignedTo } : {}),
    priority: String(template.priority || "medium"),
    status: "todo",
    createdAt: new Date().toISOString(),
    ...(dueDate ? { dueDate: dueDate.toISOString() } : {}),
  });

  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "workItem.created_from_template",
    targetId: String(created?._id || ""),
    targetType: "workItem",
    targetLabel: String(created?.title || ""),
    context: { templateId, assigned: Boolean(assignedTo), dueDate: dueDate ? dueDate.toISOString() : "" },
  });

  revalidatePath("/dashboard/admin");
  redirect("/dashboard/admin");
}

async function updateClientRequest(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "support.ticket.manage")) return;

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const response = String(formData.get("response") || "");
  if (!id || !status) return;
  if (!["submitted", "in_review", "responded", "closed"].includes(status)) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const existing = await writeClient.fetch(`*[_type == "clientRequest" && _id == $id][0]{_id, status}`, { id });
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
        changedBy: { _type: "reference", _ref: String(admin.acct._id) },
        changedAt,
      },
    ]);
  }
  const shouldAppendResponseMessage = response && status === "responded";
  if (shouldAppendResponseMessage) {
    p.setIfMissing({ messages: [] }).append("messages", [
      {
        _type: "clientRequestMessage",
        author: { _type: "reference", _ref: String(admin.acct._id) },
        visibility: "client",
        message: response,
        createdAt: new Date().toISOString(),
      },
    ]);
  }
  await p.commit();
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "clientRequest.updated",
    targetId: id,
    targetType: "clientRequest",
    targetLabel: id,
    context: { id, fromStatus, toStatus, responded: status === "responded", responseLength: response.length },
  });
  revalidatePath("/dashboard/admin");
}

async function assignClientRequest(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "support.ticket.manage")) return;

  const id = String(formData.get("id") || "");
  const assigneeId = String(formData.get("assigneeId") || "");
  if (!id || !assigneeId) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  await writeClient
    .patch(id)
    .set({
      assignedTo: { _type: "reference", _ref: assigneeId },
      updatedAt: new Date().toISOString(),
    })
    .commit();
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "clientRequest.assigned",
    targetId: id,
    targetType: "clientRequest",
    targetLabel: id,
    context: { id, assigneeId },
  });

  revalidatePath("/dashboard/admin");
}

async function addClientRequestMessage(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "support.ticket.manage")) return;

  const id = String(formData.get("id") || "");
  const visibility = String(formData.get("visibility") || "client");
  const message = String(formData.get("message") || "").trim();
  if (!id || !message) return;
  if (visibility !== "client" && visibility !== "internal") return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  await writeClient
    .patch(id)
    .setIfMissing({ messages: [] })
    .append("messages", [
      {
        _type: "clientRequestMessage",
        author: { _type: "reference", _ref: String(admin.acct._id) },
        visibility,
        message,
        createdAt: new Date().toISOString(),
      },
    ])
    .set({ updatedAt: new Date().toISOString() })
    .commit();
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "clientRequest.message_added",
    targetId: id,
    targetType: "clientRequest",
    targetLabel: id,
    context: { id, visibility, messageLength: message.length },
  });

  revalidatePath("/dashboard/admin");
}

async function createClientService(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "client.services.manage")) return;
  const cookieStore = await cookies();
  if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;

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

  const org = await writeClient.fetch(`*[_type == "organization" && _id == $id][0]{_id}`, { id: organizationId });
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

  revalidatePath("/dashboard/admin");
}

async function updateClientService(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "client.services.manage")) return;
  const cookieStore = await cookies();
  if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;

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

  const existing = await writeClient.fetch(`*[_type == "clientService" && _id == $id][0]{_id}`, { id });
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

  revalidatePath("/dashboard/admin");
}

async function updateServiceRequestStatus(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "client.services.manage")) return;
  const cookieStore = await cookies();
  if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;

  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const resolutionNote = String(formData.get("resolutionNote") || "").trim();
  if (!id) return;
  if (!["in_review", "approved", "rejected"].includes(status)) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const req = await writeClient.fetch(
    `*[_type == "serviceRequest" && _id == $id][0]{_id, status, requestedServiceType, organization->{_id}}`,
    { id },
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
    patch.resolvedBy = { _type: "reference", _ref: String(admin.acct._id) };
  }

  await writeClient.patch(id).set(patch).commit();

  revalidatePath("/dashboard/admin");
}

async function createOrOpenDmThread(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "message.create")) return;

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
    { a: String(admin.acct._id), b: recipientId },
  );
  if (existing?._id) {
    revalidatePath("/dashboard/admin");
    redirect(`/dashboard/admin/threads/${String(existing._id)}`);
  }

  const created = await writeClient.create({
    _type: "messageThread",
    title: "Direct message",
    type: "dm",
    visibility: "internal",
    participants: [
      { _type: "reference", _ref: String(admin.acct._id) },
      { _type: "reference", _ref: recipientId },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  });

  revalidatePath("/dashboard/admin");
  redirect(`/dashboard/admin/threads/${String(created?._id || "")}`);
}

async function createOrOpenTaskThread(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "message.create")) return;

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

  const existing = await writeClient.fetch(
    `*[_type == "messageThread" && type == "task" && visibility == "internal" && relatedWorkItem._ref == $id][0]{_id, participants[]._ref}`,
    { id: workItemId },
  );
  if (existing?._id) {
    const participants = Array.isArray(existing.participants) ? existing.participants : [];
    const adminId = String(admin.acct._id);
    if (!participants.includes(adminId)) {
      await writeClient
        .patch(String(existing._id))
        .set({ updatedAt: new Date().toISOString() })
        .setIfMissing({ participants: [] })
        .append("participants", [{ _type: "reference", _ref: adminId }])
        .commit();
    }
    revalidatePath("/dashboard/admin");
    redirect(`/dashboard/admin/threads/${String(existing._id)}`);
  }

  const participants = Array.from(new Set([createdById, assignedId, String(admin.acct._id)])).map((id) => ({
    _type: "reference",
    _ref: id,
  }));

  const created = await writeClient.create({
    _type: "messageThread",
    title: `Task: ${String(w.title || "Work item")}`,
    type: "task",
    visibility: "internal",
    relatedWorkItem: { _type: "reference", _ref: String(w._id) },
    participants,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  });

  revalidatePath("/dashboard/admin");
  redirect(`/dashboard/admin/threads/${String(created?._id || "")}`);
}

async function addWorkItemComment(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "task.comment")) return;

  const id = String(formData.get("id") || "");
  const message = String(formData.get("message") || "").trim();
  if (!id || !message) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  await writeClient
    .patch(id)
    .setIfMissing({ comments: [] })
    .append("comments", [
      {
        _type: "workItemComment",
        author: { _type: "reference", _ref: String(admin.acct._id) },
        message,
        createdAt: new Date().toISOString(),
      },
    ])
    .commit();
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "workItem.comment_added",
    targetId: id,
    targetType: "workItem",
    targetLabel: id,
    context: { id, messageLength: message.length },
  });

  revalidatePath("/dashboard/admin");
}

async function clearReassignmentRequest(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "task.reassign.manage")) return;

  const id = String(formData.get("id") || "");
  if (!id) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  await writeClient.patch(id).unset(["reassignmentRequestedAt", "reassignmentNote"]).commit();
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "workItem.reassignment_cleared",
    targetId: id,
    targetType: "workItem",
    targetLabel: id,
    context: { id },
  });
  revalidatePath("/dashboard/admin");
}

async function resetAccountSessions(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "users.sessions.reset")) return;

  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  await writeClient.patch(id).setIfMissing({ sessionVersion: 0 }).inc({ sessionVersion: 1 }).commit();
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "account.sessions_reset",
    targetId: id,
    targetType: "account",
    targetLabel: id,
    context: { id },
  });
  revalidatePath("/dashboard/admin");
}

async function startImpersonation(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "users.impersonate.read_only")) return;

  const targetId = String(formData.get("targetId") || "").trim();
  if (!targetId) return;

  const { data } = await sanityFetch({
    query: `*[_type == "account" && _id == $id][0]{_id, type, status}`,
    params: { id: targetId },
    perspective: "published",
  });
  const target = data as any;
  if (!target?._id) return;
  if (String(target.status || "") === "disabled") return;

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_COOKIE, targetId, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect(`/dashboard/${String(target.type || "employee")}`);
}

async function stopImpersonation() {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "users.impersonate.read_only")) return;
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_COOKIE);
  redirect("/dashboard/admin");
}

export default async function AdminDashboardPage() {
  const session = await safeGetServerSession();
  if (!session) {
    redirect("/login?next=/dashboard/admin");
  }

  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  const type = String(acct?.type || (session as any)?.type || "");
  if (!type) {
    redirect("/login?error=no_account&next=/dashboard/admin");
  }
  if (String((acct as any)?.status || "") === "disabled") {
    redirect("/login?error=disabled&next=/dashboard/admin");
  }
  if (type !== "admin") {
    redirect("/dashboard");
  }

  const name = String((session as any)?.user?.name || "");
  const canWrite = Boolean(process.env.SANITY_API_WRITE_TOKEN);
  const canInvite = hasAccountCapability(acct, "users.invite");
  const canRemove = hasAccountCapability(acct, "users.remove");
  const canImpersonate = hasAccountCapability(acct, "users.impersonate.read_only");
  const canCreateTasks = hasAccountCapability(acct, "task.create");
  const canSetTaskVisibility = hasAccountCapability(acct, "task.visibility.set");
  const canManageTaskTemplates = hasAccountCapability(acct, "task.templates.manage");
  const canManageServices = hasAccountCapability(acct, "client.services.manage");
  const canViewLogs =
    hasAccountCapability(acct, "users.activity_logs.view") || hasAccountCapability(acct, "security.audit.view");

  const cookieStore = await cookies();
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value || "";

  const [
    accountsRes,
    employeesRes,
    organizationsRes,
    receivedSignupsRes,
    submittedSponsorshipsRes,
    unassignedWorkItemsRes,
    openWorkItemsRes,
    workItemTemplatesRes,
    openClientRequestsRes,
    clientServicesRes,
    openServiceRequestsRes,
    myThreadsRes,
    auditLogsRes,
    impersonatedRes,
  ] = await Promise.all([
    sanityFetch({
      query: `*[_type == "account"] | order(_createdAt desc){_id, email, name, type, status, capabilities, revokedCapabilities}`,
    }),
    sanityFetch({
      query: `*[_type == "account" && type == "employee" && status != "disabled"] | order(name asc, email asc){_id, name, email}`,
    }),
    sanityFetch({
      query: `*[_type == "organization"] | order(name asc){_id, name, contactEmail}`,
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
      query: `*[_type == "workItem" && (!defined(isTemplate) || isTemplate != true) && status != "done" && !defined(assignedTo)] | order(priority desc, dueDate asc, createdAt desc)[0..9]{
        _id, title, status, priority, dueDate, createdAt
      }`,
    }),
    sanityFetch({
      query: `*[_type == "workItem" && (!defined(isTemplate) || isTemplate != true) && status != "done"] | order(priority desc, dueDate asc, createdAt desc)[0..14]{
        _id, title, status, priority, dueDate, createdAt,
        "assigneeName": assignedTo->name,
        "assigneeEmail": assignedTo->email,
        blockedReason, reassignmentRequestedAt, reassignmentNote,
        "commentsCount": count(comments)
      }`,
    }),
    canManageTaskTemplates
      ? sanityFetch({
          query: `*[_type == "workItem" && isTemplate == true] | order(title asc)[0..49]{
            _id, title, description, priority, visibility, createdAt
          }`,
        })
      : Promise.resolve({ data: [] }),
    sanityFetch({
      query: `*[_type == "clientRequest" && status in ["submitted","in_review"]] | order(createdAt desc)[0..9]{
        _id, subject, status, createdAt, clientEmail, response, assignedTo->{_id, name, email},
        statusHistory[]{fromStatus, toStatus, changedAt, changedBy->{name, email}},
        "commentCount": count(messages),
        "attachmentCount": count(messages[].attachments[]),
        messages[]{
          message, createdAt, visibility,
          author->{name, email},
          attachments[]{asset->{url, originalFilename}}
        }
      }`,
    }),
    canManageServices
      ? sanityFetch({
          query: `*[_type == "clientService"] | order(coalesce(updatedAt, createdAt) desc)[0..49]{
            _id, title, serviceType, status, statusNote, clientCanToggle, clientEnabled, createdAt, updatedAt,
            organization->{_id, name, contactEmail}
          }`,
        })
      : Promise.resolve({ data: [] }),
    canManageServices
      ? sanityFetch({
          query: `*[_type == "serviceRequest" && status in ["submitted","in_review"]] | order(createdAt desc)[0..49]{
            _id, status, requestedServiceType, details, resolutionNote, createdAt, updatedAt,
            organization->{_id, name, contactEmail},
            clientAccount->{_id, name, email},
            attachments[]{asset->{url, originalFilename}}
          }`,
        })
      : Promise.resolve({ data: [] }),
    sanityFetch({
      query: `*[_type == "messageThread" && $acctId in participants[]._ref] | order(coalesce(updatedAt, createdAt) desc)[0..9]{
        _id, title, type, visibility, createdAt, updatedAt,
        "readStates": readStates[]{user, lastReadAt},
        "messageCount": count(messages),
        "recentMessages": messages[-3..-1]{message, createdAt, author->{name, email}, attachments[]{asset->{url, originalFilename}}},
        "lastMessage": messages[-1]{message, createdAt, author->{name, email}, attachments[]{asset->{url, originalFilename}}},
        "participants": participants[]->{_id, name, email, type}
      }`,
      params: { acctId: String(acct?._id || "") },
    }),
    canViewLogs
      ? sanityFetch({
          query: `*[_type == "auditLog"] | order(createdAt desc, _createdAt desc)[0..49]{
            _id, action, createdAt, targetType, targetLabel, context,
            actor->{_id, name, email, type}
          }`,
        })
      : Promise.resolve({ data: [] }),
    impersonateId && canImpersonate
      ? sanityFetch({
          query: `*[_type == "account" && _id == $id][0]{_id, email, name, type, status}`,
          params: { id: impersonateId },
        })
      : Promise.resolve({ data: null }),
  ]);

  const accounts = ((accountsRes as any)?.data ?? []) as any[];
  const employees = ((employeesRes as any)?.data ?? []) as Array<{ _id: string; name?: string; email?: string }>;
  const organizations = ((organizationsRes as any)?.data ?? []) as any[];
  const receivedSignups = ((receivedSignupsRes as any)?.data ?? []) as any[];
  const submittedSponsorships = ((submittedSponsorshipsRes as any)?.data ?? []) as any[];
  const unassignedWorkItems = ((unassignedWorkItemsRes as any)?.data ?? []) as any[];
  const openWorkItems = ((openWorkItemsRes as any)?.data ?? []) as any[];
  const workItemTemplates = ((workItemTemplatesRes as any)?.data ?? []) as any[];
  const openClientRequests = ((openClientRequestsRes as any)?.data ?? []) as any[];
  const clientServices = ((clientServicesRes as any)?.data ?? []) as any[];
  const openServiceRequests = ((openServiceRequestsRes as any)?.data ?? []) as any[];
  const myThreads = ((myThreadsRes as any)?.data ?? []) as any[];
  const auditLogs = ((auditLogsRes as any)?.data ?? []) as any[];
  const impersonatedAccount = ((impersonatedRes as any)?.data ?? null) as any;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <div className="text-sm text-muted-foreground">Welcome{name ? `, ${name}` : ""}</div>
      </div>

      {!canWrite ? (
        <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700">
          Missing SANITY_API_WRITE_TOKEN: account updates are disabled.
        </div>
      ) : null}

      {canCreateTasks ? (
        <div className="mt-6 rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Tasks</div>
          <div className="mt-2 text-2xl font-medium">Create work item</div>
          <form action={createWorkItem} className="mt-4 grid gap-3 max-w-xl">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
                  {(accounts ?? [])
                    .filter((a: any) => String(a.status || "") !== "disabled")
                    .filter((a: any) => ["admin", "manager", "employee"].includes(String(a.type || "")))
                    .map((a: any) => (
                      <option key={String(a._id)} value={String(a._id)}>
                        {String(a.name || a.email || a._id)} ({String(a.type || "")})
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
              <div className="grid gap-1">
                <label className="text-sm font-medium" htmlFor="createWorkItemVisibility">
                  Visibility
                </label>
                <select
                  id="createWorkItemVisibility"
                  name="visibility"
                  defaultValue="internal"
                  className="rounded-md border px-3 py-2 text-sm"
                  disabled={!canWrite || !canSetTaskVisibility}
                >
                  <option value="internal">Internal</option>
                  <option value="client">Client visible</option>
                </select>
              </div>
            </div>
            <button className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
              Create
            </button>
          </form>
        </div>
      ) : null}

      {canManageTaskTemplates ? (
        <div className="mt-6 rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Tasks</div>
          <div className="mt-2 text-2xl font-medium">Task templates</div>

          <form action={createWorkItemTemplate} className="mt-4 grid gap-3 max-w-xl">
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="createTemplateTitle">
                Title
              </label>
              <input
                id="createTemplateTitle"
                name="title"
                required
                className="rounded-md border px-3 py-2 text-sm"
                disabled={!canWrite}
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="createTemplateDescription">
                Description
              </label>
              <textarea
                id="createTemplateDescription"
                name="description"
                className="min-h-[72px] rounded-md border px-3 py-2 text-sm"
                disabled={!canWrite}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="grid gap-1">
                <label className="text-sm font-medium" htmlFor="createTemplatePriority">
                  Priority
                </label>
                <select
                  id="createTemplatePriority"
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
              <div className="grid gap-1">
                <label className="text-sm font-medium" htmlFor="createTemplateVisibility">
                  Visibility
                </label>
                <select
                  id="createTemplateVisibility"
                  name="visibility"
                  defaultValue="internal"
                  className="rounded-md border px-3 py-2 text-sm"
                  disabled={!canWrite || !canSetTaskVisibility}
                >
                  <option value="internal">Internal</option>
                  <option value="client">Client visible</option>
                </select>
              </div>
            </div>
            <button className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
              Create template
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {(workItemTemplates ?? []).map((t: any) => (
              <div key={String(t._id)} className="rounded-lg border px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{String(t.title || "Template")}</div>
                    <div className="text-xs text-muted-foreground">
                      {String(t.priority || "medium")} • {String(t.visibility || "internal")}
                    </div>
                    {String(t.description || "") ? (
                      <div className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{String(t.description)}</div>
                    ) : null}
                  </div>
                  <form action={deleteWorkItemTemplate}>
                    <input type="hidden" name="id" value={String(t._id)} />
                    <button className="rounded-md border px-3 py-1 text-sm" disabled={!canWrite}>
                      Delete
                    </button>
                  </form>
                </div>

                <form action={createWorkItemFromTemplate} className="mt-4 grid grid-cols-1 lg:grid-cols-4 gap-2">
                  <input type="hidden" name="templateId" value={String(t._id)} />
                  <select name="assigneeId" defaultValue="" className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
                    <option value="">Unassigned</option>
                    {(accounts ?? [])
                      .filter((a: any) => String(a.status || "") !== "disabled")
                      .filter((a: any) => ["admin", "manager", "employee"].includes(String(a.type || "")))
                      .map((a: any) => (
                        <option key={String(a._id)} value={String(a._id)}>
                          {String(a.name || a.email || a._id)} ({String(a.type || "")})
                        </option>
                      ))}
                  </select>
                  <input
                    name="dueDate"
                    type="datetime-local"
                    className="rounded-md border px-3 py-2 text-sm"
                    disabled={!canWrite}
                  />
                  <button className="rounded-md border px-3 py-2 text-sm lg:col-span-2" disabled={!canWrite}>
                    Create work item from template
                  </button>
                </form>
              </div>
            ))}
            {(workItemTemplates ?? []).length === 0 ? (
              <div className="text-sm text-muted-foreground">No templates yet.</div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Accounts</div>
          <div className="mt-2 text-2xl font-medium">Invite with Google</div>
          {canInvite ? (
            <form action={inviteGoogleAccount} className="mt-4 grid gap-3">
              <input name="email" type="email" placeholder="user@company.com" required className="rounded-md border px-3 py-2 text-sm" />
              <select name="type" className="rounded-md border px-3 py-2 text-sm" defaultValue="employee">
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
                <option value="client">Client</option>
              </select>
              <button className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
                Invite
              </button>
              {!process.env.RESEND_API_KEY ? (
                <div className="text-xs text-muted-foreground">
                  RESEND_API_KEY is missing: invite emails are disabled (account will still be created).
                </div>
              ) : null}
            </form>
          ) : (
            <div className="mt-4 text-sm text-muted-foreground">Your account can’t invite users.</div>
          )}

          {canImpersonate ? (
            <div className="mt-6">
              <div className="text-sm text-muted-foreground">Impersonation</div>
              {impersonatedAccount?._id ? (
                <div className="mt-2 rounded-md border px-3 py-2 text-sm">
                  <div className="font-medium">Read-only: {String(impersonatedAccount.email || impersonatedAccount._id)}</div>
                  <div className="text-muted-foreground capitalize">{String(impersonatedAccount.type || "")}</div>
                  <form action={stopImpersonation} className="mt-2">
                    <button className="rounded-md border px-3 py-1 text-sm">Stop</button>
                  </form>
                </div>
              ) : null}
              <form action={startImpersonation} className="mt-3 grid gap-2">
                <select name="targetId" className="rounded-md border px-3 py-2 text-sm" defaultValue="">
                  <option value="" disabled>
                    Select an account…
                  </option>
                  {(accounts ?? [])
                    .filter((a) => String(a.status || "") !== "disabled")
                    .map((a) => (
                      <option key={String(a._id)} value={String(a._id)}>
                        {String(a.email || a._id)} ({String(a.type || "")})
                      </option>
                    ))}
                </select>
                <button className="rounded-md border px-3 py-2 text-sm">Impersonate (read-only)</button>
              </form>
            </div>
          ) : null}

          <div className="mt-8 text-2xl font-medium">Create / update</div>
          <form action={upsertAccount} className="mt-4 grid gap-3">
            <input name="email" type="email" placeholder="Email" required className="rounded-md border px-3 py-2 text-sm" />
            <input name="name" placeholder="Name" className="rounded-md border px-3 py-2 text-sm" />
            <select name="type" className="rounded-md border px-3 py-2 text-sm" defaultValue="employee">
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="employee">Employee</option>
              <option value="client">Client</option>
            </select>
            <select name="status" className="rounded-md border px-3 py-2 text-sm" defaultValue="active">
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
            <textarea
              name="capabilities"
              placeholder="Extra capabilities (comma or newline separated)"
              className="min-h-[80px] rounded-md border px-3 py-2 text-sm"
            />
            <textarea
              name="revokedCapabilities"
              placeholder="Revoked capabilities (comma or newline separated)"
              className="min-h-[80px] rounded-md border px-3 py-2 text-sm"
            />
            <input
              name="password"
              type="password"
              placeholder="Set/reset password (optional)"
              className="rounded-md border px-3 py-2 text-sm"
            />
            <button className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
              Save
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Accounts</div>
          <div className="mt-2 text-2xl font-medium">All</div>
          <div className="mt-4 space-y-3">
            {(accounts ?? []).map((a) => (
              <form key={a._id} action={updateAccount} className="rounded-lg border px-3 py-2">
                <input type="hidden" name="id" value={String(a._id)} />
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{String(a.email || "")}</div>
                    <div className="mt-1">
                      <input
                        name="name"
                        defaultValue={String(a.name || "")}
                        placeholder="Name"
                        className="w-full rounded-md border px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select name="type" defaultValue={String(a.type || "employee")} className="rounded-md border px-2 py-1 text-sm">
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="employee">Employee</option>
                      <option value="client">Client</option>
                    </select>
                    <select name="status" defaultValue={String(a.status || "active")} className="rounded-md border px-2 py-1 text-sm">
                      <option value="active">Active</option>
                      <option value="disabled">Disabled</option>
                    </select>
                    <details className="w-full">
                      <summary className="cursor-pointer text-sm text-muted-foreground">Capabilities</summary>
                      <div className="mt-2 grid gap-2">
                        <textarea
                          name="capabilities"
                          defaultValue={Array.isArray((a as any).capabilities) ? (a as any).capabilities.join("\n") : ""}
                          placeholder="Extra capabilities (comma or newline separated)"
                          className="min-h-[80px] w-full rounded-md border px-2 py-1 text-sm"
                        />
                        <textarea
                          name="revokedCapabilities"
                          defaultValue={
                            Array.isArray((a as any).revokedCapabilities) ? (a as any).revokedCapabilities.join("\n") : ""
                          }
                          placeholder="Revoked capabilities (comma or newline separated)"
                          className="min-h-[80px] w-full rounded-md border px-2 py-1 text-sm"
                        />
                      </div>
                    </details>
                    <div className="flex flex-wrap items-center gap-2">
                      <button className="rounded-md border px-3 py-1 text-sm" disabled={!canWrite}>
                        Update
                      </button>
                      <button
                        className="rounded-md border px-3 py-1 text-sm"
                        formAction={resetAccountSessions}
                        disabled={!canWrite}
                      >
                        Reset sessions
                      </button>
                      <button
                        className="rounded-md border px-3 py-1 text-sm text-red-700"
                        formAction={removeAccount}
                        disabled={!canWrite || !canRemove || String(a._id) === String(acct?._id || "")}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ))}
            {(accounts ?? []).length === 0 ? (
              <div className="text-sm text-muted-foreground">No accounts yet.</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Intake</div>
          <div className="mt-2 text-2xl font-medium">Signups</div>
          <div className="mt-1 text-sm text-muted-foreground">{receivedSignups.length} received</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Intake</div>
          <div className="mt-2 text-2xl font-medium">Sponsorships</div>
          <div className="mt-1 text-sm text-muted-foreground">{submittedSponsorships.length} submitted</div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Operations</div>
          <div className="mt-2 text-2xl font-medium">Work items</div>
          <div className="mt-1 text-sm text-muted-foreground">{unassignedWorkItems.length} unassigned</div>
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
                    <button className="rounded-md border px-3 py-1 text-sm" disabled={!employees.length || !canWrite}>
                      Assign
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {receivedSignups.length === 0 ? <div className="text-sm text-muted-foreground">No new signups.</div> : null}
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
                    <button className="rounded-md border px-3 py-1 text-sm" disabled={!employees.length || !canWrite}>
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

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Work Items</div>
          <div className="mt-2 text-2xl font-medium">Unassigned</div>
          <div className="mt-4 space-y-3">
            {unassignedWorkItems.map((w: any) => (
              <div key={w._id} className="rounded-lg border px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">{w.title}</div>
                  <div className="text-xs text-muted-foreground">{String(w.priority || "medium")}</div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <form action={assignWorkItem} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={w._id} />
                    <select name="assigneeId" className="rounded-md border px-2 py-1 text-sm" defaultValue={employees[0]?._id || ""}>
                      {(employees ?? []).map((e) => (
                        <option key={e._id} value={e._id}>
                          {e.name || e.email || e._id}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-md border px-3 py-1 text-sm" disabled={!employees.length || !canWrite}>
                      Assign
                    </button>
                  </form>
                  <form action={updateWorkItemStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={w._id} />
                    <select name="status" defaultValue={String(w.status || "todo")} className="rounded-md border px-2 py-1 text-sm">
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="done">Done</option>
                    </select>
                    <button className="rounded-md border px-3 py-1 text-sm" disabled={!canWrite}>
                      Update
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {unassignedWorkItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nothing unassigned right now.</div>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Work Items</div>
          <div className="mt-2 text-2xl font-medium">Open</div>
          <div className="mt-4 space-y-3">
            {openWorkItems.map((w: any) => (
              <div key={w._id} className="rounded-lg border px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="font-medium">{w.title}</div>
                  <div className="text-xs text-muted-foreground">{String(w.priority || "medium")}</div>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {w.assigneeName || w.assigneeEmail ? `Assigned: ${String(w.assigneeName || w.assigneeEmail)}` : "Unassigned"}
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
                  <form action={updateWorkItemStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={w._id} />
                    <select name="status" defaultValue={String(w.status || "todo")} className="rounded-md border px-2 py-1 text-sm">
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="blocked">Blocked</option>
                      <option value="done">Done</option>
                    </select>
                    <button className="rounded-md border px-3 py-1 text-sm" disabled={!canWrite}>
                      Update
                    </button>
                  </form>
                  <div className="flex items-center gap-2">
                    <form action={assignWorkItem} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={w._id} />
                      <select name="assigneeId" className="rounded-md border px-2 py-1 text-sm" defaultValue={employees[0]?._id || ""}>
                        {(employees ?? []).map((e) => (
                          <option key={e._id} value={e._id}>
                            {e.name || e.email || e._id}
                          </option>
                        ))}
                      </select>
                      <button className="rounded-md border px-3 py-1 text-sm" disabled={!employees.length || !canWrite}>
                        Reassign
                      </button>
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
                    <button className="shrink-0 rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
                      Post
                    </button>
                  </form>
                  {String(w.reassignmentRequestedAt || "") ? (
                    <form action={clearReassignmentRequest}>
                      <input type="hidden" name="id" value={w._id} />
                      <button className="rounded-md border px-3 py-1 text-sm" disabled={!canWrite}>
                        Clear reassignment request
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
            {openWorkItems.length === 0 ? <div className="text-sm text-muted-foreground">No open work items.</div> : null}
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
            {(accounts ?? [])
              .filter((a: any) => String(a._id || "") !== String(acct?._id || "") && String(a.status || "") !== "disabled")
              .filter((a: any) => ["admin", "manager", "employee"].includes(String(a.type || "")))
              .map((a: any) => (
                <option key={a._id} value={String(a._id)}>
                  {String(a.name || a.email || a._id)} ({String(a.type || "")})
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
            const effectiveAccountId = String(acct?._id || "");
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
                    <Link className="text-sm underline" href={`/dashboard/admin/threads/${String(t._id)}`}>
                      Open
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
          {(myThreads ?? []).length === 0 ? <div className="text-sm text-muted-foreground">No messages yet.</div> : null}
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
                  <div className="mt-1 text-xs text-muted-foreground">
                    {r?.assignedTo?.name || r?.assignedTo?.email
                      ? `Assigned: ${String(r.assignedTo?.name || r.assignedTo?.email)}`
                      : "Unassigned"}
                    {` • ${Number(r.commentCount || 0)} messages`}
                    {Number(r.attachmentCount || 0) ? ` • ${Number(r.attachmentCount || 0)} attachments` : ""}
                  </div>
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

              <form action={assignClientRequest} className="mt-3 flex items-center gap-2">
                <input type="hidden" name="id" value={r._id} />
                <select
                  name="assigneeId"
                  className="w-full rounded-md border px-2 py-1 text-sm"
                  defaultValue={String(r?.assignedTo?._id || employees[0]?._id || "")}
                >
                  {(employees ?? []).map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name || e.email || e._id}
                    </option>
                  ))}
                </select>
                <button className="shrink-0 rounded-md border px-3 py-2 text-sm" disabled={!employees.length || !canWrite}>
                  Assign
                </button>
              </form>

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
                <button className="rounded-md border px-3 py-2 text-sm justify-self-start" disabled={!canWrite}>
                  Save
                </button>
              </form>

              <form action={addClientRequestMessage} className="mt-4 grid gap-2">
                <input type="hidden" name="id" value={r._id} />
                <div className="flex items-center gap-2">
                  <select name="visibility" defaultValue="client" className="rounded-md border px-3 py-2 text-sm">
                    <option value="client">Client Visible</option>
                    <option value="internal">Internal</option>
                  </select>
                  <button className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
                    Post message
                  </button>
                </div>
                <textarea
                  name="message"
                  className="min-h-[80px] rounded-md border px-3 py-2 text-sm"
                  placeholder="Write a message…"
                  required
                />
              </form>
            </div>
          ))}
          {openClientRequests.length === 0 ? <div className="text-sm text-muted-foreground">No open client requests.</div> : null}
        </div>
      </div>

      {canManageServices ? (
        <div className="mt-8 rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Clients</div>
          <div className="mt-2 text-2xl font-medium">Services</div>

          <div className="mt-4 rounded-lg border p-4">
            <div className="font-medium">Create service</div>
            <form action={createClientService} className="mt-3 grid gap-3 max-w-2xl">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input name="title" className="rounded-md border px-3 py-2 text-sm" placeholder="Title" required disabled={!canWrite} />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select name="status" defaultValue="active" className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <input name="statusNote" className="rounded-md border px-3 py-2 text-sm" placeholder="Status note (optional)" disabled={!canWrite} />
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
                Create
              </button>
            </form>
          </div>

          <div className="mt-6 space-y-3">
            {(clientServices ?? []).map((s: any) => (
              <div key={String(s._id)} className="rounded-lg border px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{String(s.title || "")}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {String(s.organization?.name || s.organization?.contactEmail || "")}
                      {s.serviceType ? ` • ${String(s.serviceType)}` : ""}
                      {s.status ? ` • ${String(s.status)}` : ""}
                    </div>
                  </div>
                </div>
                <form action={updateClientService} className="mt-3 grid gap-2">
                  <input type="hidden" name="id" value={String(s._id)} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select name="status" defaultValue={String(s.status || "active")} className="rounded-md border px-3 py-2 text-sm" disabled={!canWrite}>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <input
                      name="statusNote"
                      defaultValue={String(s.statusNote || "")}
                      placeholder="Status note…"
                      className="rounded-md border px-3 py-2 text-sm"
                      disabled={!canWrite}
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
                      {r.clientAccount?.email ? ` • ${String(r.clientAccount.email)}` : ""}
                      {r.createdAt ? ` • ${String(r.createdAt)}` : ""}
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

      {canViewLogs ? (
        <div className="mt-8 rounded-xl border bg-card p-5">
          <div className="text-sm text-muted-foreground">Security</div>
          <div className="mt-2 text-2xl font-medium">Audit logs</div>
          <div className="mt-4 space-y-2">
            {(auditLogs ?? []).map((l: any) => (
              <div key={String(l._id)} className="rounded-lg border px-3 py-2">
                <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{String(l.action || "")}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {String(l.actor?.name || l.actor?.email || "Unknown")}{" "}
                      {String(l.actor?.type || "") ? `(${String(l.actor.type)})` : ""}{" "}
                      {String(l.targetType || "") ? `• ${String(l.targetType)}` : ""}{" "}
                      {String(l.targetLabel || "") ? `• ${String(l.targetLabel)}` : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground">
                    {String(l.createdAt || "") ? new Date(String(l.createdAt)).toLocaleString() : ""}
                  </div>
                </div>
                {String(l.context || "") ? (
                  <pre className="mt-2 whitespace-pre-wrap break-words rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
                    {String(l.context)}
                  </pre>
                ) : null}
              </div>
            ))}
            {(auditLogs ?? []).length === 0 ? <div className="text-sm text-muted-foreground">No logs yet.</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
