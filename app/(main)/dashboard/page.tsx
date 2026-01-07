import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardRouterPage() {
  const session = await safeGetServerSession();
  if (!session) {
    redirect("/login?next=/dashboard");
  }
  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  const type = String(acct?.type || (session as any)?.type || "").toLowerCase();
  const dest =
    type === "client"
      ? "/dashboard/client"
      : type === "admin"
        ? "/dashboard/admin"
        : type === "manager"
          ? "/dashboard/manager"
          : type === "employee"
            ? "/dashboard/employee"
            : "/";
  redirect(dest);
}
