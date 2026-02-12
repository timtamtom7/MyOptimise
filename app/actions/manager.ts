"use server";

import { safeGetServerSession, IMPERSONATE_COOKIE_NAME } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { writeAuditLog } from "@/lib/audit";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { randomUUID } from "crypto";

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

export async function inviteEmployee(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled") return;
    if (acct.type !== "manager" && acct.type !== "admin") return;
    if (!hasAccountCapability(acct, "users.invite.limited")) return;

    const inviteEmail = String(formData.get("email") || "").trim().toLowerCase();
    const inviteName = String(formData.get("name") || "").trim();
    if (!inviteEmail || !inviteName) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    // Check existing
    const existing = await writeClient.fetch(`*[_type == "account" && email == $email][0]{_id}`, { email: inviteEmail });
    if (existing?._id) return;

    await writeClient.create({
        _type: "account",
        email: inviteEmail,
        name: inviteName,
        type: "employee",
        status: "active",
        createdAt: new Date().toISOString()
    });

    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
        const resend = new Resend(resendKey);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5555";
        const loginUrl = `${baseUrl}/login?email=${encodeURIComponent(inviteEmail)}`;
        await sendResendEmailWithFallback({
           resend,
           from: "Optimise Operations <onboarding@resend.dev>",
           to: inviteEmail,
           subject: "Your Optimise Operations access link",
           html: `<p>You’ve been granted access. Sign in with Google using <strong>${inviteEmail}</strong>.</p><p><a href="${loginUrl}">Open sign-in</a></p>`,
        });
    }

    revalidatePath("/dashboard/manager");
}

export async function createWorkItem(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled") return;
    if (acct.type !== "manager" && acct.type !== "admin") return;
    if (!hasAccountCapability(acct, "task.create")) return;

    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const priority = String(formData.get("priority") || "medium").trim();
    const dueDateRaw = String(formData.get("dueDate") || "").trim();
    const assigneeId = String(formData.get("assigneeId") || "").trim();
    const visibility = String(formData.get("visibility") || "internal").trim();

    if (!title) return;
    if (!["low", "medium", "high"].includes(priority)) return;
    if (!["internal", "client"].includes(visibility)) return;
    
    if (visibility === "client" && !hasAccountCapability(acct, "task.visibility.set")) return;

    const dueDate = dueDateRaw ? new Date(dueDateRaw) : null;
    if (dueDate && Number.isNaN(dueDate.getTime())) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    let assignedTo: { _type: "reference"; _ref: string } | undefined;
    if (assigneeId) {
        if (!hasAccountCapability(acct, "task.assign.team")) return;
        const canAssign = await writeClient.fetch(
            `*[_type == "account" && _id == $id && status != "disabled" && type in ["employee", "manager"]][0]{_id}`,
            { id: assigneeId }
        );
        if (canAssign?._id) {
            assignedTo = { _type: "reference", _ref: assigneeId };
        }
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
        context: { priority, visibility, assigned: Boolean(assignedTo), dueDate: dueDate ? dueDate.toISOString() : "" },
    });

    revalidatePath("/dashboard/manager");
}

export async function assignWorkItem(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled") return;
    if (acct.type !== "manager" && acct.type !== "admin") return;
    if (!hasAccountCapability(acct, "task.assign.team")) return;

    const id = String(formData.get("id") || "").trim();
    const assigneeId = String(formData.get("assigneeId") || "").trim();
    
    if (!id) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    if (!assigneeId) {
        // Unassign
        await writeClient.patch(id).unset(["assignedTo"]).commit();
    } else {
        // Assign
        await writeClient.patch(id).set({
            assignedTo: { _type: "reference", _ref: assigneeId }
        }).commit();
    }
    
    revalidatePath("/dashboard/manager");
}

export async function updateStatus(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled") return;
    if (acct.type !== "manager" && acct.type !== "admin") return;
    // Basic task management capability check
    if (!hasAccountCapability(acct, "task.create")) return; 

    const id = String(formData.get("id") || "").trim();
    const status = String(formData.get("status") || "").trim();

    if (!id || !status) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    await writeClient.patch(id).set({ status }).commit();

    revalidatePath("/dashboard/manager");
}

export async function assignClientRequest(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled") return;
    if (acct.type !== "manager" && acct.type !== "admin") return;
    if (!hasAccountCapability(acct, "support.ticket.assign")) return;

    const id = String(formData.get("id") || "").trim();
    const assigneeId = String(formData.get("assigneeId") || "").trim();
    if (!id || !assigneeId) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    await writeClient.patch(id).set({
        assignedTo: { _type: "reference", _ref: assigneeId },
        status: "in_progress"
    }).commit();
    revalidatePath("/dashboard/manager");
}

export async function stopImpersonation() {
    const cookieStore = await cookies();
    // Force delete with explicit path and maxAge to ensure browser clears it
    cookieStore.set(IMPERSONATE_COOKIE_NAME, "", { maxAge: 0, path: "/" });
    cookieStore.delete(IMPERSONATE_COOKIE_NAME);
    // Do NOT delete IMPERSONATE_ORIGINAL_EMAIL_COOKIE here, it is needed for session restoration
    
    return { success: true };
}

export async function addClientRequestMessage(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled") return;
    if (acct.type !== "manager" && acct.type !== "admin") return;
    if (!hasAccountCapability(acct, "support.ticket.respond")) return;

    const id = String(formData.get("id") || "").trim();
    const message = String(formData.get("message") || "").trim();
    if (!id || !message) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    await writeClient.patch(id)
        .set({ updatedAt: new Date().toISOString() })
        .setIfMissing({ messages: [] })
        .append("messages", [{
            _type: "clientRequestMessage",
            author: { _type: "reference", _ref: String(acct._id) },
            visibility: "client",
            message,
            createdAt: new Date().toISOString()
        }])
        .commit();
    revalidatePath("/dashboard/manager");
}

export async function updateClientRequest(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled") return;
    if (acct.type !== "manager" && acct.type !== "admin") return;
    if (!hasAccountCapability(acct, "support.ticket.manage")) return;

    const id = String(formData.get("id") || "").trim();
    const status = String(formData.get("status") || "").trim();
    if (!id || !status) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    await writeClient.patch(id).set({ status }).commit();
    revalidatePath("/dashboard/manager");
}

export async function createClientService(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled") return;
    if (acct.type !== "manager" && acct.type !== "admin") return;
    if (!hasAccountCapability(acct, "client.services.manage")) return;

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

    await writeClient.create({
        _type: "clientService",
        title,
        serviceType,
        client: { _type: "reference", _ref: clientId },
        status,
        statusNote: statusNote || undefined,
        clientCanToggle,
        clientEnabled,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
               name: title,
               service_type: serviceType as any,
               status: status,
               start_date: new Date().toISOString().split("T")[0],
               monthly_budget: 0,
           });
       }
    }

    revalidatePath("/dashboard/manager");
}

export async function updateClientService(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled") return;
    if (acct.type !== "manager" && acct.type !== "admin") return;
    if (!hasAccountCapability(acct, "client.services.manage")) return;

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

    await writeClient.patch(id).set({ 
        status,
        statusNote: statusNote || undefined,
        clientCanToggle,
        clientEnabled,
        updatedAt: new Date().toISOString()
    }).commit();
    revalidatePath("/dashboard/manager");
}

export async function createBrief(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled") return;
    if (acct.type !== "manager" && acct.type !== "admin") return;
    // Capability check - assuming all managers can create briefs for now, or use "task.create"
    if (!hasAccountCapability(acct, "task.create")) return;

    const title = String(formData.get("title") || "").trim();
    if (!title) return;

    // Resolve workspace_id from Supabase
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (!userData?.id) {
      console.error("No Supabase user found for email:", email);
      return;
    }

    const { data: memberData } = await (supabaseAdmin as any)
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userData.id)
      .single();

    if (!memberData?.workspace_id) {
      console.error("No workspace found for user:", userData.id);
      return;
    }

    const briefData = {
      workspace_id: memberData.workspace_id,
      title,
      hook: String(formData.get("hook") || "") || null,
      script: String(formData.get("script") || "") || null,
      visual_direction: String(formData.get("visual_direction") || "") || null,
      assets_url: String(formData.get("assets_url") || "") || null,
      status: "assigned",
      assignee_id: String(formData.get("assignee_id") || "") || null,
      author_id: String(acct._id),
      price: Number(formData.get("price")) || 0,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await (supabaseAdmin as any).from("briefs").insert(briefData);
    
    if (error) {
      console.error("Failed to create brief:", error);
      throw error;
    }

    revalidatePath("/dashboard/manager");
}

export async function updateServiceRequestStatus(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled") return;
    if (acct.type !== "manager" && acct.type !== "admin") return;
    if (!hasAccountCapability(acct, "client.services.manage")) return;

    const id = String(formData.get("id") || "").trim();
    const status = String(formData.get("status") || "").trim();
    if (!id || !status) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    // Fetch request details to handle approval sync
    const req = await writeClient.fetch(
        `*[_type == "serviceRequest" && _id == $id][0]{_id, status, requestedServiceType, clientAccount->{_id}}`,
        { id }
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
                    title: `Service: ${requestedServiceType}`,
                    serviceType: requestedServiceType,
                    client: { _type: "reference", _ref: clientId },
                    status: "active",
                    clientCanToggle: false,
                    clientEnabled: true,
                    createdAt: now,
                    updatedAt: now
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

    await writeClient.patch(id).set({ status }).commit();
    revalidatePath("/dashboard/manager");
}

export async function createOrOpenDmThread(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled") return;
    if (acct.type !== "manager" && acct.type !== "admin") return;
    
    // Check capability? Assuming all managers can DM.
    
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
        redirect(`/dashboard/manager/threads/${existing._id}`);
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

    redirect(`/dashboard/manager/threads/${newThread._id}`);
}

export async function approveBrief(formData: FormData) {
      console.log("[approveBrief] Starting approval process");
      const session = await safeGetServerSession();
      if (!session) {
          console.error("[approveBrief] No session found");
          throw new Error("Unauthorized: No session");
      }
      
      const id = String(formData.get("id"));
      if (!id) {
          console.error("[approveBrief] No ID provided");
          throw new Error("Missing ID");
      }

      const email = String((session as any)?.user?.email || "");
      const acct = await fetchSanityAccountByEmail({ email });
      if (!acct || (acct.type !== 'manager' && acct.type !== 'admin')) {
          console.error("[approveBrief] Unauthorized account type:", acct?.type);
          throw new Error("Unauthorized");
      }

      // Check if UUID (Postgres) or Sanity ID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      console.log("[approveBrief] ID:", id, "isUuid:", isUuid);

      if (!isUuid) {
          // Sanity Logic
          const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
          if (!writeToken) {
              console.error("[approveBrief] Missing SANITY_API_WRITE_TOKEN");
              throw new Error("Configuration error: Missing write token");
          }
          const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

          const doc = await writeClient.fetch(`*[_id == $id][0]{status}`, { id });
          if (!doc) {
              console.error("[approveBrief] Document not found:", id);
              throw new Error("Document not found");
          }

          const fromStatus = doc.status;
          const toStatus = "client_review";
          const changedAt = new Date().toISOString();

          const patch = writeClient.patch(id).set({ status: toStatus });

          if (fromStatus !== toStatus) {
             patch.setIfMissing({ statusHistory: [] })
                  .append("statusHistory", [{
                      _type: "deliverableStatusChange",
                      fromStatus,
                      toStatus,
                      changedBy: { _type: "reference", _ref: acct._id },
                      changedAt
                  }]);
          }

          // Generate approval token if not present
          const token = randomUUID();
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + 30); // 30 days expiry
          
          patch.setIfMissing({ approvalToken: token });
          patch.set({ approvalTokenExpiry: expiry.toISOString() });

          console.log("[approveBrief] Committing patch for", id);
          await patch.commit();
      } else {
          // Postgres Logic
          const token = randomUUID();
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + 30); // 30 days expiry

          const { error } = await (supabaseAdmin as any)
              .from("briefs")
              .update({ 
                  status: 'client_review',
                  approval_token: token,
                  approval_token_expiry: expiry.toISOString(),
                  updated_at: new Date().toISOString()
              })
              .eq("id", id);
              
          if (error) {
              console.error("[approveBrief] Supabase error:", error);
              throw error;
          }
      }
      
      console.log("[approveBrief] Success, revalidating path");
      revalidatePath("/dashboard/manager");
}

export async function rejectBrief(formData: FormData) {
      console.log("[rejectBrief] Starting rejection process");
      const session = await safeGetServerSession();
      if (!session) {
          console.error("[rejectBrief] No session found");
          throw new Error("Unauthorized: No session");
      }
      
      const id = String(formData.get("id"));
      const feedback = String(formData.get("feedback"));
      if (!id) {
          console.error("[rejectBrief] No ID provided");
          throw new Error("Missing ID");
      }

      const email = String((session as any)?.user?.email || "");
      const acct = await fetchSanityAccountByEmail({ email });
      if (!acct || (acct.type !== 'manager' && acct.type !== 'admin')) {
          console.error("[rejectBrief] Unauthorized account type:", acct?.type);
          throw new Error("Unauthorized");
      }

      // Check if UUID (Postgres) or Sanity ID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      console.log("[rejectBrief] ID:", id, "isUuid:", isUuid);

      if (!isUuid) {
          // Sanity Logic
          const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
          if (!writeToken) {
              console.error("[rejectBrief] Missing SANITY_API_WRITE_TOKEN");
              throw new Error("Configuration error: Missing write token");
          }
          const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

          const doc = await writeClient.fetch(`*[_id == $id][0]{status}`, { id });
          if (!doc) {
              console.error("[rejectBrief] Document not found:", id);
              throw new Error("Document not found");
          }

          const fromStatus = doc.status;
          const toStatus = "changes_requested";
          const changedAt = new Date().toISOString();

          const patch = writeClient.patch(id).set({ status: toStatus });

          if (fromStatus !== toStatus) {
             patch.setIfMissing({ statusHistory: [] })
                  .append("statusHistory", [{
                      _type: "deliverableStatusChange",
                      fromStatus,
                      toStatus,
                      changedBy: { _type: "reference", _ref: acct._id },
                      changedAt
                  }]);
          }

          if (feedback) {
              patch.setIfMissing({ feedback: [] })
                   .append("feedback", [{
                       _key: randomUUID(),
                       content: feedback,
                       createdAt: changedAt
                   }]);
          }

          console.log("[rejectBrief] Committing patch for", id);
          await patch.commit();
      } else {
          // Postgres Logic
          const { error } = await (supabaseAdmin as any)
              .from("briefs")
              .update({ 
                  status: 'assigned', 
                  feedback: feedback,
                  updated_at: new Date().toISOString()
              })
              .eq("id", id);

          if (error) {
              console.error("[rejectBrief] Supabase error:", error);
              throw error;
          }
      }

      console.log("[rejectBrief] Success, revalidating path");
      revalidatePath("/dashboard/manager");
}
