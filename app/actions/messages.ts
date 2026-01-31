"use server";

import { client } from "@/sanity/lib/client";
import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { hasAccountCapability } from "@/lib/capabilities";
import { sendEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import crypto from "crypto";

const IMPERSONATE_COOKIE = "impersonateAccountId";

export async function markThreadRead(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;
  const cookieStore = await cookies();
  if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || acct.status === "disabled" || acct.type !== "employee") return;
  if (!hasAccountCapability(acct, "message.read")) return;

  const threadId = String(formData.get("threadId") || "").trim();
  if (!threadId) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const thread = await writeClient.fetch(
    `*[_type == "messageThread" && _id == $id][0]{
      _id,
      participants[]._ref,
      "readStates": readStates[]{user, lastReadAt},
      "messages": messages[]{createdAt}
    }`,
    { id: threadId },
  );
  if (!thread?._id) return;
  if (!Array.isArray(thread.participants) || !thread.participants.includes(String(acct._id))) return;

  const lastMessageAt =
    Array.isArray(thread.messages) && thread.messages.length
      ? thread.messages
          .map((m: any) => String(m?.createdAt || ""))
          .filter(Boolean)
          .sort()
          .slice(-1)[0]
      : new Date().toISOString();

  const existingReadStates = Array.isArray(thread.readStates) ? thread.readStates : [];
  const updatedReadStates = [
    ...existingReadStates.filter((rs: any) => String(rs?.user?._ref || "") !== String(acct._id)),
    { _type: "threadReadState", user: { _type: "reference", _ref: String(acct._id) }, lastReadAt: lastMessageAt },
  ];

  await writeClient.patch(threadId).set({ readStates: updatedReadStates }).commit();
  revalidatePath(`/dashboard/employee/threads/${threadId}`);
}

export async function toggleMessageReaction(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;
  const cookieStore = await cookies();
  if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || acct.status === "disabled" || acct.type !== "employee") return;
  if (!hasAccountCapability(acct, "message.react")) return;

  const threadId = String(formData.get("threadId") || "").trim();
  const messageKey = String(formData.get("messageKey") || "").trim();
  const emoji = String(formData.get("emoji") || "").trim();
  if (!threadId || !messageKey || !emoji) return;

  const allowedEmojis = new Set(["👍", "✅", "❤️", "🎉", "😂"]);
  if (!allowedEmojis.has(emoji)) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const thread = await writeClient.fetch(
    `*[_type == "messageThread" && _id == $id][0]{
      _id,
      participants[]._ref,
      "msg": messages[_key == $messageKey][0]{
        _key,
        "reactions": reactions[]{_key, emoji, createdAt, "userId": user._ref}
      }
    }`,
    { id: threadId, messageKey },
  );
  if (!thread?._id) return;
  if (!Array.isArray(thread.participants) || !thread.participants.includes(String(acct._id))) return;
  if (!thread.msg?._key) return;

  const currentReactions = Array.isArray(thread.msg.reactions) ? thread.msg.reactions : [];
  const alreadyReacted = currentReactions.some(
    (r: any) => String(r?.emoji || "") === emoji && String(r?.userId || "") === String(acct._id),
  );

  const now = new Date().toISOString();
  const nextReactions = alreadyReacted
    ? currentReactions.filter(
        (r: any) => !(String(r?.emoji || "") === emoji && String(r?.userId || "") === String(acct._id)),
      )
    : [
        ...currentReactions,
        {
          _key: crypto.randomUUID(),
          emoji,
          user: { _type: "reference", _ref: String(acct._id) },
          createdAt: now,
        },
      ];

  const reactionsPath = `messages[_key==${JSON.stringify(messageKey)}].reactions`;
  await writeClient
    .patch(threadId)
    .set({
      updatedAt: now,
      [reactionsPath]: nextReactions.map((r: any) => ({
        _key: String(r?._key || crypto.randomUUID()),
        emoji: String(r?.emoji || ""),
        user: { _type: "reference", _ref: String(r?.user?._ref || r?.userId || "") },
        createdAt: String(r?.createdAt || now),
        _type: "threadMessageReaction",
      })),
    })
    .commit();

  revalidatePath(`/dashboard/employee/threads/${threadId}`);
}

export async function getOrCreateThreadForDocument(docId: string, docType: string, docTitle: string, clientId: string) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) throw new Error("Unauthorized");
  
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct) throw new Error("Unauthorized");

  let threadType = "dm";
  let relatedField = "";
  
  if (docType === "contentItem") {
    threadType = "content";
    relatedField = "relatedContentItem";
  } else if (docType === "invoice") {
    threadType = "invoice";
    relatedField = "relatedInvoice";
  } else if (docType === "workItem") {
    threadType = "task";
    relatedField = "relatedWorkItem";
  }

  if (!relatedField) throw new Error("Unsupported document type");

  // Check if thread exists
  const existing = await client.fetch(
    `*[_type == "messageThread" && ${relatedField}._ref == $docId][0]._id`,
    { docId }
  );
  
  if (existing) return existing;
  
  const writeToken = process.env.SANITY_API_WRITE_TOKEN;
  if (!writeToken) throw new Error("Configuration Error");
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
  
  const doc = await writeClient.create({
    _type: "messageThread",
    title: `Chat: ${docTitle}`,
    type: threadType,
    [relatedField]: { _type: "reference", _ref: docId },
    relatedClient: { _type: "reference", _ref: clientId },
    visibility: "internal",
    participants: [{ _type: "reference", _ref: acct._id }],
    updatedAt: new Date().toISOString(),
    readStates: [],
    messages: []
  });
  
  revalidatePath("/dashboard/employee/messages");
  return doc._id;
}

export async function postThreadMessage(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;
  
  const cookieStore = await cookies();
  if (cookieStore.get(IMPERSONATE_COOKIE)?.value) return; 
  
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || acct.status === "disabled") return;

  const threadId = String(formData.get("threadId") || "").trim();
  const message = String(formData.get("message") || "").trim();
  if (!threadId || !message) return;
  const attachment = formData.get("attachment");

  const writeToken = process.env.SANITY_API_WRITE_TOKEN;
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const thread = await writeClient.fetch(
    `*[_type == "messageThread" && _id == $id][0]{
        _id, 
        visibility, 
        "participants": participants[]->{_id, email, type}, 
        readStates
    }`,
    { id: threadId }
  );
  if (!thread) return;

  if (!thread.participants?.some((p: any) => p._id === acct._id)) return;

  const requiresApproval = hasAccountCapability(acct, "chat.requires_approval");
  const status = requiresApproval ? "pending_approval" : "sent";

  const now = new Date().toISOString();
  
  let uploadedAssetId: string | null = null;
  if (attachment && typeof attachment !== "string") {
      const file = attachment as File;
      if (file.size > 0) {
        const asset = await writeClient.assets.upload("file", file, { filename: file.name });
        uploadedAssetId = String(asset?._id || "");
      }
  }

  const messageVisibility = String(thread.visibility || "") === "client" ? "client" : "internal";

  if (status === "pending_approval") {
      const managers = thread.participants.filter((p: any) => p.type === "manager" || p.type === "admin");
      const emails = managers.map((p: any) => p.email).filter(Boolean);
      if (emails.length > 0) {
          await sendEmail({
              to: emails,
              subject: "Action Required: Pending Message Approval",
              html: `
                <p>User <strong>${acct.name}</strong> has posted a message that requires approval.</p>
                <p>Thread ID: ${threadId}</p>
                <p>Message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"</p>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/manager/threads/${threadId}">Review Message</a></p>
              `
          });
      }
  }

  const existingReadStates = Array.isArray(thread.readStates) ? thread.readStates : [];
  const updatedReadStates = [
      ...existingReadStates.filter((rs: any) => String(rs?.user?._ref || "") !== String(acct._id)),
      { _type: "threadReadState", user: { _type: "reference", _ref: String(acct._id) }, lastReadAt: now },
  ];

  await writeClient
      .patch(threadId)
      .setIfMissing({ messages: [], readStates: [] })
      .set({ updatedAt: now, readStates: updatedReadStates })
      .append("messages", [
        {
          _type: "threadMessage",
          author: { _type: "reference", _ref: String(acct._id) },
          visibility: messageVisibility,
          message,
          createdAt: now,
          status,
          ...(uploadedAssetId
            ? { attachments: [{ _type: "file", asset: { _type: "reference", _ref: uploadedAssetId } }] }
            : {}),
        },
      ])
      .commit();

  const segment = acct.type === "employee" ? "messages" : "threads";
  revalidatePath(`/dashboard/${acct.type}/${segment}/${threadId}`);
  if (acct.type === 'employee') {
      revalidatePath(`/dashboard/manager/threads/${threadId}`);
  }
}

export async function createOrOpenDmThread(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || acct.status === "disabled") return;

  const recipientId = String(formData.get("recipientId") || "").trim();
  if (!recipientId) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN;
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const query = `*[_type == "messageThread" && type == "dm" && count(participants) == 2 && $u1 in participants[]._ref && $u2 in participants[]._ref][0]{_id}`;
  const existing = await writeClient.fetch(query, { u1: acct._id, u2: recipientId });

  if (existing?._id) {
    return { success: true, threadId: String(existing._id) };
  }

  const created = await writeClient.create({
    _type: "messageThread",
    type: "dm",
    visibility: "internal",
    participants: [
      { _type: "reference", _ref: acct._id },
      { _type: "reference", _ref: recipientId }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: []
  });

  return { success: true, threadId: String(created._id) };
}

export async function createOrOpenTaskThread(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || acct.status === "disabled" || acct.type !== "employee") return;

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
    return { success: true, threadId: String(existing._id) };
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
  return { success: true, threadId: String(created?._id || "") };
}

export async function approveMessageByKey(threadId: string, messageKey: string) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled") return;
    
    if (acct.type !== "manager" && acct.type !== "admin") return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN;
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
    
    const now = new Date().toISOString();

    // Query to find the message path? 
    // Easier to just use `messages[_key=="${messageKey}"]` in patch.
    
    await writeClient
        .patch(threadId)
        .set({
            [`messages[_key=="${messageKey}"].status`]: "sent",
            [`messages[_key=="${messageKey}"].approvedBy`]: { _type: "reference", _ref: acct._id },
            [`messages[_key=="${messageKey}"].approvedAt`]: now
        })
        .commit();
        
    revalidatePath(`/dashboard/manager/threads/${threadId}`);
    revalidatePath(`/dashboard/employee/messages/${threadId}`);
    revalidatePath(`/dashboard/client/threads/${threadId}`);
}

export async function rejectMessageByKey(threadId: string, messageKey: string) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled") return;
    
    if (acct.type !== "manager" && acct.type !== "admin") return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN;
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
    
    await writeClient
        .patch(threadId)
        .set({
            [`messages[_key=="${messageKey}"].status`]: "rejected",
        })
        .commit();
        
    revalidatePath(`/dashboard/manager/threads/${threadId}`);
    revalidatePath(`/dashboard/employee/threads/${threadId}`);
}
