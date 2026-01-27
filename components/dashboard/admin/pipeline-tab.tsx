"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, AlertTriangle, Calendar, Clock, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeliverableReviewModal } from "@/components/dashboard/deliverable-review-modal";

interface PipelineTabProps {
  deliverables: any[];
  capabilities: {
    canWrite: boolean;
  };
  actions: {
    updateDeliverableStatus: (formData: FormData) => Promise<void>;
    generateApprovalLink?: (formData: FormData) => Promise<any>;
  };
  onScheduleClick?: (deliverable: any) => void;
}

const COLUMNS = [
  { id: "drafting", title: "Drafting", color: "bg-slate-100" },
  { id: "internal_review", title: "Internal Review", color: "bg-blue-50" },
  { id: "client_review", title: "Client Review", color: "bg-purple-50" },
  { id: "approved", title: "Approved", color: "bg-green-50" },
  { id: "scheduled", title: "Scheduled", color: "bg-emerald-50" },
  { id: "changes_requested", title: "Changes Requested", color: "bg-red-50" },
];

function PipelineSummary({ deliverables }: { deliverables: any[] }) {
  const total = deliverables.length;
  const approved = deliverables.filter((d) => (d.status || "drafting") === "approved").length;
  const scheduled = deliverables.filter((d) => (d.status || "drafting") === "scheduled").length;
  const inReview = deliverables.filter((d) => ["internal_review", "client_review"].includes(d.status || "drafting")).length;
  const drafting = deliverables.filter((d) => (d.status || "drafting") === "drafting").length;
  const changesRequested = deliverables.filter((d) => (d.status || "drafting") === "changes_requested").length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-bold text-slate-700">{drafting}</div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Drafting</div>
        </CardContent>
      </Card>
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-bold text-blue-700">{inReview}</div>
          <div className="text-xs font-medium text-blue-500 uppercase tracking-wider">In Review</div>
        </CardContent>
      </Card>
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-bold text-red-700">{changesRequested}</div>
          <div className="text-xs font-medium text-red-500 uppercase tracking-wider">Changes</div>
        </CardContent>
      </Card>
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-bold text-green-700">{approved}</div>
          <div className="text-xs font-medium text-green-500 uppercase tracking-wider">Approved</div>
        </CardContent>
      </Card>
      <Card className="bg-emerald-50 border-emerald-200">
        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-bold text-emerald-700">{scheduled}</div>
          <div className="text-xs font-medium text-emerald-500 uppercase tracking-wider">Scheduled</div>
        </CardContent>
      </Card>
    </div>
  );
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isDeliverableBriefUnclear(deliverable: any): boolean {
  const typeRaw = deliverable?.type;
  const type = typeof typeRaw === "string" ? typeRaw : "";

  const hook = deliverable?.hook;
  const script = deliverable?.script;
  const visual = deliverable?.visualDirection;
  const creativeGoal = deliverable?.creativeGoal;
  const contentConcept = deliverable?.contentConcept;
  const assets = Array.isArray(deliverable?.assets) ? deliverable.assets : [];

  const missingHook = !hasText(hook);
  const missingScript = !hasText(script);
  const missingVisual = !hasText(visual);
  const missingCreativeGoal = !hasText(creativeGoal);
  const missingContentConcept = !hasText(contentConcept);
  const missingAssets = assets.length === 0;

  const isVideo =
    type === "reel" ||
    type === "video_long" ||
    type.toLowerCase().includes("video");

  if (isVideo) {
    return missingHook || missingScript || missingVisual || missingAssets;
  }

  return missingHook || missingCreativeGoal || missingContentConcept || missingAssets;
}

function getApprovalRecency(deliverable: any): "last7" | "last30" | null {
  const history = Array.isArray(deliverable.statusHistory) ? deliverable.statusHistory : [];
  const approvals = history.filter(
    (h: any) => String(h.toStatus || "") === "approved" && h.changedAt,
  );
  let approvalTimestamp: string | null = null;
  if (approvals.length > 0) {
    const last = approvals[approvals.length - 1];
    approvalTimestamp = String(last.changedAt || "");
  } else {
    const fallback = deliverable._updatedAt || deliverable.createdAt;
    approvalTimestamp = fallback ? String(fallback) : null;
  }
  if (!approvalTimestamp) return null;
  const dt = new Date(approvalTimestamp);
  if (Number.isNaN(dt.getTime())) return null;
  const now = new Date();
  const diffMs = now.getTime() - dt.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 7) return "last7";
  if (diffDays <= 30) return "last30";
  return null;
}

function getApprovalLinkState(deliverable: any): "active" | "expired" | "none" {
  const token = String(deliverable.approvalToken || "");
  const expiryRaw = deliverable.approvalTokenExpiry ? String(deliverable.approvalTokenExpiry) : "";
  if (!token || !expiryRaw) return "none";
  const expiry = new Date(expiryRaw);
  if (Number.isNaN(expiry.getTime())) return "none";
  const now = new Date();
  if (expiry <= now) return "expired";
  return "active";
}

export function PipelineTab({ deliverables, capabilities, actions, onScheduleClick }: PipelineTabProps) {
  const [selectedDeliverable, setSelectedDeliverable] = useState<any>(null);

  return (
    <div className="space-y-4">
      <DeliverableReviewModal 
        deliverable={selectedDeliverable} 
        isOpen={!!selectedDeliverable} 
        onClose={() => setSelectedDeliverable(null)}
        onStatusUpdate={async (id, status, feedback) => {
          const formData = new FormData();
          formData.append("id", id);
          formData.append("status", status);
          if (feedback) formData.append("feedback", feedback);
          await actions.updateDeliverableStatus(formData);
        }}
      />
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Production Pipeline</h2>
        <p className="text-muted-foreground">Track deliverables from strategy to scheduling.</p>
      </div>

      <PipelineSummary deliverables={deliverables} />

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="inline-flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5">
            <AlertTriangle className="h-3 w-3" />
            Incomplete briefs:
            <span className="font-semibold">
              {deliverables.filter((d) => isDeliverableBriefUnclear(d)).length}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-medium">Approved recency:</span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            <span>Approved ≤7 days</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-secondary" />
            <span>Approved ≤30 days</span>
          </span>
        </div>
      </div>

      <div className="h-[calc(100vh-280px)] overflow-x-auto rounded-lg border bg-slate-50/50 p-4">
        <div className="flex gap-4 min-w-max h-full">
          {COLUMNS.map((col) => {
            const items = deliverables.filter((d) => (d.status || "drafting") === col.id);
            const unclearCount = items.filter((d) => isDeliverableBriefUnclear(d)).length;
            return (
              <div key={col.id} className={`w-[320px] flex-shrink-0 flex flex-col gap-4 rounded-lg p-4 ${col.color}`}>
                <div className="font-semibold flex items-center justify-between text-sm">
                  <span>{col.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-white/50">
                      {items.length}
                    </Badge>
                    {unclearCount > 0 && (
                      <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 text-[10px] px-1 h-5">
                        {unclearCount} incomplete
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 custom-scrollbar">
                  {items.map((item) => {
                    const approvalRecency = col.id === "approved" ? getApprovalRecency(item) : null;
                    const linkState = getApprovalLinkState(item);
                    const briefUnclear = isDeliverableBriefUnclear(item);
                    const versionCount = typeof item.versionCount === "number" ? item.versionCount : 0;
                    const latestVersion = item.latestVersion || null;
                    const feedbackArray = Array.isArray(item.feedback) ? item.feedback : [];
                    const latestFeedback =
                      feedbackArray.length > 0 ? feedbackArray[feedbackArray.length - 1] : null;
  const isOverdue = item.dueDate && new Date(item.dueDate) < new Date() && item.status !== "approved" && item.status !== "scheduled";

                    return (
                      <Card
                        key={item._id}
                        className={`bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer ${isOverdue ? "border-red-200 ring-1 ring-red-100" : ""}`}
                        onClick={() => setSelectedDeliverable(item)}
                      >
                        <CardContent className="p-3 space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="font-medium text-sm leading-tight">{item.title}</div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] px-1 h-5 ${
                                  (item.type || "").includes("video") || (item.type || "").includes("reel") 
                                    ? "bg-blue-50 text-blue-700 border-blue-200" 
                                    : (item.type || "").includes("post") || (item.type || "").includes("image")
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-slate-50 text-slate-700 border-slate-200"
                                }`}
                              >
                                {item.type || "Other"}
                              </Badge>
                              {col.id === "scheduled" && item.dueDate && (
                                <Badge variant="outline" className="text-[10px] px-1 h-5 bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </Badge>
                              )}
                              {isOverdue && col.id !== "scheduled" && (
                                <Badge variant="outline" className="text-[10px] px-1 h-5 bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          </div>

                          {briefUnclear && (
                            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[10px]">
                              <AlertTriangle className="h-3 w-3" />
                              Brief incomplete
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="font-medium">{item.clientName || "No Client"}</span>
                            {col.id === "approved" && approvalRecency && (
                              <Badge
                                variant={approvalRecency === "last7" ? "default" : "secondary"}
                                className="text-[10px] px-1 h-5"
                              >
                                {approvalRecency === "last7" ? "Approved ≤7d" : "Approved ≤30d"}
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 mt-2 pt-2 border-t">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="truncate max-w-[100px] flex items-center gap-1">
                                <User className="h-3 w-3 opacity-70" />
                                {item.assigneeName || "Unassigned"}
                              </span>
                              {item.dueDate && (
                                <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                                  {new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>

                          {col.id === "internal_review" && (
                            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground gap-2">
                              <span>
                                <span className="font-medium">Versions:</span>{" "}
                                {versionCount > 0 ? versionCount : "No versions yet"}
                              </span>
                              {latestVersion?.url && (
                                <a
                                  href={String(latestVersion.url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-primary underline"
                                >
                                  Open latest
                                </a>
                              )}
                            </div>
                          )}

                          {col.id === "changes_requested" && latestFeedback && (
                            <div className="mt-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                              <div className="font-medium">Client feedback</div>
                              <div className="line-clamp-2">
                                {String(latestFeedback.content || "").trim() || "Feedback provided"}
                              </div>
                            </div>
                          )}

                            {capabilities.canWrite && (
                              <div className="space-y-1">
                                <form
                                  action={actions.updateDeliverableStatus}
                                  className="flex items-center gap-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <input type="hidden" name="id" value={String(item._id)} />
                                  <Select
                                    name="status"
                                    defaultValue={String(item.status || "drafting")}
                                  >
                                    <SelectTrigger className="h-7 w-[140px] text-xs">
                                      <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {COLUMNS.map((statusCol) => {
                                        const disableForClientFacing =
                                          briefUnclear &&
                                          (statusCol.id === "client_review" || statusCol.id === "approved");
                                        return (
                                          <SelectItem
                                            key={statusCol.id}
                                            value={statusCol.id}
                                            disabled={disableForClientFacing}
                                          >
                                            {statusCol.title}
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                  <Button type="submit" size="sm" className="h-7 px-2 text-xs">
                                    Update
                                  </Button>
                                </form>
                                {briefUnclear && (
                                  <div className="text-[11px] text-red-700">
                                    Client-facing statuses are disabled while the brief is incomplete.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {(col.id === "internal_review" || col.id === "client_review") &&
                            capabilities.canWrite &&
                            (actions.generateApprovalLink || linkState === "active") && (
                            <div className="mt-2 pt-2 border-t">
                              {briefUnclear ? (
                                <div className="text-[11px] text-red-700 flex items-center justify-between">
                                  <span className="inline-flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Complete brief before sending to client.
                                  </span>
                                </div>
                              ) : (
                                <>
                                  {linkState === "active" && item.approvalToken && (
                                    <div className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                                      <div className="flex items-center justify-between">
                                        <span>Client link active</span>
                                        {item.approvalTokenExpiry && (
                                          <span>
                                            Expires{" "}
                                            {new Date(item.approvalTokenExpiry).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                      <a
                                        href={`/approval/${String(item.approvalToken)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-primary underline"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        Open approval link
                                      </a>
                                      <span>
                                        Share this link with your client for approval.
                                      </span>
                                    </div>
                                  )}

                                  {actions.generateApprovalLink && (linkState === "none" || linkState === "expired") && (
                                    <form
                                      action={actions.generateApprovalLink}
                                      onClick={(e) => e.stopPropagation()}
                                      className="mt-1 flex flex-col gap-1"
                                    >
                                      <input type="hidden" name="id" value={String(item._id)} />
                                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                        <span>
                                          {linkState === "expired"
                                            ? "Client link expired"
                                            : "No client link yet"}
                                        </span>
                                      </div>
                                      <Button type="submit" size="sm" className="h-7 px-2 text-xs mt-1 w-full">
                                        {linkState === "expired" ? "Regenerate client link" : "Generate client link"}
                                      </Button>
                                    </form>
                                  )}
                                </>
                              )}
                            </div>
                          )}

                          {item.scheduledAt && (
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-1">
                              <CalendarIcon className="h-3 w-3" />
                              <span className="font-medium">
                                {new Date(item.scheduledAt).toLocaleDateString()} {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          )}

                          {col.id === "approved" && (
                            <Button
                              size="sm"
                              className="w-full mt-2 h-7 text-xs"
                              variant="default"
                              disabled={briefUnclear}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onScheduleClick) onScheduleClick(item);
                              }}
                            >
                              <CalendarIcon className="w-3 h-3 mr-1" />{" "}
                              {briefUnclear ? "Complete brief to schedule" : "Schedule"}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="text-center py-8 text-xs text-muted-foreground italic opacity-50">
                      No items
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
