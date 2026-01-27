import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { redirect } from "next/navigation";
import { ApprovalStream } from "@/components/flow/client/approval-stream";
import { 
  approveDeliverable, 
  rejectDeliverable 
} from "@/app/actions/deliverables";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function ClientFlowPage() {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  
  if (!email) redirect("/api/auth/signin?callbackUrl=/flow/client");

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || acct.type !== "client") {
    // If admin, maybe allow view? For now strict.
    if (acct?.type === "admin") {
        // Admin viewing client flow? Maybe useful for debugging.
    } else {
        redirect("/flow");
    }
  }

  // Fetch Sanity deliverables
  const query = `*[_type == "deliverable" && campaign->client._ref == $clientId] | order(_createdAt desc){
    _id,
    title,
    status,
    type,
    platform,
    dueDate,
    hook,
    script,
    visualDirection,
    creativeGoal,
    contentConcept,
    campaign->{title},
    versionHistory[]{
        versionNumber,
        url,
        notes,
        createdAt
    }
  }`;

  const { data: sanityDeliverables } = await sanityFetch({
    query,
    params: { clientId: acct._id }
  });

  // Fetch Sanity Campaigns with Strategy Review
  const strategyQuery = `*[_type == "campaign" && client._ref == $clientId && strategyDeck.status == "review"]{
    _id,
    title,
    client->{name},
    strategyDeck
  }`;
  
  const { data: strategies } = await sanityFetch({
    query: strategyQuery,
    params: { clientId: acct._id }
  });

  // Fetch Supabase Briefs
  let supabaseBriefs: any[] = [];
  try {
    // 1. Get Supabase User ID from email
    const { data: userData } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

    if (userData?.id) {
        // 2. Get Workspace ID
        const { data: memberData } = await (supabaseAdmin as any)
            .from("workspace_members")
            .select("workspace_id")
            .eq("user_id", userData.id)
            .single();

        if (memberData?.workspace_id) {
            // 3. Get Briefs for Workspace
            const { data: briefs } = await (supabaseAdmin as any)
                .from("briefs")
                .select("*")
                .eq("workspace_id", memberData.workspace_id)
                .order("created_at", { ascending: false });
            
            if (briefs) {
                supabaseBriefs = briefs.map((b: any) => {
                    // Map status to Client View statuses
                    // Supabase: draft, assigned, in_review, client_review, approved, changes_requested, scheduled
                    // Client View expects: client_review, approved, scheduled, changes_requested, etc.
                    
                    let status = b.status;
                    if (status === "in_review") status = "internal_review"; // Map if needed

                    return {
                        _id: b.id,
                        title: b.title,
                        status: status,
                        type: b.metadata?.type || "other",
                        platform: b.metadata?.platform || "other",
                        campaign: { title: "Brief" }, // Default campaign title
                        dueDate: b.metadata?.dueDate,
                        hook: b.hook,
                        script: b.script,
                        visualDirection: b.visual_direction,
                        creativeGoal: b.metadata?.creativeGoal,
                        contentConcept: b.metadata?.contentConcept,
                        versionHistory: b.video_url ? [{
                            versionNumber: 1,
                            url: b.video_url,
                            notes: b.metadata?.last_notes,
                            createdAt: b.updated_at
                        }] : []
                    };
                });
            }
        }
    }
  } catch (err) {
    console.error("Failed to fetch Supabase briefs:", err);
  }

  const allDeliverables = [...(sanityDeliverables || []), ...supabaseBriefs];

  const actions = {
    approve: approveDeliverable,
    reject: rejectDeliverable
  };

  return (
    <ApprovalStream 
      user={{ name: acct.name || "Client", email: acct.email }}
      deliverables={allDeliverables as any[]}
      strategies={strategies || []}
      actions={actions}
    />
  );
}
