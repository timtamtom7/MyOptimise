"use client";

import React, { useState } from "react";
import { Brief } from "@/types/briefs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JobCard } from "./job-card";
import { Button } from "@/components/ui/button";
import { DollarSign, AlertTriangle } from "lucide-react";
import { PricingDialog } from "./pricing-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface JobBoardProps {
  data: {
    user: { name: string; email: string; id: string };
    availableBriefs: Brief[];
    myBriefs: Brief[];
    completedBriefs: Brief[];
  };
  actions: {
    submitDeliverable: (formData: FormData) => Promise<any>;
    updateBriefStatus: (formData: FormData) => Promise<any>;
    claimDeliverable: (formData: FormData) => Promise<any>;
  };
}

export function JobBoard({ data, actions }: JobBoardProps) {
  const [showPricing, setShowPricing] = useState(false);

  // Penalty Calculation: Blocks new claims if 2+ jobs are overdue
  const overdueCount = data.myBriefs.filter(brief => {
    if (!brief.deadline) return false;
    return new Date(brief.deadline).getTime() < new Date().getTime();
  }).length;

  const isPenalized = overdueCount >= 2;

  return (
    <div className="container max-w-6xl mx-auto py-16 px-6">
      <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-display font-medium text-foreground mb-3 tracking-tight">
            Hello, {data.user.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground text-lg font-sans max-w-md leading-relaxed">
            You have <span className="text-foreground font-medium">{data.myBriefs.length} active jobs</span> in your production pipeline.
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowPricing(true)} className="rounded-full border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all font-medium px-6">
          <DollarSign className="w-4 h-4 mr-2 text-slate-400" />
          Pricing Menu
        </Button>
      </header>

      {overdueCount > 0 && (
        <Alert variant="destructive" className="mb-12 bg-red-50/50 border-red-100 text-red-900 rounded-2xl dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-display text-lg">Attention Required</AlertTitle>
          <AlertDescription className="text-sm opacity-90 leading-relaxed">
            You have {overdueCount} overdue {overdueCount === 1 ? 'job' : 'jobs'}.
            {isPenalized
              ? " You cannot claim new jobs until these are submitted."
              : " Please submit them to maintain your performance status."}
          </AlertDescription>
        </Alert>
      )}

      <PricingDialog open={showPricing} onOpenChange={setShowPricing} />

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="mb-12 bg-transparent p-0 border-b border-slate-100 dark:border-slate-900 w-full justify-start rounded-none h-auto gap-10">
          <TabsTrigger
            value="available"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 py-4 font-medium text-muted-foreground data-[state=active]:text-foreground text-sm uppercase tracking-[0.15em] shadow-none transition-all"
          >
            Dashboard ({data.availableBriefs.length})
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 py-4 font-medium text-muted-foreground data-[state=active]:text-foreground text-sm uppercase tracking-[0.15em] shadow-none transition-all"
          >
            In Production ({data.myBriefs.length})
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-0 py-4 font-medium text-muted-foreground data-[state=active]:text-foreground text-sm uppercase tracking-[0.15em] shadow-none transition-all"
          >
            History ({data.completedBriefs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-0 outline-none">
          {data.availableBriefs.length === 0 ? (
            <div className="text-center py-24 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-muted-foreground font-display text-xl italic">The board is clear. Check back later for new opportunities.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.availableBriefs.map((brief) => (
                <JobCard
                  key={brief.id}
                  brief={brief}
                  status="available"
                  onClaim={isPenalized ? undefined : actions.claimDeliverable}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          {data.myBriefs.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-slate-500">You haven&apos;t claimed any jobs yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.myBriefs.map((brief) => (
                <JobCard
                  key={brief.id}
                  brief={brief}
                  status="active"
                  onSubmit={actions.submitDeliverable}
                  onStatusUpdate={actions.updateBriefStatus}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.completedBriefs.map((brief) => (
              <JobCard
                key={brief.id}
                brief={brief}
                status="completed"
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
