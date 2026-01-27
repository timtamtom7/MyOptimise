import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { redirect } from "next/navigation";

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
    <div className="min-h-screen px-4 py-4 md:px-8 md:py-8">
      <div className="mx-auto max-w-6xl">{children}</div>
    </div>
  );
}
