import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { redirect } from "next/navigation";
import { ClientHQView } from "@/components/dashboard/employee/client-hq-view";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function BusinessClientHQPage({ params }: PageProps) {
  const { clientId } = await params;
  const session = await safeGetServerSession();
  if (!session) redirect("/login?next=/dashboard/business");

  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  if (!acct) redirect("/login?error=no_account&next=/dashboard/business");
  if (String(acct.status || "") === "disabled") redirect("/login?error=disabled&next=/dashboard/business");

  const type = String(acct.type || "").toLowerCase();
  if (!["admin", "manager", "employee"].includes(type)) {
    redirect("/dashboard");
  }

  const { data } = await sanityFetch({
    query: `{
      "client": *[_type == "account" && _id == $clientId][0]{
        ...,
        "manager": *[_type == "account" && _id == ^.manager._ref][0]{name, email, avatar}
      },
      "activeCampaigns": *[_type == "campaign" && client._ref == $clientId && status == "active"] | order(endDate asc){
        _id, title, status, endDate, description,
        "deliverableCount": count(*[_type == "deliverable" && campaign._ref == ^._id])
      },
      "recentDeliverables": *[_type == "deliverable" && campaign->client._ref == $clientId] | order(updatedAt desc)[0...5]{
        _id, title, status, type, dueDate, "campaignTitle": campaign->title
      },
      "openTickets": *[_type == "clientRequest" && clientAccount._ref == $clientId && status in ["new", "open", "in_progress"]] | order(_createdAt desc){
        _id, subject, status, priority, _createdAt, category
      },
      "services": *[_type == "clientService" && client._ref == $clientId],
      "calendarSchedule": *[_type == "scheduleItem" && relatedClient._ref == $clientId && visibility == "client"],
      "calendarDeliverables": *[_type == "deliverable" && campaign->client._ref == $clientId && dueDate != null] | order(dueDate asc){
        _id, title, dueDate, status
      },
      "calendarCampaigns": *[_type == "campaign" && client._ref == $clientId && status == "active"]{
        _id, title, startDate, endDate, status
      }
    }`,
    params: { clientId },
  });

  if (!data?.client) {
    redirect("/dashboard/business");
  }

  return <ClientHQView data={data} />;
}

