"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreatePostDialog } from "./create-post-dialog";
import { PostPreviewDialog } from "./post-preview-dialog";
import { StrategyReviewSection } from "@/components/flow/client/strategy-review-section";
import Link from "next/link";
import {
  FileText,
  CheckSquare,
  Activity,
  AlertCircle,
  Plus,
  Zap,
  Sparkles,
  ArrowRight,
  Target,
  BarChart3,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface ClientViewProps {
  data: {
    user: { name: string; email: string; id?: string; timezone?: string; avatar?: string };
    account?: any; // Full account object
    myRequests: any[];
    supportStaff: any[];
    myThreads: any[];
    clientWorkItems: any[];
    clientServices: any[];
    myServiceRequests: any[];
    myDeliverables: any[];
    activeCampaign?: any;
    calendarEvents?: any[];
    contentItems?: any[];
    socialConnections?: any[];
    analytics?: any[];
  };
  actions: {
    submitClientRequest: (formData: FormData) => Promise<void>;
  };
  capabilities: {
    canWrite: boolean;
    canViewServices: boolean;
    canManageConnections?: boolean;
  };
}

export function ClientView({ data, actions, capabilities }: ClientViewProps) {
  const router = useRouter();
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createPostDate, setCreatePostDate] = useState<Date | undefined>(undefined);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState<any | null>(null);

  const handleCreatePost = () => {
    setCreatePostDate(undefined);
    setCreatePostOpen(true);
  };

  const handlePostClick = (post: any) => {
    setPreviewPost(post);
    setPreviewOpen(true);
  };

  // Calculate stats
  const activeRequests = data.myRequests.filter(r => r.status !== 'completed' && r.status !== 'closed').length;
  const pendingReviews = data.myDeliverables.filter(d => d.status === 'client_review').length;
  const activeCampaignTitle = data.activeCampaign?.title || "No Active Campaign";
  const activeCampaignFocus = data.activeCampaign?.description || "We are currently setting up your next campaign strategy.";
  const nextMilestone = data.activeCampaign?.endDate ? new Date(data.activeCampaign.endDate).toLocaleDateString() : "TBD";
  const packageName = data.account?.serviceScope?.split("-")[0] || "Growth Tier";

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-thin tracking-tighter text-foreground">
            Portal<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-2 font-light">
            Welcome back, {data.user.name}.
          </p>
        </div>
        
        <div className="flex gap-3">
             <Button onClick={handleCreatePost} className="rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-105 active:scale-95">
                <Plus className="mr-2 h-4 w-4" />
                New Request
            </Button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Primary Focus: Active Campaign (Hero Card) */}
        <div className="col-span-1 md:col-span-8 relative overflow-hidden rounded-[2rem] p-8 md:p-12 min-h-[350px] bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl transition-all hover:scale-[1.01] duration-500 group">
             {/* Abstract Background Decoration */}
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/20 to-sky-500/20 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
             
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-full bg-blue-500/20 text-blue-500 backdrop-blur-md">
                            <Target className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-medium tracking-widest uppercase text-blue-500/80">Current Focus</span>
                        <Badge variant="outline" className="ml-auto border-blue-500/20 text-blue-500 bg-blue-500/10">{packageName}</Badge>
                    </div>
                    
                    <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-4 leading-tight">
                        {activeCampaignTitle}
                    </h2>
                    <p className="text-muted-foreground max-w-2xl text-lg font-light leading-relaxed">
                        {activeCampaignFocus}
                    </p>
                </div>

                <div className="mt-8 flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Next Milestone</span>
                        <span className="text-xl font-light">{nextMilestone}</span>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <Button variant="ghost" className="group/btn pl-0 hover:bg-transparent hover:text-blue-500 text-lg font-light">
                        View Strategy <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                </div>
             </div>
        </div>

        {/* Secondary: Actions & Status (Vertical Stack) */}
        <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
            
            {/* Pending Approvals Card */}
            <div className="flex-1 rounded-[2rem] p-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-colors relative overflow-hidden group cursor-pointer" onClick={() => router.push('/dashboard/approvals')}>
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-sky-300 opacity-50" />
                 <div className="flex justify-between items-start mb-4">
                    <FileText className="h-6 w-6 text-sky-500" />
                    {pendingReviews > 0 && <Badge variant="destructive" className="animate-pulse">Action Required</Badge>}
                 </div>
                 <div className="text-4xl font-light tracking-tighter mb-1">{pendingReviews}</div>
                 <div className="text-sm text-muted-foreground">Pending Approvals</div>
                 <div className="mt-4 flex items-center text-xs text-sky-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Review Now <ArrowRight className="ml-1 h-3 w-3" />
                 </div>
            </div>

            {/* Active Requests Card */}
            <div className="flex-1 rounded-[2rem] p-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-colors relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-300 opacity-50" />
                 <div className="flex justify-between items-start mb-4">
                    <Zap className="h-6 w-6 text-blue-500" />
                 </div>
                 <div className="text-4xl font-light tracking-tighter mb-1">{activeRequests}</div>
                 <div className="text-sm text-muted-foreground">Active Requests</div>
            </div>
        </div>

        {/* Row 2: Strategy Review & Stats */}
        <div className="col-span-1 md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Strategy Review Module */}
            <div className="rounded-[2rem] p-8 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/10">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-light flex items-center gap-2">
                        <CheckSquare className="h-5 w-5 text-blue-500" />
                        Strategy Review
                    </h3>
                </div>
                <StrategyReviewSection 
                    campaigns={data.activeCampaign ? [data.activeCampaign] : []}
                    deliverables={data.myDeliverables}
                />
            </div>

            {/* Performance Stats */}
            <div className="rounded-[2rem] p-8 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col">
                <h3 className="text-xl font-light mb-8 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Performance Overview
                </h3>
                
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                    <Sparkles className="h-8 w-8 mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Performance metrics will appear here once campaign data is available.</p>
                </div>
            </div>

        </div>
      </div>

      <CreatePostDialog 
        open={createPostOpen} 
        onOpenChange={setCreatePostOpen} 
        defaultDate={createPostDate}
        clientId={data.account?._id}
      />
      
      <PostPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        post={previewPost}
        canWrite={capabilities.canWrite}
      />
    </div>
  );
}
