import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { hasAccountCapability } from "@/lib/capabilities";
import { redirect } from "next/navigation";
import { AccountsTab } from "@/components/dashboard/admin/accounts-tab";
import { 
  inviteGoogleAccount, 
  updateAccountSimple as updateAccount, 
  removeAccount, 
  startImpersonation 
} from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  const email = String((session as any)?.user?.email || "");
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct) redirect("/login");
  
  const type = String(acct.type || "").toLowerCase();
  if (type !== "admin") {
    redirect("/dashboard");
  }

  // Fetch all accounts
  const accountsRes = await sanityFetch({
    query: `*[_type == "account"] | order(name asc)`,
    perspective: "published",
  });
  const accounts = (accountsRes.data as any[]) || [];

  const capabilities = {
    canInvite: type === 'admin' || hasAccountCapability(acct, "users.invite"),
    canRemove: type === 'admin' || hasAccountCapability(acct, "users.remove"),
    canImpersonate: type === 'admin' || hasAccountCapability(acct, "admin.impersonate"),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <AccountsTab 
        accounts={accounts} 
        capabilities={capabilities}
        actions={{
          inviteGoogleAccount,
          updateAccount,
          removeAccount,
          startImpersonation
        }}
      />
    </div>
  );
}
