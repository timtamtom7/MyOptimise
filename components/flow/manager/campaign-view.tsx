"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { NewBriefDialog } from "./new-brief-dialog";
import { CampaignPlanTab } from "./campaign-plan-tab";
import { CampaignSlidesTab } from "./campaign-slides-tab";
import { CampaignAssetsTab } from "./campaign-assets-tab";
import { CampaignContextTab } from "./campaign-context-tab";
import { CampaignProvider, useCampaignContext } from "./campaign-provider";
import { BriefingBoard, Deliverable } from "./briefing-board";
import { ReviewQueue, ClientQueue } from "./review-queue";

interface CampaignViewProps {
  campaign: {
    _id: string;
    title: string;
    client: { 
      name: string;
      brandAssets?: any[];
      industry?: string;
      audience?: string;
      creativeGoal?: string;
      brandVoice?: string;
      [key: string]: any; 
    };
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

  const deliverables = campaign.deliverables || [];
  const reviewItems = deliverables.filter(d => d.status === "internal_review");
  const clientItems = deliverables.filter(d => d.status === "client_review");

  return (
    <CampaignProvider campaign={campaign} user={user}>
      <div className="w-full px-6 py-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="mb-12">
        <Link href="/dashboard/manager" className="text-sm text-slate-500 hover:text-slate-800 flex items-center mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-display font-medium text-slate-900 dark:text-slate-50 mb-2">
              {campaign.client.name}
            </h1>
            <p className="text-lg text-slate-500 font-light">{campaign.title}</p>
          </div>
          <div className="flex items-center gap-4">
            <SaveStatus />
            <StrategyHistoryDialog campaignId={campaign._id} history={campaign.strategyDeck?.history || []} />
            <NewBriefDialog campaignId={campaign._id} strategyDeck={campaign.strategyDeck} />
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-transparent w-full justify-start rounded-none h-auto p-0 border-b border-slate-200 dark:border-slate-800 space-x-8">
          <TabTrigger value="research" label="Research" />
          <TabTrigger value="plan" label="Plan" />
          <TabTrigger value="slides" label="Slides" />
          <TabTrigger value="assets" label="Assets" />
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-4" />
          <TabTrigger value="briefs" label="Briefs" count={campaign.deliverables.length} />
          <TabTrigger value="review" label="Review" count={reviewItems.length} highlight={reviewItems.length > 0} />
          <TabTrigger value="client" label="Approvals" count={clientItems.length} />
        </TabsList>

        <TabsContent value="research" className="max-w-5xl mx-auto pt-4">
          <CampaignContextTab campaign={campaign} user={user} />
        </TabsContent>

        <TabsContent value="assets" className="max-w-6xl mx-auto pt-4">
          <CampaignAssetsTab campaign={campaign} user={user} />
        </TabsContent>

        <TabsContent value="plan" className="pt-4">
          <CampaignPlanTab />
        </TabsContent>

        <TabsContent value="slides" className="pt-4">
          <CampaignSlidesTab />
        </TabsContent>

        <TabsContent value="briefs" className="space-y-8 max-w-6xl mx-auto pt-4">
          <BriefingBoard deliverables={deliverables} />
        </TabsContent>

        <TabsContent value="review" className="max-w-6xl mx-auto pt-4">
          <ReviewQueue deliverables={deliverables} />
        </TabsContent>

        <TabsContent value="client" className="max-w-6xl mx-auto pt-4">
          <ClientQueue deliverables={deliverables} />
        </TabsContent>
      </Tabs>
      </div>
    </CampaignProvider>
  );
}

function TabTrigger({ value, label, count, highlight }: { value: string, label: string, count?: number, highlight?: boolean }) {
  return (
    <TabsTrigger 
      value={value}
      className={cn(
        "rounded-none border-b-2 border-transparent px-2 py-4 font-medium text-slate-500 hover:text-slate-800 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 transition-all text-base bg-transparent shadow-none",
        highlight && "text-amber-600 data-[state=active]:border-amber-600 data-[state=active]:text-amber-700"
      )}
    >
      {label}
      {count !== undefined && (
        <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 hover:bg-slate-200 border-none">
          {count}
        </Badge>
      )}
    </TabsTrigger>
  )
}

function SaveStatus() {
  const { isSaving, hasUnsavedChanges, lastSaved } = useCampaignContext();

  if (isSaving) {
    return (
      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium animate-pulse bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
        <Loader2 className="w-4 h-4 animate-spin" />
        Saving...
      </div>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <div className="flex items-center gap-2 text-amber-600 text-sm font-medium bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full">
        <AlertCircle className="w-4 h-4" />
        Unsaved changes
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full transition-opacity duration-1000" key={lastSaved.getTime()}>
        <CheckCircle className="w-4 h-4" />
        Saved
      </div>
    );
  }

  return null;
}
