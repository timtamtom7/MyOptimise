"use server";

import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { deliverableApprovedEmail, deliverableRejectedEmail } from "@/lib/email-templates";
import { writeAuditLog } from "@/lib/audit";

export async function approveDeliverable(formData: FormData) {
  const session = await getServerSession(getAuthOptions());
  const email = session?.user?.email;
  if (!email) return;

  const deliverableId = String(formData.get("deliverableId"));
  if (!deliverableId) return;

  const writeClient = client.withConfig({
    token: process.env.SANITY_API_WRITE_TOKEN,
  });

  // 1. Update status
  await writeClient
    .patch(deliverableId)
    .set({ status: "approved" })
    .commit();

  // 2. Fetch details for notification
  const deliverable = await writeClient.fetch(
    `*[_type == "deliverable" && _id == $id][0]{
      title,
      "assigneeEmail": assignedTo->email,
      "clientName": campaign->client->name
    }`,
    { id: deliverableId }
  );

  // 3. Send email to assignee
  if (deliverable?.assigneeEmail) {
    const link = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard/employee/tasks`;
    await sendEmail({
      to: deliverable.assigneeEmail,
      subject: `Approved: ${deliverable.title}`,
      html: deliverableApprovedEmail({
        deliverableTitle: deliverable.title,
        clientName: deliverable.clientName || "Client",
        link,
      }),
    });
  }

  revalidatePath("/dashboard/client");
}

export async function rejectDeliverable(formData: FormData) {
  const session = await getServerSession(getAuthOptions());
  const email = session?.user?.email;
  if (!email) return;

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct) return;

  const deliverableId = String(formData.get("deliverableId"));
  const notes = String(formData.get("notes") || "");
  if (!deliverableId) return;

  const writeClient = client.withConfig({
    token: process.env.SANITY_API_WRITE_TOKEN,
  });

  // 1. Update status and add feedback
  await writeClient
    .patch(deliverableId)
    .set({ status: "changes_requested" })
    .setIfMissing({ feedback: [] })
    .append("feedback", [{
      _type: "object",
      _key: Math.random().toString(36).substring(7),
      content: notes,
      author: { _type: "reference", _ref: acct._id },
      createdAt: new Date().toISOString()
    }])
    .commit();

  // 2. Fetch details for notification
  const deliverable = await writeClient.fetch(
    `*[_type == "deliverable" && _id == $id][0]{
      title,
      "assigneeEmail": assignedTo->email,
      "clientName": campaign->client->name
    }`,
    { id: deliverableId }
  );

  // 3. Send email to assignee
  if (deliverable?.assigneeEmail) {
    const link = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard/employee/tasks`;
    await sendEmail({
      to: deliverable.assigneeEmail,
      subject: `Changes Requested: ${deliverable.title}`,
      html: deliverableRejectedEmail({
        deliverableTitle: deliverable.title,
        clientName: deliverable.clientName || "Client",
        feedback: notes,
        link,
      }),
    });
  }

  revalidatePath("/dashboard/client");
}
