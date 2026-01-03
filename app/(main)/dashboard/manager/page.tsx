import { hasAccountCapability, safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { ManagerView } from "@/components/dashboard/manager/manager-view";
import { writeAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

const IMPERSONATE_COOKIE = "impersonateAccountId";

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

export default async function ManagerDashboardPage() {
  const session = await safeGetServerSession();
  if (!session) {
    redirect("/login?next=/dashboard/manager");
  }

  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  const type = String(acct?.type || (session as any)?.type || "");
  if (!type) {
    redirect("/login?error=no_account&next=/dashboard/manager");
  }
  if (String((acct as any)?.status || "") === "disabled") {
    redirect("/login?error=disabled&next=/dashboard/manager");
  }
  const canImpersonate = Boolean(acct && acct.type === "admin" && hasAccountCapability(acct, "users.impersonate.read_only"));
  const cookieStore = await cookies();
  const impersonateId = cookieStore.get(IMPERSONATE_COOKIE)?.value || "";

  let effectiveAcct: any = acct;
  let effectiveType = type;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let isImpersonating = false;

  if (impersonateId && canImpersonate) {
    const targetRes = await sanityFetch({
      query: `*[_type == "account" && _id == $id][0]{_id, email, name, type, status}`,
      params: { id: impersonateId },
      perspective: "published",
    });
    const target = (targetRes as any)?.data as any;
    if (target?._id && String(target.status || "") !== "disabled") {
      effectiveAcct = target;
      effectiveType = String(target.type || "");
      isImpersonating = true;
    }
  }

  if (effectiveType !== "manager") {
    redirect("/dashboard");
  }

  const name = String((session as any)?.user?.name || "");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const emailLower = String(effectiveAcct?.email || email || "").toLowerCase();
  const effectiveAcctId = String(effectiveAcct?._id || "");

  const canInviteEmployees = hasAccountCapability(effectiveAcct, "users.invite.limited");
  const canCreateTasks = hasAccountCapability(effectiveAcct, "task.create");
  const canManageServices = hasAccountCapability(effectiveAcct, "client.services.manage");
  const canAssign = hasAccountCapability(effectiveAcct, "task.assign.team");

  // Fetch data in parallel
  const [
    employeesRes,
    clientsRes,
    unassignedWorkItemsRes,
    myWorkItemsRes,
    receivedSignupsRes,
    submittedSponsorshipsRes,
    openClientRequestsRes,
    clientServicesRes,
    openServiceRequestsRes,
    myThreadsRes
  ] = await Promise.all([
    // Employees
    sanityFetch({ query: `*[_type == "account" && type == "employee" && status == "active"]{_id, name, email, avatar, status}|order(name asc)` }),
    // Clients
    sanityFetch({ query: `*[_type == "account" && type == "client" && status == "active"]{_id, name, email, avatar}|order(name asc)` }),
    // Unassigned Work Items
    sanityFetch({ 
        query: `*[_type == "workItem" && !defined(assignedTo) && status != "completed" && status != "cancelled"]{_id, title, priority, status, dueDate, visibility, "assignedTo": assignedTo->{name, email, avatar}}|order(createdAt desc)` 
    }),
    // My Work Items
    sanityFetch({ 
        query: `*[_type == "workItem" && assignedTo._ref == $id && status != "completed" && status != "cancelled"]{_id, title, priority, status, dueDate, visibility}|order(dueDate asc)`,
        params: { id: effectiveAcctId }
    }),
    // Received Signups
    sanityFetch({ query: `*[_type == "signup" && status == "received"]{_id, name, email, company, status, createdAt}|order(createdAt desc)` }),
    // Submitted Sponsorships
    sanityFetch({ query: `*[_type == "sponsorship" && status == "submitted"]{_id, name, email, company, status, createdAt}|order(createdAt desc)` }),
    // Open Client Requests (Support)
    sanityFetch({ 
        query: `*[_type == "clientRequest" && status in ["submitted", "in_progress"]] {
            _id, subject, status, createdAt, priority,
            "clientEmail": clientAccount->email,
            clientAccount->{name, email},
            assignedTo->{_id, name, email},
            "commentCount": count(messages),
            "attachmentCount": count(attachments),
            statusHistory[] {
                fromStatus, toStatus, changedAt,
                changedBy->{name}
            }
        } | order(createdAt desc)` 
    }),
    // Client Services
    sanityFetch({ 
        query: `*[_type == "clientService"] {
            _id, title, serviceType, status, statusNote,
            clientCanToggle, clientEnabled,
            clientAccount->{name, email},
            client->{name, email}
        } | order(title asc)` 
    }),
    // Open Service Requests
    sanityFetch({ 
        query: `*[_type == "serviceRequest" && status == "pending"] {
            _id, requestedServiceType, details, attachments, status, createdAt,
            clientAccount->{name, email}
        } | order(createdAt desc)` 
    }),
    // My Threads
    sanityFetch({ 
        query: `*[_type == "messageThread" && $id in participants[]._ref] {
            _id, subject, type, updatedAt,
            participants[]->{_id, name, email, avatar, type},
            messages[-1] { message, createdAt, author->{name} }
        } | order(updatedAt desc)`,
        params: { id: effectiveAcctId }
    }),
  ]);

  const employees = (employeesRes as any)?.data || [];
  const clients = (clientsRes as any)?.data || [];
  const unassignedWorkItems = (unassignedWorkItemsRes as any)?.data || [];
  const myWorkItems = (myWorkItemsRes as any)?.data || [];
  const receivedSignups = (receivedSignupsRes as any)?.data || [];
  const submittedSponsorships = (submittedSponsorshipsRes as any)?.data || [];
  const openClientRequests = (openClientRequestsRes as any)?.data || [];
  const clientServices = (clientServicesRes as any)?.data || [];
  const openServiceRequests = (openServiceRequestsRes as any)?.data || [];
  const myThreads = (myThreadsRes as any)?.data || [];

  const stats = {
    myActiveTasks: myWorkItems.length,
    pendingRequests: openClientRequests.length + openServiceRequests.length + receivedSignups.length + submittedSponsorships.length,
    teamSize: employees.length
  };

  // Server Actions
  async function inviteEmployee(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
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

  async function createWorkItem(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
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

  async function assignWorkItem(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
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

  async function updateStatus(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
    // Basic task management capability check
    if (!hasAccountCapability(acct, "task.create")) return; 

    const id = String(formData.get("id") || "").trim();
    const status = String(formData.get("status") || "").trim();
    const type = String(formData.get("type") || "").trim(); // workItem, signup, sponsorship

    if (!id || !status) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    if (type === "signup" || type === "sponsorship") {
        if (!hasAccountCapability(acct, "client.intake.process")) return;
        await writeClient.patch(id).set({ status }).commit();
    } else {
        await writeClient.patch(id).set({ status }).commit();
    }
    revalidatePath("/dashboard/manager");
  }

  async function assignSignup(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
    if (!hasAccountCapability(acct, "client.intake.process")) return;

    const id = String(formData.get("id") || "").trim();
    const assigneeId = String(formData.get("assigneeId") || "").trim();
    if (!id || !assigneeId) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    await writeClient.patch(id).set({
        assignedTo: { _type: "reference", _ref: assigneeId }
    }).commit();
    revalidatePath("/dashboard/manager");
  }

  async function assignSponsorship(formData: FormData) {
    "use server";
    // Same logic as signup assignment
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
    if (!hasAccountCapability(acct, "client.intake.process")) return;

    const id = String(formData.get("id") || "").trim();
    const assigneeId = String(formData.get("assigneeId") || "").trim();
    if (!id || !assigneeId) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    await writeClient.patch(id).set({
        assignedTo: { _type: "reference", _ref: assigneeId }
    }).commit();
    revalidatePath("/dashboard/manager");
  }

  async function assignClientRequest(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
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

  async function addClientRequestMessage(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
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

  async function updateClientRequest(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
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

  async function createClientService(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
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
    revalidatePath("/dashboard/manager");
  }

  async function updateClientService(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
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

  async function updateServiceRequestStatus(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
    if (!hasAccountCapability(acct, "client.services.manage")) return;

    const id = String(formData.get("id") || "").trim();
    const status = String(formData.get("status") || "").trim();
    if (!id || !status) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    await writeClient.patch(id).set({ status }).commit();
    revalidatePath("/dashboard/manager");
  }

  async function createOrOpenDmThread(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
    
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

  return (
    <ManagerView
      data={{
        employees,
        clients,
        unassignedWorkItems,
        myWorkItems,
        receivedSignups,
        submittedSponsorships,
        openClientRequests,
        clientServices,
        openServiceRequests,
        staff: employees, // Mapping employees to staff to match interface if needed, or just redundant
        myThreads,
        stats,
        currentUser: {
            name,
            email: emailLower
        }
      }}
      capabilities={{
        canInvite: canInviteEmployees,
        canCreateTasks: canCreateTasks,
        canManageServices: canManageServices,
        canAssign: canAssign
      }}
      actions={{
        inviteEmployee,
        createWorkItem,
        assignWorkItem,
        updateStatus,
        assignSignup,
        assignSponsorship,
        assignClientRequest,
        addClientRequestMessage,
        updateClientRequest,
        createClientService,
        updateClientService,
        updateServiceRequestStatus,
        createOrOpenDmThread
      }}
    />
  );
}
