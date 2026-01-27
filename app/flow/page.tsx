import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { redirect } from "next/navigation";

export default async function FlowRootPage() {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  
  if (!email) redirect("/api/auth/signin?callbackUrl=/flow");

  const acct = await fetchSanityAccountByEmail({ email });

  if (!acct || acct.status === "disabled") {
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="text-center">
                <h1 className="text-2xl font-display font-medium mb-2">Account Not Active</h1>
                <p className="text-slate-500">Please contact support.</p>
            </div>
        </div>
    );
  }

  // Role-based routing
  if (acct.type === "admin" || acct.type === "manager" || acct.type === "strategist") {
      redirect("/flow/manager");
  } else if (acct.type === "editor") {
      redirect("/flow/editor");
  } else if (acct.type === "client") {
      redirect("/flow/client");
  } else {
      // Fallback
      redirect("/flow/editor");
  }
}
