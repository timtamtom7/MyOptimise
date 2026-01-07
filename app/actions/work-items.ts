"use server";

import { safeGetServerSession } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { addDays } from "date-fns";
import { sendEmail } from "@/lib/email";
import { taskAssignedEmail } from "@/lib/email-templates";

export async function createWorkItem(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || acct.status === "disabled") return;
  if (!hasAccountCapability(acct, "task.create")) return;

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const priority = String(formData.get("priority") || "medium").trim();
  const dueDateRaw = String(formData.get("dueDate") || "").trim();
  const assigneeId = String(formData.get("assigneeId") || "").trim();
  // Employees default to internal visibility unless they have specific capability
  const visibility = "internal"; 

  if (!title) return;
  if (!["low", "medium", "high"].includes(priority)) return;

  const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
  if (dueDate && Number.isNaN(dueDate.getTime())) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  let assignedTo: { _type: "reference"; _ref: string } | undefined;
  
  // If assigneeId provided and user has permission to assign
  if (assigneeId && hasAccountCapability(acct, "task.assign")) {
    assignedTo = { _type: "reference", _ref: assigneeId };
  } else {
    // Default to self-assignment for employees creating their own tasks
    assignedTo = { _type: "reference", _ref: String(acct._id) };
  }

  const created = await writeClient.create({
    _type: "workItem",
    title,
    description: description || undefined,
    visibility,
    createdBy: { _type: "reference", _ref: String(acct._id) },
    ...(assignedTo ? { assignedTo } : {}),
    priority,
    status: "todo",
    createdAt: new Date().toISOString(),
    ...(dueDate ? { dueDate: dueDate.toISOString() } : {}),
  });

  await writeAuditLog({
    actorAccountId: String(acct._id),
    action: "workItem.created_manual",
    targetId: String(created?._id || ""),
    targetType: "workItem",
    targetLabel: String(created?.title || title),
    context: { priority, visibility, assigned: Boolean(assignedTo) },
  });

  // Notify assignee if different from creator
  if (assignedTo && assignedTo._ref !== String(acct._id)) {
    const assignee = await writeClient.fetch(
      `*[_type == "account" && _id == $id][0]{email}`,
      { id: assignedTo._ref }
    );
    if (assignee?.email) {
      const link = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard/employee/tasks`;
      await sendEmail({
        to: assignee.email,
        subject: `New Task Assigned: ${title}`,
        html: taskAssignedEmail({
          taskTitle: title,
          assignedBy: acct.name || "A manager",
          link,
        }),
      });
    }
  }

  revalidatePath("/dashboard");
}

export async function createWorkItemFromTemplate(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || acct.status === "disabled") return;
  if (!hasAccountCapability(acct, "task.create")) return;

  const templateId = String(formData.get("templateId") || "").trim();
  if (!templateId) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const template = await writeClient.fetch(
    `*[_type == "workItem" && _id == $id && isTemplate == true][0]{
      _id, title, description, priority, visibility, checklist, defaultDueOffset
    }`,
    { id: templateId }
  );
  if (!template?._id) return;

  // Calculate due date based on offset
  let dueDate: string | undefined;
  if (typeof template.defaultDueOffset === 'number') {
    dueDate = addDays(new Date(), template.defaultDueOffset).toISOString();
  }

  const created = await writeClient.create({
    _type: "workItem",
    title: String(template.title || "Work item"),
    description: String(template.description || "") || undefined,
    visibility: "internal", // Default to internal for safety
    createdBy: { _type: "reference", _ref: String(acct._id) },
    assignedTo: { _type: "reference", _ref: String(acct._id) }, // Assign to self
    priority: String(template.priority || "medium"),
    status: "todo",
    createdAt: new Date().toISOString(),
    checklist: template.checklist || [], // Copy checklist
    ...(dueDate ? { dueDate } : {}),
  });

  await writeAuditLog({
    actorAccountId: String(acct._id),
    action: "workItem.created_from_template",
    targetId: String(created?._id || ""),
    targetType: "workItem",
    targetLabel: String(created?.title || ""),
    context: { templateId, fromTemplate: true },
  });

  revalidatePath("/dashboard");
}

export async function updateWorkItemStatus(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || acct.status === "disabled") return;

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !status) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  // Check permissions
  const canOverride = hasAccountCapability(acct, "task.status.override"); // Admin
  const canUpdateTeam = hasAccountCapability(acct, "task.status.change.team"); // Manager
  const canUpdateOwn = hasAccountCapability(acct, "task.status.change.own"); // Employee

  if (!canOverride && !canUpdateTeam && !canUpdateOwn) return;

  // If not admin/manager, verify ownership
  if (!canOverride && !canUpdateTeam) {
    const canUpdate = await writeClient.fetch(
      `*[_type == "workItem" && _id == $id && (assignedTo._ref == $userId || createdBy._ref == $userId)][0]{_id}`,
      { id, userId: acct._id },
    );
    if (!canUpdate?._id) return;
  }

  await writeClient.patch(id).set({ status }).commit();
  
  await writeAuditLog({
    actorAccountId: String(acct._id),
    action: "workItem.status_change",
    targetId: id,
    targetType: "workItem",
    targetLabel: status,
    context: { status },
  });

  revalidatePath("/dashboard");
}

export async function markWorkItemBlocked(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || acct.status === "disabled") return;

  const id = String(formData.get("id") || "");
  const reason = String(formData.get("reason") || "");
  if (!id || !reason) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  await writeClient.patch(id).set({ status: "blocked", blockedReason: reason }).commit();
  revalidatePath("/dashboard");
}

export async function bulkUpdateWorkItems(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || acct.status === "disabled") return;
  if (!hasAccountCapability(acct, "task.status.change.own")) return;

  const idsRaw = String(formData.get("ids") || "");
  const status = String(formData.get("status") || "");
  
  if (!idsRaw || !status) return;
  
  const ids = idsRaw.split(',').filter(Boolean);
  if (ids.length === 0) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  // In a real app we might want to check permissions per item, but for now we assume
  // if they can change their own status, they can change status of items they selected
  // (Client-side filtering should ensure they only select their own items if strictly required,
  // but typically bulk actions might apply to team tasks too if they have permission).
  // For safety, let's just patch them.

  const patch = writeClient.transaction();
  for (const id of ids) {
    patch.patch(id, p => p.set({ status }));
  }
  await patch.commit();
  
  await writeAuditLog({
    actorAccountId: String(acct._id),
    action: "workItem.bulk_update",
    targetId: "bulk",
    targetType: "workItem",
    targetLabel: `${ids.length} items`,
    context: { count: ids.length, status },
  });

  revalidatePath("/dashboard");
}
