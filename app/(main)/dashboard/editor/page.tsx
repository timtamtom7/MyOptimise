import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { EditorView } from "@/components/dashboard/editor/editor-view";
import { Brief } from "@/types/briefs";
import { client } from "@/sanity/lib/client";
import { claimDeliverable, submitDeliverableVersion, updateDeliverableStatus } from "@/app/actions/deliverables";

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

export default async function EditorDashboardPage() {
  const ctx = await requireEditor();
  if (!ctx) redirect("/");

  // Fetch Deliverables from Sanity
  // Statuses: todo (Strategy), drafting (Execution), internal_review (Review), client_review, approved, scheduled, archived
  const query = `*[_type == "deliverable" && status != "archived"]{
    _id,
    title,
    status,
    assignedTo->{_id, name, email},
    client->{name, brandAssets[]{title, type, tags, aiSuggestedTags}},
    campaign->{title},
    dueDate,
    format,
    description,
    hook,
    creativeGoal,
    contentConcept,
    references,
    assets,
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

  const [allDeliverables, supabaseBriefsRes] = await Promise.all([
    client.fetch(query),
    (supabaseAdmin as any)
      .from("briefs")
      .select("*")
      .or(`assignee_id.eq.${ctx.acct._id},assignee_id.is.null`)
      .order("created_at", { ascending: false })
  ]);

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
      : null;

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
    };
  };

  const supabaseBriefs: Brief[] = (supabaseBriefsRes.data || []).map((b: any) => ({
    id: b.id,
    workspace_id: b.workspace_id,
    title: b.title,
    hook: b.hook,
    script: b.script,
    visual_direction: b.visual_direction,
    assets_url: b.assets_url,
    video_url: b.video_url,
    feedback: null,
    status: b.status as Brief["status"],
    assignee_id: b.assignee_id,
    author_id: b.author_id,
    price: b.price,
    creative_goal: b.creative_goal,
    content_concept: b.content_concept,
    references: b.references,
    required_assets: b.required_assets,
    difficulty: b.difficulty,
    claimed_at: b.claimed_at,
    deadline: b.deadline,
    platform: b.platform,
    format: b.format,
    metadata: {
      ...((b.metadata as object) || {}),
      approvalToken: b.approval_token,
      approvalTokenExpiry: b.approval_token_expiry,
    },
    status_history: b.status_history || [],
    created_at: b.created_at,
    updated_at: b.updated_at,
  }));

  const briefs = [...allDeliverables.map(mapToBrief), ...supabaseBriefs];

  const assignedBriefs = briefs.filter((b: Brief) => b.assignee_id === ctx.acct._id && b.status !== "approved");
  const completedBriefs = briefs.filter((b: Brief) => b.assignee_id === ctx.acct._id && b.status === "approved");

  // Available: Not assigned, and status is "drafting" (Ready for Editor)
  // In our mapped Brief model, that appears as "assigned".
  const availableBriefs = briefs.filter((b: Brief) => !b.assignee_id && b.status === "assigned");

  // Note: Sanity 'drafting' maps to Brief 'assigned'.
  // If no assignee, it means it's ready to be claimed.

  const allOpenBriefs = [...availableBriefs, ...assignedBriefs];

  const editorViewData = {
    user: {
      name: ctx.acct.name || "Editor",
      email: ctx.email,
      id: ctx.acct._id
    },
    assignedBriefs: allOpenBriefs,
    completedBriefs: completedBriefs
  };

  const editorActions = {
    submitDeliverable: async (formData: FormData) => { await submitDeliverableVersion(formData); },
    updateBriefStatus: async (formData: FormData) => { await updateDeliverableStatus(formData); },
    claimDeliverable: async (formData: FormData) => { await claimDeliverable(formData); },
    createUploadUrl: async (path: string) => {
      "use server";
      try {
        // @ts-ignore
        const { data, error } = await supabaseAdmin.storage
          .from('deliverables')
          .createSignedUploadUrl(path);
        if (error || !data) {
          console.error("Upload URL error:", error);
          return null;
        }
        return { signedUrl: data.signedUrl, token: data.token, path: data.path };
      } catch (e) {
        console.error("Upload URL exception:", e);
        return null;
      }
    }
  };

  return <EditorView data={editorViewData} actions={editorActions} />;
}
