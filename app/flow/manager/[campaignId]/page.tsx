import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { redirect, notFound } from "next/navigation";
import { CampaignView } from "@/components/flow/manager/campaign-view";
import { 
  claimDeliverable, 
  updateDeliverableStatus, 
  submitDeliverableVersion,
  generateApprovalLink 
} from "@/app/actions/deliverables";

export const dynamic = "force-dynamic";

export default async function CampaignFlowPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await params;
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  
  if (!email) redirect("/api/auth/signin");

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || (acct.type !== "manager" && acct.type !== "admin" && acct.type !== "strategist")) {
    redirect("/flow");
  }

  // Fetch Campaign and Deliverables
  const query = `*[_type == "campaign" && _id == $id][0]{
    _id,
    title,
    status,
    description,
    strategy,
    strategyDeck,
    client->{
      name, 
      email, 
      avatar, 
      brandAssets[]{
        title,
        type,
        tags,
        aiSuggestedTags,
        url,
        file{asset->{_id, url, originalFilename}}
      },
      industry,
      serviceScope,
      creativeGoal,
      audienceSegments,
      contentPillars
    },
    "deliverables": *[_type == "deliverable" && campaign._ref == ^._id] | order(_createdAt desc){
      _id,
      title,
      status,
      type,
      platform,
      dueDate,
      price,
      hook,
      script,
      visualDirection,
      assignedTo->{name, email, avatar},
      versionHistory,
      approvalToken,
      approvalTokenExpiry
    }
  }`;

  const { data: campaign } = await sanityFetch({
    query,
    params: { id: campaignId }
  });

  if (!campaign) notFound();

  // Actions for the UI
  const actions = {
    updateStatus: updateDeliverableStatus,
    generateApproval: generateApprovalLink,
    // Add createBrief later
  };

  return (
    <CampaignView 
      campaign={campaign as any} 
      actions={actions}
      user={{ name: acct.name, email: acct.email, id: acct._id }}
    />
  );
}
