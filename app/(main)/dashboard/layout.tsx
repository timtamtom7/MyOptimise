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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      <AppSidebar account={acct} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 pt-16 md:p-6 md:pt-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
