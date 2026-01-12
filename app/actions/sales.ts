"use server";

import { client } from "@/sanity/lib/client";
import { revalidateTag } from "next/cache";
import { sendEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function updateLeadStatus(leadId: string, newStatus: string) {
  const writeToken = process.env.SANITY_API_WRITE_TOKEN;
  if (!writeToken) throw new Error("Missing write token");

  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  await writeClient.patch(leadId).set({ status: newStatus }).commit();
  
  revalidateTag("lead", "");
}

export async function convertLeadToClient(leadId: string, data: {
  businessName: string;
  contactName: string;
  email: string;
  monthlyValue: number;
}) {
  const writeToken = process.env.SANITY_API_WRITE_TOKEN;
  if (!writeToken) throw new Error("Missing write token");
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  // Generate temporary password
  const tempPassword = crypto.randomBytes(8).toString("hex");
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  // 1. Create Account
  const account = await writeClient.create({
    _type: "account",
    type: "client",
    status: "active",
    email: data.email,
    name: data.contactName,
    businessName: data.businessName,
    onboardingStatus: "new",
    serviceScope: "Growth Tier - $" + data.monthlyValue + "/mo",
    notes: "Converted from Lead: " + leadId,
    passwordHash // Store hashed password
  });

  // 2. Update Lead
  await writeClient.patch(leadId).set({ 
    status: "won",
    notes: `Converted to Account ${account._id} on ${new Date().toLocaleDateString()}` 
  }).commit();

  // 3. Simulate Webhook
  console.log(`[WEBHOOK] Slack: 🚨 NEW CLIENT SIGNED: ${data.businessName} ($${data.monthlyValue}/mo) 🚨`);
  
  // 4. Send Welcome Email
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://myoptimise.org"}/login`;
  
  await sendEmail({
    to: data.email,
    subject: "Welcome to Optimise Operations!",
    html: `
      <h1>Welcome aboard, ${data.contactName}!</h1>
      <p>We are thrilled to have you as a client. Your account has been created.</p>
      <p><strong>Business:</strong> ${data.businessName}</p>
      <p><strong>Plan:</strong> Growth Tier ($${data.monthlyValue}/mo)</p>
      
      <p>Please log in to your dashboard to get started:</p>
      <p><a href="${loginUrl}">${loginUrl}</a></p>
      
      <p><strong>Your Temporary Credentials:</strong></p>
      <ul>
        <li>Email: ${data.email}</li>
        <li>Password: ${tempPassword}</li>
      </ul>
      
      <p>Please change your password after logging in.</p>
      
      <br/>
      <p>Best regards,</p>
      <p>The Optimise Team</p>
    `
  });

  revalidateTag("lead", "");
  // revalidateTag("account"); // If we had an account list
}

export async function createLead(data: {
  companyName: string;
  contactName?: string;
  email?: string;
  value?: number;
  notes?: string;
}) {
  const writeToken = process.env.SANITY_API_WRITE_TOKEN;
  if (!writeToken) throw new Error("Missing write token");

  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  await writeClient.create({
    _type: "lead",
    status: "cold",
    ...data
  });
  
  revalidateTag("lead", "");
}

export async function processCallRecording(formData: FormData) {
  const leadId = formData.get("leadId") as string;
  const file = formData.get("file") as File;

  if (!leadId || !file) throw new Error("Missing data");

  // In a real implementation, we would upload the file to storage and call Whisper API.
  // For now, we simulate the AI processing.
  
  // Simulated delay
  await new Promise(r => setTimeout(r, 2000));

  const mockResult = {
    summary: "The client is interested in the enterprise plan but has concerns about the implementation timeline. They want to start next month.",
    sentiment: "positive",
    actionItems: ["Send implementation schedule", "Schedule follow-up call with engineering"],
    date: new Date().toISOString()
  };

  const writeToken = process.env.SANITY_API_WRITE_TOKEN;
  if (!writeToken) throw new Error("Missing write token");
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  await writeClient.patch(leadId)
    .setIfMissing({ transcriptions: [] })
    .append("transcriptions", [mockResult])
    .commit();
  
  revalidateTag("lead", "");
}
