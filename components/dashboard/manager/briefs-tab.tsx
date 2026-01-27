"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Brief } from "@/types/briefs";
import { BriefBuilder } from "./brief-builder";
import { BriefReview } from "./brief-review";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BriefsTabProps {
  briefs: Brief[];
  editors: { id: string; name: string }[];
  createBriefAction: (formData: FormData) => Promise<void>;
  approveBriefAction: (formData: FormData) => Promise<void>;
  rejectBriefAction: (formData: FormData) => Promise<void>;
}

export function BriefsTab({ briefs, editors, createBriefAction, approveBriefAction, rejectBriefAction }: BriefsTabProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(null);

  const withDerivedState = useMemo(() => {
    return briefs.map((brief) => {
      const meta = (brief.metadata || {}) as any;
      const approvalToken = meta?.approvalToken as string | undefined;
      const approvalTokenExpiry = meta?.approvalTokenExpiry as string | undefined;
      const statusHistory = Array.isArray(meta?.statusHistory) ? meta.statusHistory : [];
      const feedbackArray = Array.isArray(meta?.feedback) ? meta.feedback : [];

      let linkState: "none" | "active" | "expired" = "none";
      if (approvalToken && approvalTokenExpiry) {
        const expiry = new Date(approvalTokenExpiry);
        if (!Number.isNaN(expiry.getTime())) {
          const now = new Date();
          linkState = expiry > now ? "active" : "expired";
        }
      }

      let lastClientDecision: { decision: "approved" | "changes_requested"; at: string } | null = null;
      const approvals = statusHistory.filter(
        (h: any) => h.toStatus === "approved" && h.changedAt,
      );
      const changesRequested = statusHistory.filter(
        (h: any) => h.toStatus === "changes_requested" && h.changedAt,
      );
      const lastApproval = approvals.length > 0 ? approvals[approvals.length - 1] : null;
      const lastChange = changesRequested.length > 0 ? changesRequested[changesRequested.length - 1] : null;
      if (lastApproval && (!lastChange || new Date(lastApproval.changedAt) > new Date(lastChange.changedAt))) {
        lastClientDecision = { decision: "approved", at: String(lastApproval.changedAt) };
      } else if (lastChange) {
        lastClientDecision = { decision: "changes_requested", at: String(lastChange.changedAt) };
      }

      const lastFeedback = feedbackArray.length > 0 ? feedbackArray[feedbackArray.length - 1] : null;

      return {
        brief,
        approvalToken,
        approvalTokenExpiry,
        linkState,
        lastClientDecision,
        lastFeedback,
      };
    });
  }, [briefs]);

  const selectedBrief = useMemo(() => {
      return briefs.find(b => b.id === selectedBriefId) || null;
  }, [briefs, selectedBriefId]);

  const pipeline = withDerivedState.reduce(
    (acc, item) => {
      const brief = item.brief;
      acc[brief.status] = [...(acc[brief.status] || []), item];
      return acc;
    },
    {
      draft: [] as typeof withDerivedState,
      assigned: [] as typeof withDerivedState,
      in_review: [] as typeof withDerivedState,
      client_review: [] as typeof withDerivedState,
      approved: [] as typeof withDerivedState,
      scheduled: [] as typeof withDerivedState,
    },
  );

  const stages: {
    key: keyof typeof pipeline;
    label: string;
    accent: "default" | "secondary" | "outline";
  }[] = [
    { key: "draft", label: "Draft", accent: "outline" },
    { key: "assigned", label: "Assigned", accent: "default" },
    { key: "in_review", label: "Internal review", accent: "secondary" },
    { key: "client_review", label: "Client review", accent: "secondary" },
    { key: "approved", label: "Approved", accent: "default" },
    { key: "scheduled", label: "Scheduled", accent: "outline" },
  ];

  const handleApprove = async (briefId: string) => {
      const formData = new FormData();
      formData.append("id", briefId);
      await approveBriefAction(formData);
  };

  const handleReject = async (briefId: string, feedback: string) => {
      const formData = new FormData();
      formData.append("id", briefId);
      formData.append("feedback", feedback);
      await rejectBriefAction(formData);
  };

  if (isCreating) {
    return (
      <BriefBuilder
        editors={editors}
        action={createBriefAction}
        onCancel={() => setIsCreating(false)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Briefs</h2>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Brief
        </Button>
      </div>

      {briefs.length === 0 ? (
        <div className="text-center py-10 border rounded-md">
          <p className="text-muted-foreground">No briefs found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stages.map((stage) => {
            const items = pipeline[stage.key];
            return (
              <Card key={stage.key} className="flex flex-col h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {stage.label}
                    </CardTitle>
                    <Badge variant={stage.accent}>{items.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 flex-1 overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      No briefs in this stage.
                    </p>
                  ) : (
                    items.map((item) => {
                      const brief = item.brief;
                      return (
                      <button
                        key={brief.id}
                        type="button"
                        onClick={() => setSelectedBriefId(brief.id)}
                        className="w-full text-left rounded-md border bg-card px-3 py-2 text-xs hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium line-clamp-1">
                            {brief.title}
                          </span>
                          {brief.price ? (
                            <span className="text-[10px] font-semibold text-green-600">
                              ${brief.price}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] text-muted-foreground line-clamp-1">
                            Assignee:{" "}
                            {editors.find((e) => e.id === brief.assignee_id)?.name ||
                              "Unassigned"}
                          </span>
                          {brief.status === "in_review" && (
                            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500" />
                          )}
                        </div>
                        {stage.key === "client_review" && (
                          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>
                              {item.linkState === "active"
                                ? "Client link active"
                                : item.linkState === "expired"
                                  ? "Client link expired"
                                  : "No client link yet"}
                            </span>
                            {item.approvalToken && (
                              <span>
                                Link: /approval/{item.approvalToken}
                              </span>
                            )}
                          </div>
                        )}
                        {item.lastClientDecision && (
                          <div className="mt-1 text-[10px] text-muted-foreground">
                            Last client decision:{" "}
                            {item.lastClientDecision.decision === "approved" ? "Approved" : "Changes requested"} on{" "}
                            {new Date(item.lastClientDecision.at).toLocaleDateString()}
                          </div>
                        )}
                        {item.lastFeedback && (
                          <div className="mt-1 text-[10px] text-muted-foreground line-clamp-2">
                            Latest client feedback:{" "}
                            {String(item.lastFeedback.content || "").trim() || "Feedback provided"}
                          </div>
                        )}
                      </button>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <BriefReview 
          brief={selectedBrief}
          isOpen={!!selectedBrief}
          onClose={() => setSelectedBriefId(null)}
          onApprove={handleApprove}
          onReject={handleReject}
      />
    </div>
  );
}
