import { fetchSanityCampaignById, fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { client } from "@/sanity/lib/client";
import { notFound, redirect } from "next/navigation";
import { CampaignView } from "@/components/flow/manager/campaign-view";
import { updateCampaignStatus, generateCampaignApproval } from "@/app/actions/campaigns";
import { safeGetServerSession } from "@/lib/auth";

export default async function CampaignStrategyPage({ params }: { params: { campaignId: string } }) {
  const session = await safeGetServerSession();
  if (!session) redirect("/auth/login");

  const [campaign, acct] = await Promise.all([
    fetchSanityCampaignById({ id: params.campaignId }),
    fetchSanityAccountByEmail({ email: session?.user?.email || "" })
  ]);

  if (!campaign) notFound();

  // Fetch deliverables separately
  const deliverables = await client.fetch(
    `*[_type == "deliverable" && references($id)] | order(_createdAt desc)`, 
    { id: params.campaignId }
  );

  const fullCampaign = {
    ...campaign,
    deliverables: deliverables || []
  };

  const user = {
    name: acct?.name || session.user?.name,
    email: acct?.email || session.user?.email,
    id: acct?._id,
    avatar: acct?.avatar,
    role: acct?.type || "employee"
  };

  return (
    <CampaignView 
      campaign={fullCampaign} 
      actions={{
        updateStatus: updateCampaignStatus,
        generateApproval: generateCampaignApproval
      }}
      user={user}
    />
  );
}
