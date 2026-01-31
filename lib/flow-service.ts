import { client } from "@/sanity/lib/client";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Brief } from "@/types/briefs";

/**
 * Normalizes a Sanity deliverable into the shared Brief interface.
 */
export function mapSanityToBrief(d: any): Brief {
    const brandAssets = Array.isArray(d.client?.brandAssets) ? d.client.brandAssets : [];

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
            .filter((item: any): item is { type: "file" | "url"; url: string; name?: string } => Boolean(item && item.url))
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

        requiredAssets.push(...moodboardAssets);
    }

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

    return {
        id: d._id,
        workspace_id: "sanity",
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
            assetId: a.file?.asset?._id
        })).filter((a: any) => a.url) || [],
    };
}

/**
 * Normalizes a Supabase brief into the shared Brief interface.
 */
export function mapSupabaseToBrief(b: any): Brief {
    let status = b.status;
    if (status === "in_review") status = "internal_review"; // Map to unified internal/client review logic

    return {
        id: b.id,
        workspace_id: b.workspace_id,
        title: b.title,
        hook: b.hook,
        script: b.script,
        visual_direction: b.visual_direction,
        assets_url: b.assets_url,
        video_url: b.video_url,
        feedback: b.feedback,
        status: status,
        assignee_id: b.assignee_id,
        author_id: b.author_id,
        price: b.price,
        creative_goal: b.metadata?.creativeGoal,
        content_concept: b.metadata?.contentConcept,
        references: Array.isArray(b.references) ? b.references : null,
        required_assets: b.metadata?.required_assets || [],
        difficulty: b.metadata?.difficulty,
        claimed_at: b.claimed_at,
        deadline: b.metadata?.deadline,
        platform: b.metadata?.platform,
        format: b.metadata?.format,
        metadata: b.metadata,
        status_history: b.metadata?.status_history || [],
        created_at: b.created_at,
        updated_at: b.updated_at,
        strategy_pillars: b.metadata?.strategy_pillars,
        target_audience: b.metadata?.target_audience,
        tone_of_voice: b.metadata?.tone_of_voice,
        client_assets: b.metadata?.client_assets || [],
    };
}
