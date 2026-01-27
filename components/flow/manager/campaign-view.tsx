"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, CheckCircle, Clock, FileText, AlertCircle, Share2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { NewBriefDialog } from "./new-brief-dialog";
import { CampaignStrategyTab } from "./campaign-strategy-tab";
import { AssignEditorDialog } from "./assign-editor-dialog";
import { useRouter } from "next/navigation";

interface Deliverable {
  _id: string;
  title: string;
  status: string;
  type: string;
  platform: string;
  dueDate?: string;
  assignedTo?: { name: string; avatar?: any };
  versionHistory?: any[];
  approvalToken?: string;
}

interface CampaignViewProps {
  campaign: {
    _id: string;
    title: string;
    client: { name: string };
    deliverables: Deliverable[];
    strategyDeck?: any;
  };
  actions: {
    updateStatus: (formData: FormData) => Promise<any>;
    generateApproval: (formData: FormData) => Promise<any>;
  };
  user: any;
}

export function CampaignView({ campaign, actions, user }: CampaignViewProps) {
  const [activeTab, setActiveTab] = useState("briefs");
  const router = useRouter();

  const deliverables = campaign.deliverables || [];
  const reviewItems = deliverables.filter(d => d.status === "internal_review");
  const draftingItems = deliverables.filter(d => d.status === "drafting" || d.status === "assigned" || d.status === "changes_requested");
  const clientItems = deliverables.filter(d => d.status === "client_review");
  const approvedItems = deliverables.filter(d => d.status === "approved" || d.status === "scheduled");

  return (
    <div className="w-full px-6 py-8">
      {/* Header */}
      <header className="mb-8">
        <Link href="/flow/manager" className="text-sm text-slate-500 hover:text-slate-800 flex items-center mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Deck
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-display font-medium text-slate-900 dark:text-slate-50">
              {campaign.client.name}
            </h1>
            <p className="text-slate-500">{campaign.title}</p>
          </div>
          <NewBriefDialog campaignId={campaign._id} strategyDeck={campaign.strategyDeck} />
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-transparent border-b border-slate-200 dark:border-slate-800 w-full justify-start rounded-none h-auto p-0">
          <TabTrigger value="briefs" label="All Briefs" count={campaign.deliverables.length} />
          <TabTrigger value="review" label="Needs Review" count={reviewItems.length} highlight={reviewItems.length > 0} />
          <TabTrigger value="client" label="Client Approval" count={clientItems.length} />
          <TabTrigger value="strategy" label="Strategy" />
        </TabsList>

        <TabsContent value="briefs" className="space-y-8 max-w-6xl mx-auto">
          {/* Status Groups */}
          <StatusSection title="In Production" items={draftingItems} />
          <StatusSection title="Internal Review" items={reviewItems} />
          <StatusSection title="With Client" items={clientItems} />
          <StatusSection title="Approved" items={approvedItems} />
      </TabsContent>

      <TabsContent value="review" className="max-w-6xl mx-auto">
          {reviewItems.length === 0 ? (
              <EmptyState message="No items waiting for internal review." />
          ) : (
              <div className="grid gap-6">
                  {reviewItems.map(item => (
                      <ReviewCard key={item._id} item={item} />
                  ))}
              </div>
          )}
      </TabsContent>

       <TabsContent value="client" className="max-w-6xl mx-auto">
           <div className="grid gap-6">
              {clientItems.map(item => (
                  <ClientReviewCard key={item._id} item={item} />
              ))}
              {clientItems.length === 0 && <EmptyState message="No items currently with client." />}
           </div>
       </TabsContent>

      <TabsContent value="strategy">
          <CampaignStrategyTab campaign={campaign} user={user} />
      </TabsContent>
      </Tabs>
    </div>
  );
}

function TabTrigger({ value, label, count, highlight }: { value: string, label: string, count?: number, highlight?: boolean }) {
    return (
        <TabsTrigger 
            value={value}
            className={cn(
                "rounded-none border-b-2 border-transparent px-4 py-3 font-medium text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 transition-colors",
                highlight && "text-amber-600 data-[state=active]:border-amber-600 data-[state=active]:text-amber-700"
            )}
        >
            {label}
            {count !== undefined && (
                <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 hover:bg-slate-200">
                    {count}
                </Badge>
            )}
        </TabsTrigger>
    )
}

function StatusSection({ title, items }: { title: string, items: Deliverable[] }) {
    if (items.length === 0) return null;
    return (
        <section>
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">{title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => (
                    <BriefCard key={item._id} item={item} />
                ))}
            </div>
        </section>
    )
}

function BriefCard({ item }: { item: Deliverable }) {
    const router = useRouter();
    return (
        <div className="block group relative">
            <Link href={`/flow/manager/brief/${item._id}`} className="block h-full">
                <Card className="h-full hover:shadow-md transition-all duration-200 border-slate-200">
                    <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start">
                            <Badge variant="outline" className="text-xs font-normal text-slate-500 border-slate-200">
                                {item.platform} / {item.type}
                            </Badge>
                            {item.status === "internal_review" && (
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                            )}
                        </div>
                        <h4 className="font-medium text-slate-900 mt-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {item.title}
                        </h4>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="flex justify-between items-center text-xs text-slate-500 mt-4">
                            <div className="flex items-center" onClick={(e) => e.preventDefault()}>
                                <AssignEditorDialog 
                                    deliverableId={item._id} 
                                    currentAssignee={item.assignedTo}
                                    onAssignSuccess={() => router.refresh()}
                                />
                            </div>
                            {item.dueDate && (
                                <span className={cn(
                                    "flex items-center",
                                    new Date(item.dueDate) < new Date() ? "text-red-500" : ""
                                )}>
                                    {format(new Date(item.dueDate), "MMM d")}
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>
    )
}

function ReviewCard({ item }: { item: Deliverable }) {
    if (!item) return null;
    return (
        <Card className="border-l-4 border-l-amber-400">
             <CardContent className="p-6 flex justify-between items-center">
                <div>
                    <h4 className="font-medium text-lg text-slate-900 mb-1">{item.title || "Untitled"}</h4>
                    <p className="text-sm text-slate-500">Submitted by {item.assignedTo?.name || "Unknown"}</p>
                </div>
                <Link href={`/flow/manager/brief/${item._id}`} className={buttonVariants({ variant: "outline" })}>
                     Review Now
                </Link>
             </CardContent>
        </Card>
    )
}

function ClientReviewCard({ item }: { item: Deliverable }) {
    if (!item) return null;
     return (
        <Card className="border-l-4 border-l-blue-400">
             <CardContent className="p-6 flex justify-between items-center">
                <div>
                    <h4 className="font-medium text-lg text-slate-900 mb-1">{item.title || "Untitled"}</h4>
                    <p className="text-sm text-slate-500">Waiting for Client Approval</p>
                </div>
                <Button variant="ghost" size="sm" className="text-slate-400">
                     <Share2 className="w-4 h-4 mr-2" /> Resend Link
                </Button>
             </CardContent>
        </Card>
    )
}


function EmptyState({ message }: { message: string }) {
    return (
        <div className="py-12 text-center border border-dashed border-slate-200 rounded-lg">
            <p className="text-slate-500">{message}</p>
        </div>
    )
}
