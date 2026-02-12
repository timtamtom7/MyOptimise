import { sanityFetch } from "@/sanity/lib/live";
import { MixingBoard } from "@/components/dashboard/admin/mixing-board";
import { redirect } from "next/navigation";
import { ALL_CAPABILITIES, ROLE_CAPABILITIES, UserCapabilities } from "@/lib/capabilities";
import { safeGetServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Permission Mixing Board | Optimise",
};

export default async function PermissionsPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  // Fetch all accounts
  const accountsRes = await sanityFetch({
    query: `*[_type == "account"] | order(name asc)`,
    perspective: "published",
  });
  const accounts = (accountsRes.data as any[]) || [];

  // Map to MixingBoard "User"
  const users = accounts.map(a => ({
    id: a._id,
    email: a.email,
    full_name: a.name || a.email,
    role: a.type || "employee",
    avatar_url: a.avatar?.asset?._ref ? "" : undefined // We can't easily resolve the URL here without a helper, but MixingBoard might handle it or we can ignore it for now.
  }));

  // Map capabilities
  const capabilities = ALL_CAPABILITIES.map(cap => ({
    id: cap,
    name: cap.split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
    category: cap.split('.')[0],
    description: cap
  }));

  // Calculate User Capabilities (Effective)
  const userCapabilities: { user_id: string; capability_id: string; granted: boolean }[] = [];

  for (const account of accounts) {
    const role = (account.type || "employee") as keyof typeof ROLE_CAPABILITIES;
    const baseCaps = ROLE_CAPABILITIES[role] || {};
    const explicitGranted = new Set(account.capabilities || []);
    const explicitRevoked = new Set(account.revokedCapabilities || []);

    for (const cap of ALL_CAPABILITIES) {
      const base = !!baseCaps[cap];
      const granted = explicitGranted.has(cap) || (base && !explicitRevoked.has(cap));
      
      userCapabilities.push({
        user_id: account._id,
        capability_id: cap,
        granted
      });
    }
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permission Mixing Board</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Fine-grained access control matrix. Toggle individual capabilities for each user.
        </p>
      </div>

      <MixingBoard 
        users={users} 
        capabilities={capabilities} 
        userCapabilities={userCapabilities} 
      />
    </div>
  );
}
