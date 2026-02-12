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
import { mapSanityToBrief, mapSupabaseToBrief } from "@/lib/flow-service";

export const dynamic = "force-dynamic";

export default async function ClientApprovalsPage() {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");

  if (!email) redirect("/login");

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || acct.type !== "client") {
    if (acct?.type !== "admin") {
      redirect("/dashboard");
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
    },
    assignedTo->{_id, name, email, avatar},
    versionHistory[]{
        versionNumber,
        url,
        notes,
        createdAt
    },
    statusHistory[]{fromStatus, toStatus, changedAt, changedBy->{name, email}, notes},
    _createdAt,
    _updatedAt
  }`;

  const { data: sanityDeliverables } = await sanityFetch({
    query,
    params: { clientId: acct._id }
  });

  // Fetch Sanity Campaigns with Strategy Review
  const strategyQuery = `*[_type == "campaign" && client._ref == $clientId && strategyDeck.status == "client_review"]{
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
    const { data: userData } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();
    
    if (userData?.id) {
       const { data: memberData } = await (supabaseAdmin as any)
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", userData.id)
        .single();
       if (memberData?.workspace_id) {
         const { data: briefsData } = await (supabaseAdmin as any)
            .from("briefs")
            .select("*")
            .eq("workspace_id", memberData.workspace_id)
            .order("created_at", { ascending: false });
            supabaseBriefs = briefsData || [];
       }
    }
  } catch (err) {
    console.error("Error fetching Supabase briefs:", err);
  }

  const mappedSanity = (sanityDeliverables as any[]).map(mapSanityToBrief);
  const mappedSupabase = supabaseBriefs.map(mapSupabaseToBrief);
  const allItems = [...mappedSanity, ...mappedSupabase].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <ApprovalStream 
        initialItems={allItems}
        strategies={strategies as any[]}
        currentUserId={acct._id}
        onApprove={async (id, notes) => {
            "use server";
            const formData = new FormData();
            formData.append("id", id);
            if(notes) formData.append("notes", notes);
            await approveDeliverable(formData);
        }}
        onReject={async (id, notes) => {
            "use server";
            const formData = new FormData();
            formData.append("id", id);
            if(notes) formData.append("notes", notes);
            await rejectDeliverable(formData);
        }}
      />
    </div>
  );
}
