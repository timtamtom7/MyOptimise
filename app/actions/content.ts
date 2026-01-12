"use server";

import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createTaskInternal } from "./work-items";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";

export async function generateApprovalLink(id: string) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user?.email) throw new Error("Unauthorized");

  const writeClient = client.withConfig({
    token: process.env.SANITY_API_WRITE_TOKEN,
  });

  const token = randomUUID();

  await writeClient
    .patch(id)
    .set({ approvalToken: token, status: "client_review" })
    .commit();

  revalidatePath("/dashboard/content");
  return `/approve/${token}`;
}

export async function verifyApprovalToken(token: string) {
  // Use a stronger query to get all needed fields
  return await client.fetch(`*[_type == "contentItem" && approvalToken == $token][0]{
    _id,
    title,
    status,
    client->{name, logo, timezone},
    platform,
    postType,
    caption,
    media,
    scheduledAt,
    approvalToken,
    annotations
  }`, { token } as any);
}

export async function approveContentPublic(id: string, token: string, comment?: string) {
  const item = await client.fetch(`*[_type == "contentItem" && _id == $id && approvalToken == $token][0]._id`, { id, token } as any);
  if (!item) throw new Error("Invalid token or item");

  const writeClient = client.withConfig({
    token: process.env.SANITY_API_WRITE_TOKEN,
  });

  const patch = writeClient.patch(id).set({ status: "scheduled" });

  if (comment) {
     const noteBlock = {
        _type: 'block',
        style: 'normal',
        _key: randomUUID(),
        children: [{
          _type: 'span',
          _key: randomUUID(),
          text: `[Client Approved via Link]: ${comment}`
        }]
      };
      patch.setIfMissing({ internalNotes: [] }).append("internalNotes", [noteBlock]);
  }

  await patch.commit();

  revalidatePath(`/approve/${token}`);
}

export async function createContentItem(formData: FormData) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user?.email) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const platform = formData.get("platform") as string;
  const postType = formData.get("postType") as string;
  const scheduledAt = formData.get("scheduledAt") as string; // ISO string
  const clientId = formData.get("clientId") as string;
  const caption = formData.get("caption") as string;
  const file = formData.get("file") as File | null;

  if (!title || !platform || !clientId) {
    throw new Error("Missing required fields");
  }

  const writeClient = client.withConfig({
    token: process.env.SANITY_API_WRITE_TOKEN,
  });

  let assetId = null;
  if (file && file.size > 0) {
    // Determine type (image or file/video)
    const isImage = file.type.startsWith("image/");
    const assetType = isImage ? "image" : "file";
    
    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await writeClient.assets.upload(assetType, buffer, {
      filename: file.name,
      contentType: file.type,
    });
    assetId = asset._id;
  }

  const doc: any = {
    _type: "contentItem",
    title,
    platform,
    postType,
    client: { _type: "reference", _ref: clientId },
    status: "draft",
    caption,
  };

  if (scheduledAt) {
    doc.scheduledAt = scheduledAt;
    doc.status = "scheduled"; // Auto-schedule if date provided
  }

  if (assetId) {
    // Schema expects 'media' array
    doc.media = [
      {
        _key: randomUUID(),
        _type: file?.type.startsWith("image/") ? "image" : "file",
        asset: { _type: "reference", _ref: assetId },
      },
    ];
  }

  await writeClient.create(doc);
  revalidatePath("/dashboard/client");
  revalidatePath(`/dashboard/business/${clientId}`);
}

export async function updateContentSchedule(id: string, date: string) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user?.email) throw new Error("Unauthorized");

  const writeClient = client.withConfig({
    token: process.env.SANITY_API_WRITE_TOKEN,
  });

  // Get client ID for revalidation
  const doc = await client.fetch(`*[_id == $id][0]{ client }`, { id });
  const clientId = doc?.client?._ref;

  await writeClient
    .patch(id)
    .set({ scheduledAt: date, status: "scheduled" })
    .commit();

  revalidatePath("/dashboard/client");
  if (clientId) {
    revalidatePath(`/dashboard/business/${clientId}`);
  }
}

export async function updateContentStatus(id: string, status: string) {
  const session = await getServerSession(getAuthOptions());
  const email = session?.user?.email;
  if (!email) throw new Error("Unauthorized");

  const writeClient = client.withConfig({
    token: process.env.SANITY_API_WRITE_TOKEN,
  });

  const doc = await client.fetch(`*[_id == $id][0]{ title, client->{_id} }`, { id });
  const clientId = doc?.client?._ref || doc?.client?._id;

  await writeClient.patch(id).set({ status }).commit();

  // Auto-Create Task on "Changes Requested"
  if (status === "changes_requested" || status === "internal_review") {
      const acct = await fetchSanityAccountByEmail({ email });
      if (acct) {
        await createTaskInternal({
          title: `Revision: ${doc?.title || "Untitled Post"}`,
          description: `Status changed to ${status} by ${acct.name}. Please review and update.`,
          priority: "high",
          creatorId: String(acct._id),
          visibility: "internal",
          source: { type: "contentItem", id },
          assigneeId: String(acct._id) // Self-assign or leave blank to logic
        });
      }
  }

  revalidatePath("/dashboard/client");
  if (clientId) {
    revalidatePath(`/dashboard/business/${clientId}`);
  }
}

export async function rejectContentPublic(id: string, token: string, reason: string) {
  const item = await client.fetch(`*[_type == "contentItem" && _id == $id && approvalToken == $approvalToken][0]{_id, title, client->{_id}}`, { id, approvalToken: token });
  if (!item) throw new Error("Invalid token or item");

  const writeClient = client.withConfig({
    token: process.env.SANITY_API_WRITE_TOKEN,
  });

  // Construct a simple block for the note
  const noteBlock = {
    _type: 'block',
    style: 'normal',
    _key: randomUUID(),
    children: [{
      _type: 'span',
      _key: randomUUID(),
      text: `[Client Rejected]: ${reason}`
    }]
  };

  await writeClient
    .patch(id)
    .set({ status: "changes_requested" }) // Changed from internal_review to changes_requested to be more specific
    .setIfMissing({ internalNotes: [] })
    .append("internalNotes", [noteBlock])
    .commit();

  // Create Task for the rejection
  if (item.client?._id) {
    await createTaskInternal({
      title: `Client Rejected: ${item.title || "Post"}`,
      description: `Client requested changes via public link.\n\nReason: ${reason}`,
      priority: "high",
      creatorId: item.client._id, // The Client Account is the "Creator"
      visibility: "internal",
      source: { type: "contentItem", id }
    });
  }

  revalidatePath(`/approve/${token}`);
}

export async function approveContent(id: string, comment?: string) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user?.email) throw new Error("Unauthorized");

  const writeClient = client.withConfig({
    token: process.env.SANITY_API_WRITE_TOKEN,
  });

  const patch = writeClient.patch(id).set({ status: "scheduled" });
  
  if (comment) {
      const noteBlock = {
        _type: 'block',
        style: 'normal',
        _key: randomUUID(),
        children: [{
          _type: 'span',
          _key: randomUUID(),
          text: `[Client Approved]: ${comment}`
        }]
      };
      patch.setIfMissing({ internalNotes: [] }).append("internalNotes", [noteBlock]);
  }

  await patch.commit();

  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard/content");
}

export async function rejectContent(id: string, comment: string) {
  const session = await getServerSession(getAuthOptions());
  const email = session?.user?.email;
  if (!email) throw new Error("Unauthorized");
  
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct) throw new Error("Account not found");

  const writeClient = client.withConfig({
    token: process.env.SANITY_API_WRITE_TOKEN,
  });

  // Fetch item title for task
  const item = await client.fetch(`*[_id == $id][0]{title}`, { id });

  const noteBlock = {
    _type: 'block',
    style: 'normal',
    _key: randomUUID(),
    children: [{
      _type: 'span',
      _key: randomUUID(),
      text: `[Rejected by ${acct.name}]: ${comment}`
    }]
  };

  await writeClient
    .patch(id)
    .set({ status: "changes_requested" })
    .setIfMissing({ internalNotes: [] })
    .append("internalNotes", [noteBlock])
    .commit();

  // Create Task
  await createTaskInternal({
      title: `Revision: ${item?.title || "Content Item"}`,
      description: `Rejected by ${acct.name}: ${comment}`,
      priority: "high",
      creatorId: String(acct._id),
      visibility: "internal",
      source: { type: "contentItem", id }
  });

  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard/content");
}

export async function addContentAnnotation(id: string, annotation: { x: number, y: number, text: string }) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user?.email) throw new Error("Unauthorized");

  const writeClient = client.withConfig({
    token: process.env.SANITY_API_WRITE_TOKEN,
  });

  const annotationBlock = {
    _type: 'annotation',
    _key: randomUUID(),
    x: annotation.x,
    y: annotation.y,
    text: annotation.text,
    author: session.user.name || session.user.email,
    createdAt: new Date().toISOString()
  };

  await writeClient
    .patch(id)
    .setIfMissing({ annotations: [] })
    .append("annotations", [annotationBlock])
    .commit();

  revalidatePath("/dashboard/client");
}

export async function getOrCreateThreadForDocument(contentId: string) {
  const session = await getServerSession(getAuthOptions());
  if (!session?.user?.email) throw new Error("Unauthorized");

  const existingThread = await client.fetch(
    `*[_type == "messageThread" && relatedContentItem._ref == $contentId][0]._id`,
    { contentId }
  );

  if (existingThread) {
    return existingThread;
  }

  // Create new thread
  const writeClient = client.withConfig({
    token: process.env.SANITY_API_WRITE_TOKEN,
  });

  // Get content details to title the thread appropriately
  const content = await client.fetch(`*[_id == $id][0]{ title, client }`, { id: contentId });

  const thread = await writeClient.create({
    _type: "messageThread",
    subject: `Discussion: ${content?.title || "Untitled Content"}`,
    type: "content", // New type we added
    relatedContentItem: {
      _type: "reference",
      _ref: contentId,
    },
    relatedClient: content?.client ? {
      _type: "reference",
      _ref: content.client._ref
    } : undefined,
    participants: [], // Will be auto-populated or managed separately
    status: "active",
    messages: [],
    unreadCount: 0,
    updatedAt: new Date().toISOString(),
  });

  return thread._id;
}
