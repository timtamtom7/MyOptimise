"use server";

import { safeGetServerSession } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { client } from "@/sanity/lib/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createOrOpenDmThread(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct) return;

    const recipientId = String(formData.get("recipientId") || "").trim();
    if (!recipientId) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const existing = await writeClient.fetch(
        `*[_type == "messageThread" && type == "dm" && count(participants) == 2 && $a in participants[]._ref && $b in participants[]._ref][0]{_id}`,
        { a: String(acct._id), b: recipientId }
    );

    if (existing?._id) {
        redirect(`/dashboard/admin/threads/${existing._id}`);
    }

    const newThread = await writeClient.create({
        _type: "messageThread",
        type: "dm",
        visibility: "internal",
        participants: [
            { _type: "reference", _ref: String(acct._id) },
            { _type: "reference", _ref: recipientId }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
    });

    redirect(`/dashboard/admin/threads/${newThread._id}`);
}

export async function markThreadRead(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "admin") return;
    if (!hasAccountCapability(acct, "message.read")) return;

    const threadId = String(formData.get("threadId") || "").trim();
    if (!threadId) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const thread = await writeClient.fetch(
        `*[_type == "messageThread" && _id == $id][0]{_id, participants[]._ref, "readStates": readStates[]{user, lastReadAt}}`,
        { id: threadId }
    );
    if (!thread?._id) return;
    if (!Array.isArray(thread.participants) || !thread.participants.includes(String(acct._id))) return;

    const existingReadStates = Array.isArray(thread.readStates) ? thread.readStates : [];
    const now = new Date().toISOString();
    const updatedReadStates = [
        ...existingReadStates.filter((rs: any) => String(rs?.user?._ref || "") !== String(acct._id)),
        { _type: "threadReadState", user: { _type: "reference", _ref: String(acct._id) }, lastReadAt: now }
    ];

    await writeClient.patch(threadId).set({ readStates: updatedReadStates }).commit();
    revalidatePath(`/dashboard/admin/threads/${threadId}`);
    redirect(`/dashboard/admin/threads/${threadId}`);
}

export async function postThreadMessage(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "admin") return;
    if (!hasAccountCapability(acct, "message.create")) return;

    const threadId = String(formData.get("threadId") || "").trim();
    const message = String(formData.get("message") || "").trim();
    if (!threadId || !message) return;
    const attachment = formData.get("attachment");

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const thread = await writeClient.fetch(
        `*[_type == "messageThread" && _id == $id][0]{_id, visibility, participants[]._ref, "readStates": readStates[]{user, lastReadAt}}`,
        { id: threadId },
    );
    if (!thread?._id) return;
    if (!Array.isArray(thread.participants) || !thread.participants.includes(String(acct._id))) return;

    const now = new Date().toISOString();
    const messageVisibility = String(thread.visibility || "") === "client" ? "client" : "internal";
    const existingReadStates = Array.isArray(thread.readStates) ? thread.readStates : [];
    const updatedReadStates = [
        ...existingReadStates.filter((rs: any) => String(rs?.user?._ref || "") !== String(acct._id)),
        { _type: "threadReadState", user: { _type: "reference", _ref: String(acct._id) }, lastReadAt: now },
    ];

    let uploadedAssetId: string | null = null;
    if (attachment && typeof attachment !== "string") {
        const file = attachment as File;
        if (file.size > 0) {
            const asset = await writeClient.assets.upload("file", file, { filename: file.name });
            uploadedAssetId = String(asset?._id || "");
        }
    }

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
                ...(uploadedAssetId
                    ? { attachments: [{ _type: "file", asset: { _type: "reference", _ref: uploadedAssetId } }] }
                    : {}),
            },
        ])
        .commit();

    revalidatePath(`/dashboard/admin/threads/${threadId}`);
    redirect(`/dashboard/admin/threads/${threadId}`);
}

export async function togglePinMessage(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "admin") return;
    if (!hasAccountCapability(acct, "message.pin")) return;

    const threadId = String(formData.get("threadId") || "").trim();
    const messageKey = String(formData.get("messageKey") || "").trim();
    if (!threadId || !messageKey) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const thread = await writeClient.fetch(
        `*[_type == "messageThread" && _id == $id][0]{
        _id,
        participants[]._ref,
        pinnedMessageKeys,
        "hasMessage": count(messages[_key == $messageKey]) > 0
      }`,
        { id: threadId, messageKey },
    );
    if (!thread?._id) return;
    if (!Array.isArray(thread.participants) || !thread.participants.includes(String(acct._id))) return;
    if (!thread.hasMessage) return;

    const existing = Array.isArray(thread.pinnedMessageKeys) ? thread.pinnedMessageKeys.map((v: any) => String(v || "")) : [];
    const set = new Set(existing.filter(Boolean));
    if (set.has(messageKey)) set.delete(messageKey);
    else set.add(messageKey);
    const next = Array.from(set).slice(0, 50);

    await writeClient
        .patch(threadId)
        .set({ pinnedMessageKeys: next, updatedAt: new Date().toISOString() })
        .commit();

    revalidatePath(`/dashboard/admin/threads/${threadId}`);
    redirect(`/dashboard/admin/threads/${threadId}`);
}
