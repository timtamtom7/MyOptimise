import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { redirect } from "next/navigation";
import { StrategyDeck } from "@/components/flow/manager/strategy-deck";

export const dynamic = "force-dynamic";

export default async function ManagerFlowPage() {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  
  if (!email) redirect("/api/auth/signin?callbackUrl=/flow/manager");

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || (acct.type !== "manager" && acct.type !== "admin" && acct.type !== "strategist")) {
    redirect("/flow");
  }

  // Fetch Campaigns managed by this user (or all if admin)
  // For MVP, we'll fetch all campaigns for simplicity, or filter by manager if we had that field populated.
  // Assuming 'campaign' has a 'manager' reference.
  const query = acct.type === "admin" 
    ? `*[_type == "campaign" && status == "active"]{
        _id,
        title,
        status,
        client->{_id, name, email, avatar},
        "totalBriefs": count(*[_type == "deliverable" && campaign._ref == ^._id]),
        "activeBriefs": count(*[_type == "deliverable" && campaign._ref == ^._id && status in ["drafting", "internal_review", "client_review", "changes_requested"]]),
        "needsReview": count(*[_type == "deliverable" && campaign._ref == ^._id && status == "internal_review"])
      } | order(client.name asc)`
    : `*[_type == "campaign" && status == "active" && manager._ref == $id]{
        _id,
        title,
        status,
        client->{_id, name, email, avatar},
        "totalBriefs": count(*[_type == "deliverable" && campaign._ref == ^._id]),
        "activeBriefs": count(*[_type == "deliverable" && campaign._ref == ^._id && status in ["drafting", "internal_review", "client_review", "changes_requested"]]),
        "needsReview": count(*[_type == "deliverable" && campaign._ref == ^._id && status == "internal_review"])
      } | order(client.name asc)`;

  // Fetch all clients for the "New Strategy" dropdown
  const clientsQueryCorrected = acct.type === "admin"
    ? `*[_type == "account" && type == "client"]{_id, name, avatar} | order(name asc)`
    : `*[_type == "account" && type == "client" && $id in teamMembers[]._ref]{_id, name, avatar} | order(name asc)`;

  const { data: campaigns } = await sanityFetch({
    query,
    params: { id: acct._id }
  });

  const { data: clients } = await sanityFetch({
    query: clientsQueryCorrected,
    params: { id: acct._id }
  });

  return (
    <StrategyDeck 
      user={{ name: acct.name || "Strategist", email: acct.email, id: acct._id }}
      campaigns={campaigns as any[]}
      clients={clients as any[]}
    />
  );
}
