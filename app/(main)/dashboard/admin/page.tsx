import { safeGetServerSession } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
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
import { AdminView } from "@/components/dashboard/admin/admin-view";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { updateDeliverableStatus, generateApprovalLink } from "@/app/actions/deliverables";

export const dynamic = "force-dynamic";

const IMPERSONATE_COOKIE = "impersonateAccountId";

async function requireActiveAdmin() {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return null;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct) return null;
  if (acct.status === "disabled") return null;
  if (String(acct.type || "").toLowerCase() !== "admin") return null;
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

async function upsertFeatureFlag(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "system.feature_flags.manage")) return;

  const id = String(formData.get("id") || "").trim();
  const keyRaw = String(formData.get("key") || "").trim();
  const key = keyRaw.toLowerCase();
  const enabled = String(formData.get("enabled") || "") === "on";
  const description = String(formData.get("description") || "").trim();

  if (!id && !key) return;
  const keyOk = key ? /^[a-z0-9][a-z0-9._-]*$/i.test(key) : true;
  if (!keyOk) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  if (id) {
    const existing = await writeClient.fetch(`*[_type == "featureFlag" && _id == $id][0]{_id, key}`, { id });
    if (!existing?._id) return;
    await writeClient.patch(id).set({ enabled, description: description || "" }).commit();
    await writeAuditLog({
      actorAccountId: String(admin.acct._id),
      action: "featureFlag.updated",
      targetId: String(existing._id),
      targetType: "featureFlag",
      targetLabel: String(existing.key || id),
      context: { id, enabled, description },
    });
    revalidatePath("/dashboard/admin");
    return;
  }

  const existingByKey = await writeClient.fetch(`*[_type == "featureFlag" && key == $key][0]{_id, key}`, { key });
  if (existingByKey?._id) {
    await writeClient.patch(String(existingByKey._id)).set({ enabled, description: description || "" }).commit();
    await writeAuditLog({
      actorAccountId: String(admin.acct._id),
      action: "featureFlag.updated",
      targetId: String(existingByKey._id),
      targetType: "featureFlag",
      targetLabel: String(existingByKey.key || key),
      context: { id: String(existingByKey._id), key, enabled, description },
    });
  } else {
    const created = await writeClient.create({
      _type: "featureFlag",
      key,
      enabled,
      description: description || "",
    });
    await writeAuditLog({
      actorAccountId: String(admin.acct._id),
      action: "featureFlag.created",
      targetId: String(created?._id || ""),
      targetType: "featureFlag",
      targetLabel: String(created?.key || key),
      context: { key, enabled, description },
    });
  }

  revalidatePath("/dashboard/admin");
}

async function deleteFeatureFlag(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "system.feature_flags.manage")) return;

  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const existing = await writeClient.fetch(`*[_type == "featureFlag" && _id == $id][0]{_id, key}`, { id });
  if (!existing?._id) return;

  await writeClient.delete(id);
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "featureFlag.deleted",
    targetId: String(existing._id),
    targetType: "featureFlag",
    targetLabel: String(existing.key || id),
    context: { id, key: String(existing.key || "") },
  });

  revalidatePath("/dashboard/admin");
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
  const avatarFile = formData.get("avatar") as File | null;

  if (!email) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  let avatarAssetId: string | undefined;
  if (avatarFile && avatarFile.size > 0) {
    try {
      const asset = await writeClient.assets.upload("image", avatarFile, {
        filename: avatarFile.name,
      });
      avatarAssetId = asset._id;
    } catch (e) {
      console.error("Failed to upload avatar", e);
    }
  }

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
      ...(avatarAssetId ? { avatar: { _type: "image", asset: { _type: "reference", _ref: avatarAssetId } } } : {}),
    });
    await writeAuditLog({
      actorAccountId: String(admin.acct._id),
      action: "account.created",
      targetId: String(created?._id || ""),
      targetType: "account",
      targetLabel: email,
      context: {
        email,
        name,
        type,
        status,
        passwordSet: Boolean(passwordHash),
        capabilities,
        revokedCapabilities,
        avatarUpdated: !!avatarAssetId,
      },
    });
  } else {
    const patch: Record<string, unknown> = { email, name, type, status, capabilities, revokedCapabilities };
    if (passwordHash) patch.passwordHash = passwordHash;
    if (avatarAssetId) {
      patch.avatar = { _type: "image", asset: { _type: "reference", _ref: avatarAssetId } };
    }
    await writeClient.patch(existing._id).set(patch).commit();
    await writeAuditLog({
      actorAccountId: String(admin.acct._id),
      action: "account.updated",
      targetId: String(existing._id),
      targetType: "account",
      targetLabel: email,
      context: {
        email,
        name,
        type,
        status,
        passwordUpdated: Boolean(passwordHash),
        capabilities,
        revokedCapabilities,
        avatarUpdated: !!avatarAssetId,
      },
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
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:5555").replace(
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

  const avatarFile = formData.get("avatar") as File | null;
  if (avatarFile && avatarFile.size > 0) {
    try {
      const asset = await writeClient.assets.upload("image", avatarFile, {
        contentType: avatarFile.type,
        filename: avatarFile.name,
      });
      patch.avatar = { _type: "image", asset: { _type: "reference", _ref: asset._id } };
    } catch (e) {
      console.error("Failed to upload avatar", e);
    }
  }

  await writeClient.patch(id).set(patch).commit();
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "account.updated",
    targetId: id,
    targetType: "account",
    targetLabel: id,
    context: { id, name, type, status, capabilities, revokedCapabilities, avatarUpdated: !!avatarFile },
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

async function deleteWorkItem(formData: FormData) {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "task.delete.all")) return;

  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const existing = await writeClient.fetch(`*[_type == "workItem" && _id == $id][0]{_id, title}`, { id });
  if (!existing?._id) return;

  await writeClient.delete(id);
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "workItem.deleted",
    targetId: id,
    targetType: "workItem",
    targetLabel: String(existing.title || id),
    context: { id },
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
  const clientId = String(formData.get("clientId") || "").trim();
  const status = String(formData.get("status") || "active").trim();
  const statusNote = String(formData.get("statusNote") || "").trim();
  const clientCanToggle = String(formData.get("clientCanToggle") || "") === "on";
  const clientEnabled = String(formData.get("clientEnabled") || "") === "on";
  if (!title || !clientId) return;
  if (!["instagram", "facebook", "email", "website", "ads", "seo", "other"].includes(serviceType)) return;
  if (!["active", "paused", "cancelled"].includes(status)) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const clientAcct = await writeClient.fetch(`*[_type == "account" && _id == $id && type == "client"][0]{_id}`, { id: clientId });
  if (!clientAcct?._id) return;

  const created = await writeClient.create({
    _type: "clientService",
    title,
    serviceType,
    client: { _type: "reference", _ref: clientId },
    status,
    statusNote: statusNote || undefined,
    clientCanToggle,
    clientEnabled,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "clientService.created",
    targetId: String(created?._id || ""),
    targetType: "clientService",
    targetLabel: title,
    context: { title, serviceType, clientId, status },
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
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "clientService.updated",
    targetId: id,
    targetType: "clientService",
    targetLabel: id,
    context: { id, status, clientCanToggle, clientEnabled },
  });

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
    `*[_type == "serviceRequest" && _id == $id][0]{_id, status, requestedServiceType, clientAccount->{_id}}`,
    { id },
  );
  if (!req?._id) return;

  const now = new Date().toISOString();

  if (status === "approved") {
    const clientId = String(req.clientAccount?._id || "");
    const requestedServiceType = String(req.requestedServiceType || "other");
    if (clientId && ["instagram", "facebook", "email", "website", "ads", "seo", "other"].includes(requestedServiceType)) {
      const existingService = await writeClient.fetch(
        `*[_type == "clientService" && client._ref == $clientId && serviceType == $type && status != "cancelled"][0]{_id}`,
        { clientId, type: requestedServiceType },
      );
      if (!existingService?._id) {
        await writeClient.create({
          _type: "clientService",
          title: requestedServiceType.charAt(0).toUpperCase() + requestedServiceType.slice(1),
          serviceType: requestedServiceType,
          client: { _type: "reference", _ref: clientId },
          status: "active",
          clientCanToggle: false,
          clientEnabled: true,
          createdAt: now,
          updatedAt: now,
        });

        // Sync to Supabase
        const clientEmail = await writeClient.fetch(`*[_type == "account" && _id == $id][0].email`, { id: clientId });
        if (clientEmail) {
            const { data: userData } = await supabaseAdmin
            .from("users")
            .select("organization_id")
            .eq("email", clientEmail)
            .single();

            if (userData?.organization_id) {
            await supabaseAdmin.from("client_services").insert({
                organization_id: userData.organization_id,
                name: `Service: ${requestedServiceType}`,
                service_type: requestedServiceType as any,
                status: "active",
                start_date: now.split("T")[0],
                monthly_budget: 0,
            });
            }
        }
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

  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "messageThread.dm_created",
    targetId: String(created?._id || ""),
    targetType: "messageThread",
    targetLabel: "Direct message",
    context: { recipientId },
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
      
      await writeAuditLog({
        actorAccountId: String(admin.acct._id),
        action: "messageThread.participant_added",
        targetId: String(existing._id),
        targetType: "messageThread",
        targetLabel: String(w.title || "Task thread"),
        context: { workItemId, addedParticipantId: adminId },
      });
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

  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "messageThread.task_created",
    targetId: String(created?._id || ""),
    targetType: "messageThread",
    targetLabel: `Task: ${String(w.title || "Work item")}`,
    context: { workItemId, participantsCount: participants.length },
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
  
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "user.impersonation_started",
    targetId: targetId,
    targetType: "account",
    targetLabel: String(target.email || targetId),
    context: { targetId, targetType: String(target.type || "employee") },
  });

  redirect(`/dashboard/${String(target.type || "employee")}`);
}

async function stopImpersonation() {
  "use server";
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "users.impersonate.read_only")) return;
  const cookieStore = await cookies();
  const impersonatedId = cookieStore.get(IMPERSONATE_COOKIE)?.value;
  cookieStore.delete(IMPERSONATE_COOKIE);

  if (impersonatedId) {
    await writeAuditLog({
      actorAccountId: String(admin.acct._id),
      action: "user.impersonation_stopped",
      targetId: impersonatedId,
      targetType: "account",
      targetLabel: impersonatedId,
      context: { impersonatedId },
    });
  }

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
  const canDeleteTasks = hasAccountCapability(acct, "task.delete.all");
  const canManageServices = hasAccountCapability(acct, "client.services.manage");
  const canManageFeatureFlags = hasAccountCapability(acct, "system.feature_flags.manage");
  const canViewLogs =
    hasAccountCapability(acct, "users.activity_logs.view") || hasAccountCapability(acct, "security.audit.view");

  const cookieStore = await cookies();
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value || "";

  const [
    accountsRes,
    employeesRes,
    unassignedWorkItemsRes,
    openWorkItemsRes,
    workItemTemplatesRes,
    openClientRequestsRes,
    clientServicesRes,
    openServiceRequestsRes,
    featureFlagsRes,
    myThreadsRes,
    auditLogsRes,
    impersonatedRes,
    invoicesRes,
    approvedBriefsRes,
    scheduleItemsRes,
    deliverablesRes,
  ] = await Promise.all([
    sanityFetch({
      query: `*[_type == "account"] | order(_createdAt desc){
        _id, email, name, type, status, capabilities, revokedCapabilities, avatar,
        "latestAnalytics": *[_type == "analyticsRecord" && client._ref == ^._id] | order(metricDate desc)[0..20]{metric, value, metricDate}
      }`,
    }),
    sanityFetch({
      query: `*[_type == "account" && type == "employee" && status != "disabled"] | order(name asc, email asc){_id, name, email, avatar}`,
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
        "commentsCount": count(comments),
        clientAccount->{_id, name, email}
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
            client->{_id, name, email}
          }`,
        })
      : Promise.resolve({ data: [] }),
    canManageServices
      ? sanityFetch({
          query: `*[_type == "serviceRequest" && status in ["submitted","in_review"]] | order(createdAt desc)[0..49]{
            _id, status, requestedServiceType, details, resolutionNote, createdAt, updatedAt,
            clientAccount->{_id, name, email},
            attachments[]{asset->{url, originalFilename}}
          }`,
        })
      : Promise.resolve({ data: [] }),
    canManageFeatureFlags
      ? sanityFetch({
          query: `*[_type == "featureFlag"] | order(key asc){_id, key, enabled, description, _updatedAt}`,
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
    sanityFetch({
      query: `*[_type == "invoice"] | order(issueDate desc)[0..49]{
        _id, number, issueDate, dueDate, status, totalAmount, currency,
        client->{_id, name, email}
      }`,
    }),
    (supabaseAdmin as any)
      .from("briefs")
      .select("assignee_id, price, status, updated_at")
      .in("status", ["assigned", "in_review", "client_review", "approved"]),
    sanityFetch({
      query: `*[_type == "scheduleItem"] | order(startsAt asc)[0..49]{
        _id, title, description, type, visibility, startsAt, endsAt, createdAt, updatedAt, changeRequested, changeRequestNote,
        "createdById": createdBy->_id,
        "participants": participants[]->{_id, name, email, type},
        relatedDeliverable->{_id}
      }`,
    }),
    sanityFetch({
      query: `*[_type == "deliverable"] | order(createdAt desc)[0..99]{
        _id, title, status, type, dueDate, createdAt, _updatedAt, description, price,
        "assigneeName": assignedTo->name,
        "assigneeEmail": assignedTo->email,
        "clientName": campaign->client->name,
        "versionCount": count(versionHistory),
        "latestVersion": versionHistory[-1],
        statusHistory[]{fromStatus, toStatus, changedAt, changedBy->{name, email}},
        approvalToken,
        approvalTokenExpiry,
        feedback[]{content, createdAt}
      }`,
    }),
  ]);

  const accounts = ((accountsRes as any)?.data ?? []) as any[];
  const employees = ((employeesRes as any)?.data ?? []) as Array<{ _id: string; name?: string; email?: string }>;
  const unassignedWorkItems = ((unassignedWorkItemsRes as any)?.data ?? []) as any[];
  const openWorkItems = ((openWorkItemsRes as any)?.data ?? []) as any[];
  const workItemTemplates = ((workItemTemplatesRes as any)?.data ?? []) as any[];
  const openClientRequests = ((openClientRequestsRes as any)?.data ?? []) as any[];
  const clientServices = ((clientServicesRes as any)?.data ?? []) as any[];
  const openServiceRequests = ((openServiceRequestsRes as any)?.data ?? []) as any[];
  const featureFlags = ((featureFlagsRes as any)?.data ?? []) as any[];
  const myThreads = ((myThreadsRes as any)?.data ?? []) as any[];
  const auditLogs = ((auditLogsRes as any)?.data ?? []) as any[];
  const impersonatedAccount = ((impersonatedRes as any)?.data ?? null) as any;
  const invoices = ((invoicesRes as any)?.data ?? []) as any[];
  const allBriefs = ((approvedBriefsRes as any)?.data ?? []) as any[];
  const deliverables = ((deliverablesRes as any)?.data ?? []) as any[];

  const clients = accounts.filter((a: any) => a.type === "client");

  const stats = {
    totalUsers: accounts.length,
    activeTasks: openWorkItems.length,
    pendingRequests: openClientRequests.length + openServiceRequests.length,
    totalRevenue: invoices.reduce((acc: number, inv: any) => acc + (inv.status === "paid" ? (inv.totalAmount || 0) : 0), 0),
  };

  const clientWorkload = clients.map((client: any) => {
    const tasksForClient = openWorkItems.filter(
      (item: any) => item.clientAccount?._id === client._id
    );
    const now = new Date();
    const activeTasks = tasksForClient.length;
    const highPriority = tasksForClient.filter(
      (item: any) => item.priority === "high"
    ).length;
    const overdue = tasksForClient.filter((item: any) => {
      if (!item.dueDate) return false;
      const due = new Date(item.dueDate);
      return due < now && item.status !== "done";
    }).length;

    return {
      clientName: client.name || client.email || "Unnamed client",
      clientEmail: client.email || "",
      activeTasks,
      highPriority,
      overdue,
    };
  }).filter((row: any) => row.activeTasks > 0);

  const editorStatsMap = allBriefs.reduce((map: Map<string, any>, brief: any) => {
    const assigneeId = brief.assignee_id;
    if (!assigneeId) return map;
    
    const existing = map.get(assigneeId) || { editorId: assigneeId, totalEarned: 0, jobsCompleted: 0, activeJobs: 0 };
    
    if (brief.status === "approved") {
        existing.totalEarned += (typeof brief.price === "number" ? brief.price : 0);
        existing.jobsCompleted += 1;
    } else {
        existing.activeJobs += 1;
    }
    
    map.set(assigneeId, existing);
    return map;
  }, new Map<string, any>());

  const editorPayoutsList = Array.from(editorStatsMap.values()).map((row) => {
    const account = accounts.find((a: any) => a._id === row.editorId);
    return {
      editorId: row.editorId,
      editorName: account?.name || account?.email || "Unnamed editor",
      editorEmail: account?.email || "",
      totalEarned: row.totalEarned,
      jobsCompleted: row.jobsCompleted,
      activeJobs: row.activeJobs,
    };
  });

  const scheduleItems = ((scheduleItemsRes as any)?.data ?? []) as any[];
  const scheduleByDeliverable = new Map<string, any>();
  for (const item of scheduleItems) {
    const dId = String((item as any)?.relatedDeliverable?._id || "");
    if (!dId) continue;
    if (!scheduleByDeliverable.has(dId)) {
      scheduleByDeliverable.set(dId, item);
    }
  }
  const deliverablesWithSchedule = (deliverables as any[]).map((d) => {
    const scheduled = scheduleByDeliverable.get(String(d._id));
    return scheduled
      ? {
          ...d,
          scheduledAt: String(scheduled.startsAt || ""),
        }
      : d;
  });
  const canCreateAny = hasAccountCapability(acct, "calendar.create");
  const canUpdateAny = hasAccountCapability(acct, "calendar.update");
  const canDeleteAny = hasAccountCapability(acct, "calendar.delete");
  const canAssignAny = hasAccountCapability(acct, "calendar.assign");
  const canCreateTeam = hasAccountCapability(acct, "calendar.team.create");
  const canUpdateTeam = hasAccountCapability(acct, "calendar.team.update");
  const canCreateOwn = hasAccountCapability(acct, "calendar.create.own");
  const canUpdateOwn = hasAccountCapability(acct, "calendar.update.own");
  const canRequestDateChange = hasAccountCapability(acct, "calendar.date_change.request");

  const calendarConfig = {
    items: scheduleItems,
    effectiveAcct: acct,
    effectiveType: type,
    isImpersonating: Boolean(impersonateId),
    canWrite: canWrite && !impersonateId,
    canCreate: canCreateAny || canCreateTeam || canCreateOwn,
    canUpdateAny,
    canUpdateTeam,
    canUpdateOwn,
    canDeleteAny,
    canRequestDateChange,
    allowParticipantIds: canAssignAny,
    allowClientVisibility: canAssignAny,
    isAdmin: true,
    isManager: false,
    isEmployee: false,
    isClient: false,
    acctId: String(acct._id || ""),
  };

  return (
    <AdminView
      data={{
        accounts,
        employees,
        openWorkItems,
        unassignedWorkItems,
        workItemTemplates,
        openClientRequests,
        clientServices,
        openServiceRequests,
        featureFlags,
        myThreads,
        auditLogs,
        invoices,
        impersonatedAccount,
        clientWorkload,
        editorPayouts: editorPayoutsList,
        stats,
        currentUser: { name, email },
        calendar: calendarConfig,
        deliverables: deliverablesWithSchedule,
      }}
      capabilities={{
        canCreateTasks,
        canInvite,
        canViewLogs,
        canAssign: hasAccountCapability(acct, "task.assign"),
        canRemove,
        canImpersonate,
        canSetTaskVisibility,
        canManageTaskTemplates,
        canDeleteTasks,
        canManageServices,
        canManageFeatureFlags,
      }}
      actions={{
        createWorkItem,
        assignWorkItem,
        deleteWorkItem,
        updateStatus: updateWorkItemStatus,
        updateDeliverableStatus,
        generateApprovalLink,
        inviteGoogleAccount,
        updateAccount,
        removeAccount,
        startImpersonation,
        stopImpersonation,
        createWorkItemTemplate,
        deleteWorkItemTemplate,
        createWorkItemFromTemplate,
        updateClientRequest,
        assignClientRequest,
        addClientRequestMessage,
        createClientService,
        updateClientService,
        updateServiceRequestStatus,
        upsertFeatureFlag,
        deleteFeatureFlag,
        createOrOpenDmThread,
        createOrOpenTaskThread,
        addWorkItemComment,
        clearReassignmentRequest,
        resetAccountSessions,
      }}
    />
  );
}
