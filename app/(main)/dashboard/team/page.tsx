import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { redirect } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { ManagerView } from "@/components/dashboard/manager/manager-view";
import { hasAccountCapability } from "@/lib/capabilities";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function TeamDashboardPage() {
  const session = await safeGetServerSession();
  if (!session) {
    redirect("/login?next=/dashboard/team");
  }

  const emailLower = String(session.user?.email || "").toLowerCase();
  const account = await fetchSanityAccountByEmail({ email: emailLower });

  if (!account) {
    redirect("/login");
  }

  if (account.status === "disabled") {
    redirect("/login");
  }

  const type = String(account.type || "").toLowerCase();
  if (type !== "manager" && type !== "admin") {
    redirect("/dashboard");
  }

  // --- DATA FETCHING ---
  // Reusing the same data fetching as Manager Dashboard to ensure full context
  const employees = await client.fetch(
    `*[_type == "account" && type == "employee" && status == "active"] | order(name asc){
      _id, name, email, avatar, role, tags
    }`
  );

  const clients = await client.fetch(
    `*[_type == "account" && type == "client" && status == "active"] | order(name asc){
       _id, name, email, avatar, organizationName
    }`
  );

  // Work Items
  const unassignedWorkItems = await client.fetch(
    `*[_type == "workItem" && !defined(assignedTo) && status != "completed" && status != "cancelled"] | order(dueDate asc) {
      _id, title, status, priority, dueDate, client->{name}
    }`
  );

  const myWorkItems = await client.fetch(
    `*[_type == "workItem" && assignedTo._ref == $id && status != "completed"] | order(dueDate asc) {
       _id, title, status, priority, dueDate, client->{name}
    }`,
    { id: account._id }
  );

  // Requests
  const openClientRequests = await client.fetch(
    `*[_type == "clientRequest" && status == "pending"] | order(createdAt desc) {
      _id, title, type, status, priority, createdAt, client->{name, email}
    }`
  );

  // Services
  const clientServices = await client.fetch(
    `*[_type == "clientService"]{
      _id, title, status, serviceType, client->{name, organizationName}
    }`
  );

  const openServiceRequests = await client.fetch(
    `*[_type == "serviceRequest" && status == "pending"] | order(createdAt desc) {
       _id, serviceType, status, createdAt, client->{name}
    }`
  );

  // Threads
  const myThreads = await client.fetch(
    `*[_type == "messageThread" && $id in participants[]._ref] | order(updatedAt desc) {
       _id, type, updatedAt, 
       participants[]->{_id, name, email},
       messages[-1]
    }`,
    { id: account._id }
  );

  // Stats
  const stats = {
     myActiveTasks: myWorkItems.length,
     pendingRequests: openClientRequests.length + openServiceRequests.length,
     teamSize: employees.length
  };

  const name = String(account.name || "");

  // --- CAPABILITIES ---
  const canInviteEmployees = hasAccountCapability(account, "team.invite");
  const canCreateTasks = hasAccountCapability(account, "tasks.create");
  const canManageServices = hasAccountCapability(account, "services.manage");
  const canAssign = hasAccountCapability(account, "tasks.assign");


  // --- ACTIONS ---
  
  async function inviteEmployee(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    if (!session) return;
    
    // In a real app, this would send an email or create a placeholder.
    // For now, we'll just create a pending account if it doesn't exist.
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "").toLowerCase();
    
    if (!name || !email) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const existing = await writeClient.fetch(`*[_type == "account" && email == $email][0]`, { email });
    if (existing) return;

    await writeClient.create({
        _type: "account",
        name,
        email,
        type: "employee",
        status: "active", // Auto activate for demo
        createdAt: new Date().toISOString()
    });

    revalidatePath("/dashboard/manager");
    revalidatePath("/dashboard/team");
  }

  async function createWorkItem(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    if (!session) return;

    const title = String(formData.get("title") || "");
    const priority = String(formData.get("priority") || "medium");
    const dueDate = String(formData.get("dueDate") || "");
    const clientId = String(formData.get("clientId") || "");
    const assignedToId = String(formData.get("assignedToId") || "");

    if (!title) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const doc: any = {
        _type: "workItem",
        title,
        status: "todo",
        priority,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (dueDate) doc.dueDate = dueDate;
    if (clientId) doc.client = { _type: "reference", _ref: clientId };
    if (assignedToId) doc.assignedTo = { _type: "reference", _ref: assignedToId };

    await writeClient.create(doc);
    revalidatePath("/dashboard/manager");
    revalidatePath("/dashboard/team");
  }

  async function assignWorkItem(formData: FormData) {
      "use server";
      const taskId = String(formData.get("taskId") || "");
      const userId = String(formData.get("userId") || "");
      
      if (!taskId || !userId) return;
      const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
      if (!writeToken) return;
      const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

      await writeClient.patch(taskId).set({ assignedTo: { _type: "reference", _ref: userId } }).commit();
      revalidatePath("/dashboard/manager");
      revalidatePath("/dashboard/team");
  }

  async function updateStatus(formData: FormData) {
      "use server";
      const taskId = String(formData.get("taskId") || "");
      const status = String(formData.get("status") || "");
      
      if (!taskId || !status) return;
      const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
      if (!writeToken) return;
      const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

      await writeClient.patch(taskId).set({ status }).commit();
      revalidatePath("/dashboard/manager");
      revalidatePath("/dashboard/team");
  }

  async function assignClientRequest(formData: FormData) {
      "use server";
      // This is a placeholder. Real implementation depends on how requests are assigned.
      // Usually moves to "in_progress" or assigns an employee.
  }

  async function addClientRequestMessage(formData: FormData) {
      "use server";
      // Placeholder
  }

  async function updateClientRequest(formData: FormData) {
      "use server";
      // Placeholder
  }

  async function createClientService(formData: FormData) {
      "use server";
      // Placeholder
  }

  async function updateClientService(formData: FormData) {
      "use server";
      // Placeholder
  }

  async function updateServiceRequestStatus(formData: FormData) {
    "use server";
    const id = String(formData.get("requestId") || "");
    const status = String(formData.get("status") || "");
    
    if (!id || !status) return;
    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    // If approving, create the service automatically?
    // Copying logic from Manager Page...
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
    revalidatePath("/dashboard/team");
  }

  async function createOrOpenDmThread(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return;
    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || acct.status === "disabled" || acct.type !== "manager") return;
    
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
        openClientRequests,
        clientServices,
        openServiceRequests,
        staff: employees,
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
        assignClientRequest,
        addClientRequestMessage,
        updateClientRequest,
        createClientService,
        updateClientService,
        updateServiceRequestStatus,
        createOrOpenDmThread
      }}
      defaultTab="team"
    />
  );
}
