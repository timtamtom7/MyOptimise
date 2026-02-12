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

  if (!session) {
    return redirect("/login");
  }

  const email = String(session.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;

  if (!acct || acct.status === "disabled") return redirect("/login");

  return (
    <div className="flex h-screen w-full bg-[#F3F4F6] dark:bg-[#0a0a0a] overflow-hidden relative font-sans">
       {/* Ambient Background Elements */}
       <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px] pointer-events-none" />
       <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 blur-[120px] pointer-events-none" />
       
      <AppSidebar account={acct} className="flex" />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto pt-20 px-4 pb-32 md:p-6 lg:p-8 scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
}
