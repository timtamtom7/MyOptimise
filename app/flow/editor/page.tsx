import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { redirect } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { claimDeliverable, submitDeliverableVersion, updateDeliverableStatus } from "@/app/actions/deliverables";
import { JobBoard } from "@/components/flow/editor/job-board";
import { Brief } from "@/types/briefs";

export const dynamic = "force-dynamic";

async function requireEditor() {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return null;
  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct) return null;
  if (acct.status === "disabled") return null;
  
  const type = String(acct.type || "").toLowerCase();
  // Allow editors, admins, and managers to view
  if (type !== "editor" && type !== "admin" && type !== "manager") return null;

  return { session, acct, email };
}

export default async function FlowEditorPage() {
  const ctx = await requireEditor();
  if (!ctx) redirect("/");

  // Fetch Deliverables from Sanity
  // Statuses: todo (Strategy), drafting (Execution), internal_review (Review), client_review, approved, scheduled, archived
  const query = `*[_type == "deliverable" && status != "archived"]{
    _id,
    title,
    status,
    assignedTo->{_id, name, email},
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
    },
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
    dueDate,
    format,
    description,
    hook,
    creativeGoal,
    contentConcept,
    references,
    assets[]{
      _type,
      url,
      asset->{url, originalFilename}
    },
    script,
    visualDirection,
    difficulty,
    claimedAt,
    price,
    versionHistory,
    statusHistory[]{fromStatus, toStatus, changedAt, changedBy->{name, email}, notes},
    _createdAt,
    _updatedAt
  }`;

  const allDeliverables = await client.fetch(query);

  const mapStatus = (s: string): Brief['status'] => {
    switch (s) {
      case 'todo': return 'draft'; 
      case 'drafting': return 'assigned'; 
      case 'internal_review': return 'in_review';
      case 'client_review': return 'client_review';
      case 'approved': return 'approved';
      case 'scheduled': return 'scheduled';
      default: return 'draft';
    }
  };

  const mapToBrief = (d: any): Brief => {
    const brandAssets = Array.isArray(d.client?.brandAssets) ? d.client.brandAssets : [];
    const rawTags = brandAssets.flatMap((asset: any) => [
      ...(Array.isArray(asset.tags) ? asset.tags : []),
      ...(Array.isArray(asset.aiSuggestedTags) ? asset.aiSuggestedTags : []),
    ]);
    const brandTags = Array.from(
      new Set(
        rawTags.filter(
          (tag: unknown) => typeof tag === "string" && tag.trim(),
        ) as string[],
      ),
    );

    const requiredAssets = Array.isArray(d.assets)
      ? d.assets
          .map((asset: any) => {
            if (asset?._type === "file" && asset?.asset?.url) {
              return { 
                type: "file" as const, 
                url: asset.asset.url,
                name: asset.asset.originalFilename || "Attached File"
              };
            }
            if (typeof asset === "string") {
              return { type: "url" as const, url: asset };
            }
            if (asset && typeof asset.url === "string") {
              return { type: "url" as const, url: asset.url };
            }
            return null;
          })
          .filter((item: { type: "file" | "url"; url: string } | null): item is { type: "file" | "url"; url: string; name?: string } => Boolean(item && item.url))
      : [];

    // Append Strategy Moodboard if approved
    if (d.campaign?.strategyDeck?.status === 'approved' && Array.isArray(d.campaign.strategyDeck.moodboard)) {
        const moodboardAssets = d.campaign.strategyDeck.moodboard
            .map((m: any) => {
                const url = m.url || m.image?.asset?.url;
                if (!url) return null;
                return {
                    type: 'url' as const,
                    url: url,
                    name: 'Strategy Moodboard Item'
                };
            })
            .filter((item: any) => item !== null);
        
        if (requiredAssets) {
             requiredAssets.push(...moodboardAssets);
        }
    }

    return {
      id: d._id,
      workspace_id: "default",
      title: d.title || "Untitled",
      hook: d.hook || null,
      script: d.script || null,
      visual_direction: d.visualDirection || null,
      assets_url: null,
      video_url: d.versionHistory?.[d.versionHistory.length - 1]?.url || null,
      feedback: null,
      status: mapStatus(d.status),
      assignee_id: d.assignedTo?._id || null,
      author_id: "system",
      price: d.price || null,
      creative_goal: d.creativeGoal || null,
      content_concept: d.contentConcept || null,
      references: Array.isArray(d.references) ? (d.references as string[]) : null,
      required_assets: requiredAssets,
      difficulty: d.difficulty || null,
      claimed_at: d.claimedAt || null,
      deadline: d.dueDate || null,
      platform: d.platform || null,
      format: d.format || null,
      metadata: { 
        client: d.client?.name, 
        campaign: d.campaign?.title, 
        dueDate: d.dueDate,
        format: d.format,
        brandTags,
      },
      status_history: d.statusHistory || [],
      created_at: d._createdAt,
      updated_at: d._updatedAt,
      strategy_pillars: d.campaign?.strategyDeck?.strategicPillars || null,
      target_audience: d.campaign?.strategyDeck?.targetAudience || null,
      tone_of_voice: d.campaign?.strategyDeck?.toneOfVoice || null,
      client_assets: d.client?.brandAssets?.map((a: any) => ({
        title: a.title || "Untitled Asset",
        type: a.type || "other",
        url: a.url || a.file?.asset?.url || "",
        tags: [...(a.tags || []), ...(a.aiSuggestedTags || [])],
        // Include asset ID for linking
        assetId: a.file?.asset?._id
      })).filter((a: any) => a.url) || [],
    };
  };

  const briefs = allDeliverables.map(mapToBrief);

  const assignedBriefs = briefs.filter((b: Brief) => b.assignee_id === ctx.acct._id && b.status !== "approved");
  const completedBriefs = briefs.filter((b: Brief) => b.assignee_id === ctx.acct._id && b.status === "approved");

  // Available: Not assigned, and status is "drafting" (Ready for Editor)
  // In our mapped Brief model, that appears as "assigned".
  // If no assignee, it means it's ready to be claimed.
  const availableBriefs = briefs.filter((b: Brief) => !b.assignee_id && b.status === "assigned");
  
  const allOpenBriefs = [...availableBriefs, ...assignedBriefs];

  const editorViewData = {
    user: { 
        name: ctx.acct.name || "Editor", 
        email: ctx.email, 
        id: ctx.acct._id 
    },
    availableBriefs: availableBriefs,
    myBriefs: assignedBriefs,
    completedBriefs: completedBriefs
  };

  const editorActions = {
    submitDeliverable: submitDeliverableVersion,
    updateBriefStatus: updateDeliverableStatus,
    claimDeliverable: claimDeliverable,
  };

  return <JobBoard data={editorViewData} actions={editorActions} />;
}
