import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { redirect, notFound } from "next/navigation";
import { CampaignView } from "@/components/flow/manager/campaign-view";
import {
  updateDeliverableStatus,
  generateApprovalLink
} from "@/app/actions/deliverables";
import { mapSanityToBrief } from "@/lib/flow-service";

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
    strategyDeck{
        status, 
        strategicPillars,
        targetAudience,
        toneOfVoice,
        moodboard[]{
            _key,
            url, 
            note,
            image{asset->{url}}
        },
        slides[]{
            _key,
            title,
            layout,
            content,
            notes,
            image{asset->{url}},
            galleryImages[]{
                _key,
                asset->{url}
            }
        },
        competitors,
        proposedDeliverables
    },
    client->{
      _id,
      name, 
      email, 
      avatar, 
      brandAssets[]{
        _key,
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
      assignedTo->{_id, name, email, avatar},
      versionHistory[] {
        versionNumber,
        url,
        notes,
        createdAt
      },
      statusHistory[]{fromStatus, toStatus, changedAt, changedBy->{name, email}, notes},
      approvalToken,
      approvalTokenExpiry,
      _createdAt,
      _updatedAt,
      campaign->{
        title,
        strategyDeck{
            status, 
            strategicPillars,
            targetAudience,
            toneOfVoice,
            moodboard[]{
                url, 
                image{asset->{url}}
            }
        }
      },
      client->{
        name,
        brandAssets[]{
          title, 
          type, 
          tags, 
          aiSuggestedTags, 
          url, 
          file{asset->{_id, url, originalFilename}}
        }
      }
    }
  }`;

  const { data: campaign } = await sanityFetch({
    query,
    params: { id: campaignId }
  });

  if (!campaign) notFound();

  // Map deliverables to unified type
  const unifiedDeliverables = (campaign.deliverables || []).map(mapSanityToBrief);

  const actions = {
    updateStatus: updateDeliverableStatus,
    generateApproval: generateApprovalLink,
  };

  return (
    <CampaignView
      campaign={{
        ...campaign,
        deliverables: unifiedDeliverables
      } as any}
      actions={actions}
      user={{ name: acct.name, email: acct.email, id: acct._id }}
    />
  );
}
