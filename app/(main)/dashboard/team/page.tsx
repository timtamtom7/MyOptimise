import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { redirect } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { TeamTab } from "@/components/dashboard/manager/team-tab";
import { hasAccountCapability } from "@/lib/capabilities";
import { revalidatePath } from "next/cache";
import { updateEmployee, deleteEmployee } from "@/app/actions/team";
import bcrypt from "bcryptjs";

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
  // Admins see everyone. Managers see employees.
  const query = type === 'admin' 
    ? `*[_type == "account"] | order(name asc){ _id, name, email, avatar, role, tags, status, type }`
    : `*[_type == "account" && type == "employee"] | order(name asc){ _id, name, email, avatar, role, tags, status, type }`;
    
  const employees = await client.fetch(query);

  // --- CAPABILITIES ---
  const canInviteEmployees = type === 'admin' || hasAccountCapability(account, "users.invite");

  // --- ACTIONS ---
  async function inviteEmployee(formData: FormData) {
    "use server";
    const session = await safeGetServerSession();
    if (!session) return;
    
    // In a real app, this would send an email or create a placeholder.
    // For now, we'll just create a pending account if it doesn't exist.
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "").toLowerCase();
    const role = String(formData.get("role") || "employee");
    const password = String(formData.get("password") || "").trim();
    
    if (!name || !email) return;

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    if (!writeToken) return;
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

    const existing = await writeClient.fetch(`*[_type == "account" && email == $email][0]`, { email });
    if (existing) return;

    // Determine account type based on role selection
    // Only admins can create non-employees
    const adminSession = await safeGetServerSession();
    const adminEmail = String(adminSession?.user?.email || "");
    const adminAcct = await fetchSanityAccountByEmail({ email: adminEmail });
    
    let accountType = "employee";
    if (adminAcct?.type === "admin" && (role === "manager" || role === "admin")) {
        accountType = role;
    }

    let hashedPassword = undefined;
    if (password) {
        hashedPassword = await bcrypt.hash(password, 10);
    }

    await writeClient.create({
        _type: "account",
        name,
        email,
        type: accountType,
        role: role, // Store role string as well
        password: hashedPassword,
        status: "active", // Auto activate for demo
        createdAt: new Date().toISOString()
    });

    revalidatePath("/dashboard/manager");
    revalidatePath("/dashboard/team");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team</h1>
        <p className="text-muted-foreground">Manage your team members and roles.</p>
      </div>
      <TeamTab
        employees={employees}
        capabilities={{
          canInvite: canInviteEmployees,
        }}
        actions={{
          inviteEmployee,
          updateEmployee,
          deleteEmployee,
        }}
      />
    </div>
  );
}
