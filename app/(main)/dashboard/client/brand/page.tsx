import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { redirect } from "next/navigation";
import { BrandTab } from "@/components/dashboard/client/brand-tab";
import { suggestBrandAssetTags } from "@/app/actions/client";

export const dynamic = "force-dynamic";

export default async function ClientBrandPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  const email = String((session as any)?.user?.email || "");
  const acct = await fetchSanityAccountByEmail({ email });
  
  if (!acct || acct.status === "disabled" || acct.type !== "client") {
    redirect("/dashboard");
  }

  const canWrite = Boolean(process.env.SANITY_API_WRITE_TOKEN);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brand Assets</h1>
          <p className="text-muted-foreground">Manage your brand identity, logos, and files.</p>
        </div>
      </div>
      <BrandTab
        account={acct}
        actions={{ suggestBrandAssetTags }}
        canWrite={canWrite}
      />
    </div>
  );
}
