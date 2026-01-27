import { sanityFetch } from "@/sanity/lib/live";
import { safeGetServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ClientHQView } from "@/components/dashboard/employee/client-hq-view";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientHQPage({ params }: PageProps) {
  const { clientId } = await params;
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  // Fetch all necessary data in one go
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
      "recentDeliverables": *[_type == "deliverable" && campaign->client._ref == $clientId] | order(updatedAt desc)[0...50]{
        _id, title, status, type, dueDate, "campaignTitle": campaign->title,
        assignedTo->{name, avatar}
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
    redirect("/dashboard/employee/clients");
  }

  return <ClientHQView data={data} />;
}
