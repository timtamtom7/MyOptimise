import Link from "next/link";
import { safeGetServerSession } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export default async function DashboardPage() {
  const session = await safeGetServerSession();
  if (!session) {
    redirect("/login?next=/dashboard");
  }
  const locale = await getLocale();
  const role = String((session as any)?.type || "");
  const canAccessStudio = role === "admin";

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-semibold">{t("welcome", locale)}</h1>
      <p className="mt-2 text-muted-foreground">{t("heroSubLoggedIn", locale)}</p>
      <div className="mt-6 rounded-md border p-4">
        <div className="text-sm text-muted-foreground">Signed in as</div>
        <div className="mt-1 font-medium">{(session as any)?.user?.email || ""}</div>
        {role ? <div className="mt-1 text-sm text-muted-foreground">Role: {role}</div> : null}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/" className="rounded-md border px-3 py-2">
          Home
        </Link>
        <Link href="/admin" className="rounded-md border px-3 py-2">
          Admin
        </Link>
        {canAccessStudio ? (
          <Link href="/studio" className="rounded-md border px-3 py-2">
            Studio
          </Link>
        ) : null}
      </div>
    </div>
  );
}
