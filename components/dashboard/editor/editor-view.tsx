"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, Briefcase, DollarSign, TrendingUp } from "lucide-react";
import { JobBoard } from "./job-board";
import { JobDetail } from "./job-detail";
import { Brief } from "@/types/briefs";

interface EditorViewProps {
  data: {
    user: { name: string; email: string; id?: string };
    assignedBriefs: Brief[];
    completedBriefs: Brief[];
    // Financial data if needed
  };
  actions: {
    submitDeliverable: (formData: FormData) => Promise<void>;
    updateBriefStatus: (formData: FormData) => Promise<void>;
    createUploadUrl: (path: string) => Promise<{ signedUrl: string; token: string; path: string } | null>;
    claimDeliverable: (formData: FormData) => Promise<void>;
  };
}

export function EditorView({ data, actions }: EditorViewProps) {
  const [activeTab, setActiveTab] = useState("open-jobs");
  const [selectedBrief, setSelectedBrief] = useState<Brief | null>(null);

  const completedPaidBriefs = data.completedBriefs.filter(
    (brief) => brief.status === "approved" && typeof brief.price === "number"
  );

  const totalEarned = completedPaidBriefs.reduce(
    (sum, brief) => sum + (brief.price || 0),
    0
  );

  const jobsCompleted = completedPaidBriefs.length;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthEarned = completedPaidBriefs.reduce((sum, brief) => {
    const referenceDate = brief.updated_at || brief.created_at;
    if (!referenceDate) return sum;
    const date = new Date(referenceDate);
    if (date >= monthStart) {
      return sum + (brief.price || 0);
    }
    return sum;
  }, 0);

  const averagePerJob = jobsCompleted > 0 ? totalEarned / jobsCompleted : 0;

  const handleOpenBrief = (brief: Brief) => {
    setSelectedBrief(brief);
  };

  const handleStatusUpdate = async (briefId: string, status: string) => {
    const formData = new FormData();
    formData.append("id", briefId);
    formData.append("status", status);
    await actions.updateBriefStatus(formData);
  };

  const handleUpload = async (briefId: string, videoUrl: string) => {
    const formData = new FormData();
    formData.append("id", briefId);
    formData.append("url", videoUrl);
    await actions.submitDeliverable(formData);
  };

  const handleClaim = async (briefId: string) => {
    const formData = new FormData();
    formData.append("id", briefId);
    await actions.claimDeliverable(formData);
  };

  return (
    <div className="space-y-6">
      <JobDetail 
        brief={selectedBrief} 
        isOpen={!!selectedBrief} 
        onClose={() => setSelectedBrief(null)} 
        onStatusUpdate={handleStatusUpdate}
        onUpload={handleUpload}
        createUploadUrl={actions.createUploadUrl}
        onClaim={handleClaim}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Editor Workspace</h1>
        <div className="flex gap-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                 {/* Replicating the Dropdown Menu pattern from Admin/Client view */}
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-between">
                      {activeTab === "open-jobs" && "Open Jobs"}
                      {activeTab === "completed" && "Completed Work"}
                      {activeTab === "earnings" && "My Earnings"}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[200px]">
                    <DropdownMenuItem onSelect={() => setActiveTab("open-jobs")}>
                      <Briefcase className="mr-2 h-4 w-4" />
                      Open Jobs
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActiveTab("completed")}>
                      <Briefcase className="mr-2 h-4 w-4" />
                      Completed Work
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActiveTab("earnings")}>
                      <DollarSign className="mr-2 h-4 w-4" />
                      My Earnings
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </Tabs>
        </div>
      </div>

      {/* Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="open-jobs" className="space-y-4">
            <JobBoard briefs={data.assignedBriefs} type="open" onOpenBrief={handleOpenBrief} />
        </TabsContent>
        <TabsContent value="completed" className="space-y-4">
             <JobBoard briefs={data.completedBriefs} type="completed" onOpenBrief={handleOpenBrief} />
        </TabsContent>
         <TabsContent value="earnings" className="space-y-4">
             <div>
               <h2 className="text-xl font-semibold mb-2">My earnings</h2>
               <p className="text-sm text-muted-foreground">
                 Based on approved jobs in this workspace.
               </p>
             </div>

             <div className="grid gap-4 md:grid-cols-3">
               <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-medium">Total earned</CardTitle>
                   <DollarSign className="h-4 w-4 text-muted-foreground" />
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">
                     ${totalEarned.toFixed(0)}
                   </div>
                   <p className="text-xs text-muted-foreground">
                     Across all approved jobs.
                   </p>
                 </CardContent>
               </Card>

               <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-medium">Jobs completed</CardTitle>
                   <Briefcase className="h-4 w-4 text-muted-foreground" />
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">
                     {jobsCompleted}
                   </div>
                   <p className="text-xs text-muted-foreground">
                     Approved and ready for payout.
                   </p>
                 </CardContent>
               </Card>

               <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-medium">This month</CardTitle>
                   <TrendingUp className="h-4 w-4 text-muted-foreground" />
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">
                     ${thisMonthEarned.toFixed(0)}
                   </div>
                   <p className="text-xs text-muted-foreground">
                     Approved since the start of this month.
                   </p>
                 </CardContent>
               </Card>
             </div>

             {jobsCompleted === 0 && (
               <p className="text-sm text-muted-foreground">
                 Once you have approved jobs, you&apos;ll see earnings here.
               </p>
             )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
