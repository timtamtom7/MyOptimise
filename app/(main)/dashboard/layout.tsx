import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await safeGetServerSession();
  if (!session) return redirect("/login");
  
  const email = String(session.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  
  if (!acct || acct.status === "disabled") return redirect("/login");

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block shrink-0">
         <AppSidebar account={acct} className="h-full sticky top-16" /> 
         {/* sticky top-16 assuming the main header is ~64px (h-16) and fixed/sticky. 
             If main header is sticky, sidebar needs to be sticky below it.
             Main layout uses `sticky top-0`.
          */}
      </div>
      <div className="flex-1 flex flex-col min-w-0 p-4 md:p-8">
        {children}
      </div>
    </div>
  );
}
