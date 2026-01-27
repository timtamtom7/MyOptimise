import { sanityFetch } from "@/sanity/lib/live";
import { safeGetServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateCampaignForm } from "@/components/dashboard/employee/create-campaign-form";

interface PageProps {
  searchParams: Promise<{ clientId: string }>;
}

export default async function NewCampaignPage({ searchParams }: PageProps) {
  const { clientId } = await searchParams;
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  if (!clientId) {
    redirect("/dashboard/employee");
  }

  const { data } = await sanityFetch({
    query: `*[_type == "account" && _id == $clientId][0]{name, businessName}`,
    params: { clientId },
  });

  if (!data) {
    redirect("/dashboard/employee");
  }

  const clientName = data.businessName || data.name || "Client";

  return (
    <div className="container mx-auto px-4 py-8">
      <CreateCampaignForm clientId={clientId} clientName={clientName} />
    </div>
  );
}
