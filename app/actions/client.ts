"use server";

import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendEmail } from "@/lib/email";
import { clientRequestSubmittedEmail, clientRequestReplyEmail } from "@/lib/email-templates";
import { deepseek } from "@/lib/ai";
import { hasAccountCapability } from "@/lib/capabilities";

export async function submitClientRequest(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || acct.status === "disabled" || acct.type !== "client") return;
  if (!hasAccountCapability(acct, "support.ticket.create")) return;

  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const category = String(formData.get("type") || "support").trim();
  const priority = String(formData.get("priority") || "medium").trim();
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

  await writeClient.create({
    _type: "clientRequest",
    subject,
    message,
    category,
    priority,
    clientEmail: email.toLowerCase(),
    clientAccount: { _type: "reference", _ref: String(acct._id) },
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

  // Notify admins
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);
  if (adminEmails.length > 0) {
    const link = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100"}/dashboard/admin/intake`;
    await sendEmail({
      to: adminEmails,
      subject: `New Request from ${acct.name}: ${subject}`,
      html: clientRequestSubmittedEmail({
        clientName: String(acct.name || "Client"),
        subject,
        link,
      }),
    });
  }

  revalidatePath("/dashboard/client");
}

export async function addClientRequestMessage(formData: FormData) {
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
    `*[_type == "clientRequest" && _id == $id && clientEmail != null && lower(clientEmail) == $email][0]{_id, subject}`,
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

  // Notify admins of reply
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim()).filter(Boolean);
  if (adminEmails.length > 0) {
    const link = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3100"}/dashboard/admin/intake`;
    await sendEmail({
      to: adminEmails,
      subject: `New Reply from ${acct.name}: ${canUpdate.subject}`,
      html: clientRequestReplyEmail({
        clientName: String(acct.name || "Client"),
        subject: canUpdate.subject || "Request",
        message,
        link,
      }),
    });
  }

  revalidatePath("/dashboard/client");
}

export async function createOrOpenSupportThread(formData: FormData) {
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

export async function setClientServiceEnabled(formData: FormData) {
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
    `*[_type == "clientService" && _id == $id && clientCanToggle == true && client._ref == $acctId][0]{_id}`,
    { id, acctId: String(acct._id) },
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

export async function submitServiceRequest(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || acct.status === "disabled" || acct.type !== "client") return;
  if (!hasAccountCapability(acct, "client.services.request_new")) return;

  const requestedServiceType = String(formData.get("requestedServiceType") || "other").trim();
  const details = String(formData.get("details") || "").trim();
  const attachment = formData.get("attachment");
  if (!["instagram", "facebook", "email", "website", "ads", "seo", "other"].includes(requestedServiceType)) return;

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

  const now = new Date().toISOString();
  await writeClient.create({
    _type: "serviceRequest",
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

export async function suggestBrandAssetTags(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;

  const requester = await fetchSanityAccountByEmail({ email });
  if (!requester || requester.status === "disabled") return;

  const accountId = String(formData.get("accountId") || "").trim();
  const assetKey = String(formData.get("assetKey") || "").trim();
  const assetTitle = String(formData.get("assetTitle") || "").trim();
  const assetType = String(formData.get("assetType") || "").trim();
  const assetUrl = String(formData.get("assetUrl") || "").trim();

  if (!accountId || !assetKey) return;

  const requesterType = String(requester.type || "").toLowerCase();
  const isAdminOrManager = requesterType === "admin" || requesterType === "manager";
  const isSelfClient = requesterType === "client" && String(requester._id || "") === accountId;
  if (!isAdminOrManager && !isSelfClient) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const details: string[] = [];
  details.push(`Title: ${assetTitle || "Untitled asset"}`);
  if (assetType) details.push(`Type: ${assetType}`);
  if (assetUrl) details.push(`URL: ${assetUrl}`);

  const prompt = `You are tagging brand assets for a marketing team.
Based on the following information, generate 3-7 short, lowercase tags (single or double words)
that will help editors search for this asset.
Return ONLY a JSON array of strings, with no explanation.

${details.join("\n")}`;

  let tags: string[] = [];

  try {
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You generate concise, searchable tags for brand assets." },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
    });

    const raw = response.choices?.[0]?.message?.content || "[]";
    const match = raw.match(/\[[\s\S]*\]/);
    const json = match ? match[0] : raw;
    const parsed = JSON.parse(json);

    if (Array.isArray(parsed)) {
      tags = parsed
        .map((t: any) => String(t || "").trim().toLowerCase())
        .filter((t: string) => t.length > 0)
        .slice(0, 10);
    }
  } catch (error) {
    console.error("Failed to generate brand asset tags", error);
    return;
  }

  if (tags.length === 0) return;

  try {
    await writeClient
      .patch(accountId)
      .set({
        [`brandAssets[_key=="${assetKey}"].aiTags`]: tags,
      })
      .commit();
  } catch (error) {
    console.error("Failed to save AI tags for brand asset", error);
    return;
  }

  revalidatePath("/dashboard/client");
  revalidatePath(`/dashboard/business/${accountId}`);
}
