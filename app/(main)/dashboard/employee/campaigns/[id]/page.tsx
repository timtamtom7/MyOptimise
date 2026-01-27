import { sanityFetch } from "@/sanity/lib/live";
import { safeGetServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeliverablesTab } from "@/components/dashboard/employee/deliverables-tab";
import Link from "next/link";
import { ChevronLeft, Calendar, Target, Activity } from "lucide-react";
import { formatDate } from "@/lib/date-formatting";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  const { data } = await sanityFetch({
    query: `{
      "campaign": *[_type == "campaign" && _id == $id][0]{
        ...,
        "client": client->{_id, name, businessName, brandAssets}
      },
      "deliverables": *[_type == "deliverable" && campaign._ref == $id] | order(dueDate asc){
        _id, title, status, type, dueDate, "campaignTitle": campaign->title,
        assignedTo->{name, avatar}
      }
    }`,
    params: { id },
  });

  if (!data?.campaign) {
    redirect("/dashboard/employee");
  }

  const { campaign, deliverables } = data;
  const client = campaign.client;

  // Mock activeCampaigns array for the dialog, containing just this one
  const activeCampaigns = [campaign];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link 
          href={`/dashboard/employee/clients/${client._id}?tab=campaigns`}
          className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to {client.businessName || client.name}
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{campaign.title}</h1>
            <p className="text-muted-foreground">{campaign.description}</p>
          </div>
          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'} className="capitalize">
            {campaign.status}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
           <div className="flex items-center gap-2">
             <Calendar className="h-4 w-4" />
             <span>{formatDate(campaign.startDate)} - {campaign.endDate ? formatDate(campaign.endDate) : "Ongoing"}</span>
           </div>
           {campaign.objectives && (
             <div className="flex items-center gap-2">
               <Target className="h-4 w-4" />
               <span className="truncate max-w-xs" title={campaign.objectives}>{campaign.objectives}</span>
             </div>
           )}
           <div className="flex items-center gap-2">
             <Activity className="h-4 w-4" />
             <span>{deliverables.length} Deliverables</span>
           </div>
        </div>
      </div>

      {/* Stats/Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium">Progress</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">
               {Math.round((deliverables.filter((d: any) => d.status === 'approved').length / (deliverables.length || 1)) * 100)}%
             </div>
             <p className="text-xs text-muted-foreground">Completion Rate</p>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">
               {deliverables.filter((d: any) => d.status === 'client_review' || d.status === 'internal_review').length}
             </div>
             <p className="text-xs text-muted-foreground">Items awaiting approval</p>
           </CardContent>
         </Card>
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium">KPIs</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-sm font-medium">{campaign.kpis || "No KPIs defined"}</p>
           </CardContent>
         </Card>
      </div>

      {/* Deliverables List */}
      <DeliverablesTab 
        clientId={client._id} 
        deliverables={deliverables} 
        activeCampaigns={activeCampaigns} 
        brandAssets={client.brandAssets} 
      />
    </div>
  );
}
