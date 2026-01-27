"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ClientHeroProps {
  userName: string;
  activeCampaignTitle: string;
  activeCampaignFocus: string;
  nextMilestone: string;
  pendingReviews: number;
  onReviewClick: () => void;
  canWrite: boolean;
  submitAction: (formData: FormData) => Promise<void>;
  account?: any;
}

export function ClientHero({
  userName,
  activeCampaignTitle,
  activeCampaignFocus,
  nextMilestone,
  pendingReviews,
  onReviewClick,
  canWrite,
  submitAction,
  account,
}: ClientHeroProps) {
  const packageName = account?.serviceScope?.split("-")[0] || "Growth Tier";

  return (
    <Card className="overflow-hidden mb-8 border-none shadow-md">
      <CardContent className="p-0">
        <div className="p-8 bg-secondary/50 relative overflow-hidden">
          {/* Abstract background shape if desired */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Good to see you, {userName}.
                  </h1>
                  {account && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                      {packageName}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-2">
                  {activeCampaignFocus}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-full bg-background/50 backdrop-blur border-border">Overview</Button>
                <Button variant="outline" className="rounded-full bg-background/50 backdrop-blur border-border">Calendar</Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
              <form
                action={submitAction}
                className="flex items-center gap-3 bg-background rounded-xl p-2 shadow-sm border border-input focus-within:ring-2 focus-within:ring-ring"
              >
                <Search className="ml-3 h-5 w-5 text-muted-foreground" />
                <input
                  name="subject"
                  className="flex-1 h-10 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground"
                  placeholder="Describe your request..."
                  required
                  disabled={!canWrite}
                />
                <input
                  type="hidden"
                  name="message"
                  value="Sent via quick submit"
                />
                <Button disabled={!canWrite} className="rounded-lg px-6">
                  Submit
                </Button>
                <input
                  name="attachment"
                  type="file"
                  className="hidden"
                  id="hero-upload"
                />
              </form>

              <div className="space-y-2 text-sm bg-background/60 rounded-xl p-4 border border-border/80">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">Campaign</span>
                  <span className="text-xs text-muted-foreground">
                    Next milestone
                  </span>
                </div>
                <div className="text-sm font-semibold">
                  {activeCampaignTitle}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {nextMilestone}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  onClick={onReviewClick}
                  disabled={pendingReviews === 0}
                >
                  <span>Pending approvals</span>
                  <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5">
                    {pendingReviews}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
