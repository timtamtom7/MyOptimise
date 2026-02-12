import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { redirect } from "next/navigation";
import { ClientCalendar } from "@/components/dashboard/client/client-calendar";
import { hasAccountCapability } from "@/lib/capabilities";

export const dynamic = "force-dynamic";

export default async function ClientCalendarPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  const email = String((session as any)?.user?.email || "");
  const acct = await fetchSanityAccountByEmail({ email });
  
  if (!acct || acct.status === "disabled" || acct.type !== "client") {
    redirect("/dashboard");
  }

  const acctId = String(acct._id);
  const canWrite = Boolean(process.env.SANITY_API_WRITE_TOKEN);

  const [
    activeCampaignRes,
    myDeliverablesRes,
    contentItemsRes
  ] = await Promise.all([
    sanityFetch({
      query: `*[_type == "campaign" && client._ref == $acctId && status in ["active", "planned"]] | order(startDate asc){
          _id, title, description, startDate, endDate, status
        }`,
      params: { acctId },
    }),
    sanityFetch({
      query: `*[_type == "deliverable" && campaign->client._ref == $acctId] | order(createdAt desc) {
          _id, title, status, dueDate, createdAt, "campaignTitle": campaign->title
        }`,
      params: { acctId },
    }),
    sanityFetch({
      query: `*[_type == "contentItem" && client._ref == $acctId]{
          _id, title, scheduledAt, status, platform, postType
        }`,
      params: { acctId },
    })
  ]);

  const campaigns = ((activeCampaignRes as any)?.data ?? []) as any[];
  const myDeliverables = ((myDeliverablesRes as any)?.data ?? []) as any[];
  const contentItems = ((contentItemsRes as any)?.data ?? []) as any[];

  // Prepare calendar events
  const calendarEvents: any[] = [
    ...campaigns.map((c: any) => ({
      id: c._id,
      title: c.title,
      date: c.startDate || new Date().toISOString(),
      endDate: c.endDate,
      type: "campaign",
      status: c.status,
      description: c.description
    })),
    ...myDeliverables.map((d: any) => ({
      id: d._id,
      title: d.title,
      date: d.dueDate || d.createdAt,
      type: "deliverable",
      status: d.status,
      description: d.campaignTitle
    })).filter((e: any) => e.date),
    ...contentItems.map((c: any) => ({
      id: c._id,
      title: c.title,
      date: c.scheduledAt || new Date().toISOString(),
      type: "content",
      status: c.status,
      description: c.platform,
      platform: c.platform,
      postType: c.postType,
    })).filter((e: any) => e.date)
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">Schedule of campaigns, content, and deliverables.</p>
        </div>
      </div>
      <ClientCalendar 
        events={calendarEvents} 
        onDateClick={() => {}} // Server component, interactivity handled in client component if needed
        canWrite={canWrite}
      />
    </div>
  );
}
