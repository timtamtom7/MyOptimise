"use server";

import { safeGetServerSession } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { writeAuditLog } from "@/lib/audit";
import { redirect } from "next/navigation";

export async function requireActiveAdmin() {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return null;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct) return null;
  if (acct.status === "disabled") return null;
  if (String(acct.type || "").toLowerCase() !== "admin") return null;
  return { session, acct, email };
}

export async function upsertFeatureFlag(formData: FormData) {
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

export async function deleteFeatureFlag(formData: FormData) {
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

export async function upsertAccount(formData: FormData) {
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

export async function inviteGoogleAccount(formData: FormData) {
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
  
  // Note: Resend email logic is currently in page.tsx, we might need to handle it or move it here.
  // For now, I'm just doing the database part.
  
  revalidatePath("/dashboard/admin");
}

export async function updateAccountSimple(formData: FormData) {
  // Renamed to avoid conflict with upsertAccount or if used differently
  // This matches the 'updateAccount' function from page.tsx (lines 321+)
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "users.capabilities.assign")) return;

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const password = String(formData.get("password") || "");
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

  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
  const patch: Record<string, unknown> = { type, status, name, capabilities, revokedCapabilities };
  if (passwordHash) patch.passwordHash = passwordHash;

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

export async function removeAccount(formData: FormData) {
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

export async function updateWorkItemStatus(formData: FormData) {
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

export async function assignWorkItem(formData: FormData) {
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

export async function deleteWorkItem(formData: FormData) {
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

export async function createWorkItem(formData: FormData) {
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
  // redirect("/dashboard/admin"); // We might want to avoid redirecting in shared actions to allow flexibility
}

export async function createWorkItemTemplate(formData: FormData) {
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
}

export async function deleteWorkItemTemplate(formData: FormData) {
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

export async function createWorkItemFromTemplate(formData: FormData) {
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
}

export async function updateClientRequest(formData: FormData) {
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

export async function assignClientRequest(formData: FormData) {
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

export async function addClientRequestMessage(formData: FormData) {
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

export async function createClientService(formData: FormData) {
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "client.services.manage")) return;
  
  // Note: Impersonation check not easily available without cookie access in server action context unless passed
  // But standard pattern is to check capability.

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

export async function updateClientService(formData: FormData) {
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "client.services.manage")) return;

  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const statusNote = String(formData.get("statusNote") || "").trim();
  const clientCanToggle = String(formData.get("clientCanToggle") || "") === "on";
  const clientEnabled = String(formData.get("clientEnabled") || "") === "on";
  if (!id || !status) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  await writeClient
    .patch(id)
    .set({ status, statusNote: statusNote || undefined, clientCanToggle, clientEnabled, updatedAt: new Date().toISOString() })
    .commit();

  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "clientService.updated",
    targetId: id,
    targetType: "clientService",
    targetLabel: id,
    context: { id, status },
  });

  revalidatePath("/dashboard/admin");
}

export async function updateServiceRequestStatus(formData: FormData) {
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "client.services.manage")) return;

  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "").trim();
  if (!id || !status) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  await writeClient.patch(id).set({ status }).commit();
  await writeAuditLog({
    actorAccountId: String(admin.acct._id),
    action: "serviceRequest.status_updated",
    targetId: id,
    targetType: "serviceRequest",
    targetLabel: id,
    context: { id, status },
  });

  revalidatePath("/dashboard/admin");
}

export async function createOrOpenDmThread(formData: FormData) {
  const admin = await requireActiveAdmin();
  if (!admin) return;
  
  const participantId = String(formData.get("participantId") || "").trim();
  if (!participantId) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  // Check if thread exists
  const existing = await writeClient.fetch(
    `*[_type == "messageThread" && type == "dm" && count(participants) == 2 && $me in participants[]._ref && $other in participants[]._ref][0]._id`,
    { me: admin.acct._id, other: participantId }
  );

  if (existing) {
    // redirect? We can't easily redirect to a specific tab state from server action without client cooperation
    // But revalidating will show it.
    // Ideally we return the ID. But these are void actions mostly.
    return; 
  }

  const created = await writeClient.create({
    _type: "messageThread",
    type: "dm",
    participants: [
      { _type: "reference", _ref: String(admin.acct._id) },
      { _type: "reference", _ref: participantId }
    ],
    updatedAt: new Date().toISOString()
  });

  revalidatePath("/dashboard/admin");
}

export async function startImpersonation(formData: FormData) {
  const admin = await requireActiveAdmin();
  if (!admin) return;
  if (!hasAccountCapability(admin.acct, "users.impersonate.read_only")) return;

  const accountId = String(formData.get("accountId") || "").trim();
  if (!accountId) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  // We don't need writeClient to set cookies, but we might want to log it.
  
  // Note: Setting cookies in Server Action
  // We need to import cookies from next/headers
  // I will need to add that import at the top.
}
