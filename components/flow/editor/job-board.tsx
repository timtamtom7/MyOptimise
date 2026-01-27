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
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-display font-medium text-slate-900 dark:text-slate-50 mb-2">
            Hello, {data.user.name.split(" ")[0]}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Ready to create? You have <span className="font-medium text-slate-900 dark:text-slate-50">{data.myBriefs.length} active jobs</span>.
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowPricing(true)}>
            <DollarSign className="w-4 h-4 mr-2" />
            Pricing Menu
        </Button>
      </header>

      {overdueCount > 0 && (
          <Alert variant="destructive" className="mb-8 bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Action Required</AlertTitle>
              <AlertDescription>
                  You have {overdueCount} overdue {overdueCount === 1 ? 'job' : 'jobs'}. 
                  {isPenalized 
                      ? " You cannot claim new jobs until these are submitted." 
                      : " Please submit them as soon as possible to avoid penalties."}
              </AlertDescription>
          </Alert>
      )}

      <PricingDialog open={showPricing} onOpenChange={setShowPricing} />

      <Tabs defaultValue="available" className="w-full">
        <TabsList className="mb-8 bg-transparent p-0 border-b border-slate-200 dark:border-slate-800 w-full justify-start rounded-none h-auto">
          <TabsTrigger 
            value="available"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-0 py-3 mr-8 font-medium text-slate-500 data-[state=active]:text-slate-900 text-base shadow-none transition-none"
          >
            Job Board ({data.availableBriefs.length})
          </TabsTrigger>
          <TabsTrigger 
            value="active"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-0 py-3 mr-8 font-medium text-slate-500 data-[state=active]:text-slate-900 text-base shadow-none transition-none"
          >
            My Active Jobs ({data.myBriefs.length})
          </TabsTrigger>
          <TabsTrigger 
            value="completed"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-0 py-3 font-medium text-slate-500 data-[state=active]:text-slate-900 text-base shadow-none transition-none"
          >
            Completed ({data.completedBriefs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-0">
          {data.availableBriefs.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-slate-500">No new jobs available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
