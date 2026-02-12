import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { redirect } from "next/navigation";
import { ServicesGrid } from "@/components/dashboard/client/services-grid";
import { setClientServiceEnabled } from "@/app/actions/client";
import { hasAccountCapability } from "@/lib/capabilities";

export const dynamic = "force-dynamic";

export default async function ClientServicesPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  const email = String((session as any)?.user?.email || "");
  const acct = await fetchSanityAccountByEmail({ email });
  
  if (!acct || acct.status === "disabled" || acct.type !== "client") {
    redirect("/dashboard");
  }

  const acctId = String(acct._id);
  const canViewServices = hasAccountCapability(acct, "client.services.view");

  if (!canViewServices) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>You do not have access to view services.</p>
      </div>
    );
  }

  const { data: clientServices } = await sanityFetch({
    query: `*[_type == "clientService" && client._ref == $acctId] | order(coalesce(updatedAt, createdAt) desc)[0..49]{
        _id, title, serviceType, status, statusNote, clientCanToggle, clientEnabled, createdAt, updatedAt
      }`,
    params: { acctId },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">Manage your active subscriptions and services.</p>
        </div>
      </div>
      <ServicesGrid 
        services={(clientServices as any[]) || []}
        toggleAction={setClientServiceEnabled}
      />
    </div>
  );
}
