"use server";

import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

export async function claimDeliverable(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return { error: "Unauthorized" };

  const id = String(formData.get("id"));
  const acct = await fetchSanityAccountByEmail({ email });

  if (!acct) return { error: "Account not found" };

  await writeClient.patch(id).set({
    status: "assigned",
    assignedTo: { _type: "reference", _ref: acct._id },
    claimedAt: new Date().toISOString()
  }).commit();

  revalidatePath("/flow/editor");
  return { success: true };
}

export async function updateDeliverableStatus(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return { error: "Unauthorized" };

  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  const feedback = String(formData.get("feedback") || "");

  // If status is changes_requested, we might want to notify via email (omitted for now)
  // If we have feedback, we might want to append it to the latest version notes or send it
  
  const patch = writeClient.patch(id).set({ status });
  
  if (feedback) {
     // Optional: store feedback somewhere specific if needed, but for now just status update
  }

  await patch.commit();

  revalidatePath("/flow/manager");
  return { success: true };
}

export async function submitDeliverableVersion(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return { error: "Unauthorized" };

  const id = String(formData.get("id"));
  const url = String(formData.get("url"));
  const notes = String(formData.get("notes") || "");
  
  const acct = await fetchSanityAccountByEmail({ email });

  // Get current version count to increment
  const doc = await writeClient.fetch(`*[_id == $id][0]{versionHistory}`, { id });
  const nextVersion = (doc?.versionHistory?.length || 0) + 1;

  // Basic Automated QA
  const qaChecks = [];
  if (!url) qaChecks.push("❌ Missing URL");
  if (!notes || notes.length < 5) qaChecks.push("⚠️ Notes are very short.");
  if (url.includes("drive.google.com") && !url.includes("usp=sharing")) qaChecks.push("ℹ️ Ensure Google Drive link is public.");
  
  const qaComment = {
      _key: randomUUID(),
      text: `🤖 **Automated QA**\n${qaChecks.length > 0 ? qaChecks.join("\n") : "✅ All basic checks passed."}`,
      timestamp: 0,
      createdAt: new Date().toISOString(),
      author: { _type: "reference", _ref: acct._id }
  };

  const version = {
    versionNumber: nextVersion,
    url,
    notes,
    createdAt: new Date().toISOString(),
    createdBy: { _type: "reference", _ref: acct._id },
    comments: [qaComment]
  };

  await writeClient
    .patch(id)
    .set({ status: "internal_review" })
    .setIfMissing({ versionHistory: [] })
    .append("versionHistory", [version])
    .commit();

  revalidatePath("/flow/editor");
  return { success: true };
}

export async function generateApprovalLink(formData: FormData) {
    const session = await safeGetServerSession();
    if (!session) return { error: "Unauthorized" };
    
    const id = String(formData.get("id"));
    const token = randomUUID();
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7); // 7 days expiry

    await writeClient.patch(id).set({
        status: "client_review",
        approvalToken: token,
        approvalTokenExpiry: expiry.toISOString()
    }).commit();

    revalidatePath(`/flow/manager/${id}`);
    return { success: true, token };
}

export async function addVersionComment(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return { error: "Unauthorized" };

  const deliverableId = String(formData.get("deliverableId") || "");
  const versionNumber = parseInt(String(formData.get("versionNumber") || "0"));
  const text = String(formData.get("text") || "");
  const timestamp = parseFloat(String(formData.get("timestamp") || "0"));

  if (!deliverableId || !text) return { error: "Missing required fields" };

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct) return { error: "Account not found" };

  const deliverable = await writeClient.fetch(`*[_type == "deliverable" && _id == $id][0]`, { id: deliverableId });
  
  if (!deliverable || !deliverable.versionHistory) return { error: "Deliverable or versions not found" };

  const versionIndex = deliverable.versionHistory.findIndex((v: any) => v.versionNumber === versionNumber);
  
  if (versionIndex === -1) return { error: "Version not found" };

  const comment = {
    _key: randomUUID(),
    text,
    timestamp,
    createdAt: new Date().toISOString(),
    author: { _type: "reference", _ref: acct._id }
  };

  await writeClient
    .patch(deliverableId)
    .setIfMissing({ [`versionHistory[${versionIndex}].comments`]: [] })
    .append(`versionHistory[${versionIndex}].comments`, [comment])
    .commit();

  revalidatePath(`/flow/manager/brief/${deliverableId}`);
  return { success: true };
}

export async function createDeliverable(formData: FormData) {
    const session = await safeGetServerSession();
    if (!session) return { error: "Unauthorized" };
    
    const title = String(formData.get("title"));
    const campaignId = String(formData.get("campaignId"));
    const type = String(formData.get("type"));
    const platform = String(formData.get("platform"));
    const description = String(formData.get("description"));
    const dueDate = String(formData.get("dueDate"));

    if (!title || !campaignId) return { error: "Missing required fields" };

    await writeClient.create({
        _type: "deliverable",
        title,
        campaign: { _type: "reference", _ref: campaignId },
        type,
        platform,
        description,
        dueDate,
        status: "drafting",
        versionHistory: []
    });

    revalidatePath("/flow/manager");
    return { success: true };
}

export async function submitDeliverable(formData: FormData) {
    await submitDeliverableVersion(formData);
}

export async function verifyApprovalToken(token: string) {
    const query = `*[_type == "deliverable" && approvalToken == $token][0]{
            _id, title, status, approvalTokenExpiry, 
            versionHistory[-1],
            campaign->{client}
        }`;
    const client: any = writeClient;
    const deliverable = await client.fetch(query, { token });

    if (!deliverable) return { error: "Invalid token" };
    if (new Date(deliverable.approvalTokenExpiry) < new Date()) return { error: "Token expired" };
    
    return { success: true, deliverable };
}

export async function submitPublicApproval(formData: FormData) {
    const token = String(formData.get("token"));
    const decision = String(formData.get("decision"));
    // const notes = String(formData.get("notes") || "");
    // const clientName = String(formData.get("clientName") || "");

    const { success, deliverable, error } = await verifyApprovalToken(token);
    if (!success || !deliverable) return { error: error || "Verification failed" };

    const status = decision === 'approve' ? 'approved' : 'changes_requested';
    
    const patch = writeClient.patch(deliverable._id).set({ status });
    
    await patch.commit();
    
    return { success: true };
}

export async function approveDeliverable(formData: FormData) {
    const session = await safeGetServerSession();
    if (!session) return { error: "Unauthorized" };

    const id = String(formData.get("deliverableId"));
    if (!id) return { error: "Missing ID" };

    await writeClient.patch(id).set({ status: "approved" }).commit();
    revalidatePath("/flow/client");
    return { success: true };
}

export async function rejectDeliverable(formData: FormData) {
    const session = await safeGetServerSession();
    if (!session) return { error: "Unauthorized" };

    const id = String(formData.get("deliverableId"));
    const reason = String(formData.get("rejectionReason") || "");

    if (!id) return { error: "Missing ID" };

    // Ideally add reason to comments or separate field
    // For now just status change
    await writeClient.patch(id).set({ status: "changes_requested" }).commit();
    
    // If reason exists, maybe add a comment?
    if (reason) {
        const acct = await fetchSanityAccountByEmail({ email: session.user?.email || "" });
        if (acct) {
            const comment = {
                _key: randomUUID(),
                text: `CHANGES REQUESTED: ${reason}`,
                timestamp: 0,
                createdAt: new Date().toISOString(),
                author: { _type: "reference", _ref: acct._id }
            };
             // Need to find which version to attach to? Or just latest?
             // For now, simple implementation or skip comment
        }
    }

    revalidatePath("/flow/client");
    return { success: true };
}
