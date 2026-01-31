import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { redirect, notFound } from "next/navigation";
import { ReviewMode } from "@/components/flow/client/review-mode";
import {
  approveDeliverable,
  rejectDeliverable
} from "@/app/actions/deliverables";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mapSanityToBrief, mapSupabaseToBrief } from "@/lib/flow-service";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function ClientReviewPage({ params }: PageProps) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  const { id } = params;

  if (!email) redirect(`/api/auth/signin?callbackUrl=/flow/client/review/${id}`);

  const acct = await fetchSanityAccountByEmail({ email });
  // Allow admins to view as well
  if (!acct || (acct.type !== "client" && acct.type !== "admin")) {
     redirect("/flow");
  }

  // 1. Try Fetching from Sanity
  const query = `*[_type == "deliverable" && _id == $id][0]{
    _id,
    title,
    status,
    type,
    platform,
    dueDate,
    campaign->{
        title,
        client->{_id}
    },
    client->{
        _id,
        name
    },
    versionHistory[]{
        versionNumber,
        url,
        notes,
        createdAt
    },
    _createdAt,
    _updatedAt
  }`;

  const { data: sanityDeliverable } = await sanityFetch({
    query,
    params: { id }
  });

  let deliverable = null;

  if (sanityDeliverable) {
    // Security Check: Ensure this deliverable belongs to the logged-in client (or is admin)
    const deliverableClientId = sanityDeliverable.client?._id || sanityDeliverable.campaign?.client?._id;
    if (acct.type !== "admin" && deliverableClientId !== acct._id) {
       return notFound();
    }
    
    // Map Sanity data to ReviewMode Deliverable interface
    deliverable = {
        _id: sanityDeliverable._id,
        title: sanityDeliverable.title,
        status: sanityDeliverable.status,
        type: sanityDeliverable.type || "Video",
        platform: sanityDeliverable.platform || "Social",
        versionHistory: sanityDeliverable.versionHistory || [],
        client: sanityDeliverable.client,
        campaign: sanityDeliverable.campaign
    };
  } else {
    // 2. Try Fetching from Supabase
    try {
        const { data: brief } = await (supabaseAdmin as any)
          .from("briefs")
          .select("*")
          .eq("id", id)
          .single();
        
        if (brief) {
           // For Supabase, we need to verify ownership via workspace
           const { data: userData } = await supabaseAdmin.from("users").select("id").eq("email", email).single();
           if(userData) {
               const { data: member } = await (supabaseAdmin as any)
                 .from("workspace_members")
                 .select("workspace_id")
                 .eq("user_id", userData.id)
                 .eq("workspace_id", brief.workspace_id)
                 .single();
               
               if(member || acct.type === "admin") {
                   const mappedBrief = mapSupabaseToBrief(brief);
                   // Map Brief to ReviewMode Deliverable interface
                   deliverable = {
                        _id: mappedBrief.id,
                        title: mappedBrief.title,
                        status: mappedBrief.status,
                        type: mappedBrief.format || "Video",
                        platform: mappedBrief.platform || "Social",
                        versionHistory: [{
                            versionNumber: 1,
                            url: mappedBrief.video_url || "",
                            notes: mappedBrief.feedback || undefined,
                            createdAt: mappedBrief.created_at
                        }],
                        client: { name: mappedBrief.metadata?.client || "Client" },
                        campaign: { title: mappedBrief.metadata?.campaign || "Campaign" }
                   };
               }
           }
        }
    } catch (err) {
        console.error("Failed to fetch Supabase brief:", err);
    }
  }

  if (!deliverable) {
    return notFound();
  }

  const actions = {
    approve: approveDeliverable,
    reject: rejectDeliverable
  };

  return (
    <ReviewMode
      deliverable={deliverable}
      actions={actions}
    />
  );
}
