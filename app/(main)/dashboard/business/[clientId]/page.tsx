import { safeGetServerSession } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { redirect } from "next/navigation";
import { ClientView } from "@/components/dashboard/client/client-view";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Lock, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientDetailView({ params }: PageProps) {
  const { clientId } = await params;
  const session = await safeGetServerSession();
  if (!session) redirect("/login?next=/dashboard/business");

  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  if (!acct) redirect("/login?error=no_account&next=/dashboard/business");
  
  // Allow admins, managers, and employees to view
  const type = String(acct.type || "");
  if (!["admin", "manager", "employee"].includes(type)) {
    redirect("/dashboard");
  }

  // Fetch target client
  const targetClientRes = await sanityFetch({
    query: `*[_type == "account" && _id == $id][0]{_id, name, email, type, status, notes}`,
    params: { id: clientId }
  });
  const targetClient = (targetClientRes as any)?.data;

  if (!targetClient || targetClient.type !== 'client') {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/business">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to HQ
                    </Link>
                </Button>
            </div>
            <div className="p-8 text-center text-muted-foreground">
                Client not found or invalid.
            </div>
        </div>
    );
  }

  // Fetch Client Data (Read-Only View)
  // Reusing queries from ClientDashboardPage but targeting clientId
  const [
    myRequestsRes,
    supportStaffRes,
    myThreadsRes,
    clientWorkItemsRes,
    clientServicesRes,
    myServiceRequestsRes,
    myDeliverablesRes,
    activeCampaignRes,
  ] = await Promise.all([
    sanityFetch({
      query: `*[_type == "clientRequest" && clientAccount._ref == $id] | order(createdAt desc)[0..9]{
        _id, subject, status, createdAt, response, category, priority,
        statusHistory[]{fromStatus, toStatus, changedAt},
        messages[visibility == "client"]{
          message, createdAt, visibility,
          author->{name, email},
          attachments[]{asset->{url, originalFilename}}
        }
      }`,
      params: { id: clientId },
    }),
    sanityFetch({
      query: `*[_type == "account" && status != "disabled" && type in ["admin","manager"]] | order(type asc, name asc, email asc){
        _id, name, email, type
      }`,
    }),
    sanityFetch({
      query: `*[_type == "messageThread" && visibility == "client" && $id in participants[]._ref] | order(coalesce(updatedAt, createdAt) desc)[0..9]{
        _id, title, type, visibility, createdAt, updatedAt,
        "readStates": readStates[]{user, lastReadAt},
        "messageCount": count(messages[visibility == "client"]),
        "recentMessages": messages[visibility == "client"][-3..-1]{message, createdAt, author->{name, email}, attachments[]{asset->{url, originalFilename}}},
        "lastMessage": messages[visibility == "client"][-1]{message, createdAt, author->{name, email}, attachments[]{asset->{url, originalFilename}}},
        "participants": participants[]->{_id, name, email, type}
      }`,
      params: { id: clientId },
    }),
    sanityFetch({
      query: `*[_type == "workItem" && isTemplate != true && visibility == "client" && clientAccount._ref == $id] | order(coalesce(dueDate, createdAt) asc)[0..19]{
        _id, title, description, status, priority, dueDate, createdAt,
        "commentsCount": count(comments),
        attachments[]{asset->{url, originalFilename}}
      }`,
      params: { id: clientId },
    }),
    sanityFetch({
      query: `*[_type == "clientService" && client._ref == $id] | order(coalesce(updatedAt, createdAt) desc)[0..49]{
        _id, title, serviceType, status, statusNote, clientCanToggle, clientEnabled, createdAt, updatedAt
      }`,
      params: { id: clientId },
    }),
    sanityFetch({
      query: `*[_type == "serviceRequest" && clientAccount._ref == $id] | order(createdAt desc)[0..19]{
        _id, status, requestedServiceType, details, resolutionNote, createdAt, updatedAt,
        attachments[]{asset->{url, originalFilename}}
      }`,
      params: { id: clientId },
    }),
    sanityFetch({
      query: `*[_type == "deliverable" && campaign->client._ref == $id] | order(createdAt desc) {
        _id, title, status, type, dueDate, createdAt,
        "campaignTitle": campaign->title,
        "latestAsset": versionHistory[-1].asset->{url, originalFilename, mimeType, extension}
      }`,
      params: { id: clientId },
    }),
    sanityFetch({
        query: `*[_type == "campaign" && client._ref == $id && status in ["active", "planned"]] | order(startDate asc){
          _id, title, description, startDate, endDate, status
        }`,
        params: { id: clientId },
      }),
  ]);

  const myRequests = ((myRequestsRes as any)?.data ?? []) as any[];
  const supportStaff = ((supportStaffRes as any)?.data ?? []) as any[];
  const myThreads = ((myThreadsRes as any)?.data ?? []) as any[];
  const clientWorkItems = ((clientWorkItemsRes as any)?.data ?? []) as any[];
  const clientServices = ((clientServicesRes as any)?.data ?? []) as any[];
  const myServiceRequests = ((myServiceRequestsRes as any)?.data ?? []) as any[];
  const myDeliverables = ((myDeliverablesRes as any)?.data ?? []) as any[];
  const campaigns = ((activeCampaignRes as any)?.data ?? []) as any[];
  const activeCampaign = campaigns.find((c: any) => c.status === "active") || campaigns[0];

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
     })).filter((e: any) => e.date)
   ];

  // Dummy actions that do nothing in read-only mode
  // Note: approveDeliverable and rejectDeliverable are imported and technically work if the user has permission,
  // but standard employees might not have 'deliverables.approve' permission (usually clients do).
  // We'll pass them but UI will likely hide buttons if canWrite is false.
  const noop = async (fd: FormData) => { "use server"; };

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/dashboard/business">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to HQ
                    </Link>
                </Button>
                <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full text-sm text-muted-foreground border">
                    <Lock className="h-3 w-3" />
                    <span>Viewing as {targetClient.name} (Read-Only)</span>
                </div>
            </div>
        </div>

        {targetClient.notes && (
            <Card className="mb-8 border-yellow-200 bg-yellow-50">
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-yellow-900">Internal Notes</CardTitle>
                    <FileText className="h-4 w-4 ml-auto text-yellow-700" />
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-yellow-800 whitespace-pre-wrap">{targetClient.notes}</p>
                </CardContent>
            </Card>
        )}

      <ClientView
        data={{
          user: { name: targetClient.name, email: targetClient.email },
          myRequests,
          supportStaff,
          myThreads,
          clientWorkItems,
          clientServices,
          myServiceRequests,
          myDeliverables,
          activeCampaign,
          calendarEvents,
        }}
        actions={{
          submitClientRequest: noop,
          addClientRequestMessage: noop,
          createOrOpenSupportThread: noop,
          setClientServiceEnabled: noop,
          submitServiceRequest: noop,
          approveDeliverable: noop, // Or pass real actions if employees can approve on behalf?
          rejectDeliverable: noop,
        }}
        capabilities={{
          canWrite: false, // Enforce read-only UI
          canViewServices: true,
        }}
      />
    </div>
  );
}
