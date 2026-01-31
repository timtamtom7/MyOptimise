import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { redirect } from "next/navigation";
import { client } from "@/sanity/lib/client";
import { claimDeliverable, submitDeliverableVersion, updateDeliverableStatus } from "@/app/actions/deliverables";
import { JobBoard } from "@/components/flow/editor/job-board";
import { Brief } from "@/types/briefs";
import { mapSanityToBrief } from "@/lib/flow-service";

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

  const allSanityDeliverables = await client.fetch(query);
  const briefs = allSanityDeliverables.map(mapSanityToBrief);

  const assignedBriefs = briefs.filter((b: Brief) => b.assignee_id === ctx.acct._id && b.status !== "approved");
  const completedBriefs = briefs.filter((b: Brief) => b.assignee_id === ctx.acct._id && b.status === "approved");

  // Available: Not assigned, and status is "drafting" (Ready for Editor)
  // In our mapped Brief model, that appears as "assigned".
  // If no assignee, it means it's ready to be claimed.
  const availableBriefs = briefs.filter((b: Brief) => !b.assignee_id && b.status === "assigned");

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
