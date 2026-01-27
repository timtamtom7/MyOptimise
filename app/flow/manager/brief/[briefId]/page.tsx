import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { redirect, notFound } from "next/navigation";
import { ManagerDeliverableReview } from "@/components/flow/manager/deliverable-review";
import { 
  updateDeliverableStatus, 
  generateApprovalLink 
} from "@/app/actions/deliverables";

export const dynamic = "force-dynamic";

export default async function ManagerBriefPage({ params }: { params: Promise<{ briefId: string }> }) {
  const { briefId } = await params;
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  
  if (!email) redirect("/api/auth/signin");

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || (acct.type !== "manager" && acct.type !== "admin" && acct.type !== "strategist")) {
    redirect("/flow");
  }

  // Fetch Deliverable with full details
  const query = `*[_type == "deliverable" && _id == $id][0]{
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
    campaign->{_id, title, client->{name}},
    assignedTo->{name, email, avatar},
    versionHistory[]{
        versionNumber,
        url,
        notes,
        createdAt,
        comments[]{
            _key,
            text,
            timestamp,
            createdAt,
            author->{name, avatar}
        }
    },
    approvalToken
  }`;

  const { data: brief } = await sanityFetch({
    query,
    params: { id: briefId }
  });

  if (!brief) notFound();

  const actions = {
    updateStatus: updateDeliverableStatus,
    generateApproval: generateApprovalLink,
  };

  return (
    <ManagerDeliverableReview 
      brief={brief as any} 
      actions={actions}
      user={{ name: acct.name, email: acct.email }}
    />
  );
}
