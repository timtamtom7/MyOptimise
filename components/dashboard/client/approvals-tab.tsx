"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Activity, PlayCircle, FileText, Image as ImageIcon } from "lucide-react";
import { DeliverableReviewModal } from "@/components/dashboard/deliverable-review-modal";
import { getMediaType } from "@/lib/media";
import Image from "next/image";

interface Deliverable {
  _id: string;
  title: string;
  status: string;
  type: string;
  versionHistory?: any[];
  campaign?: { title: string };
  latestAsset?: {
    url: string;
    mimeType: string;
    originalFilename?: string;
  };
  latestVersion?: {
    url: string;
    notes?: string;
    versionNumber: number;
    createdAt: string;
  };
  hook?: string;
  script?: string;
  visualDirection?: string;
  creativeGoal?: string;
  contentConcept?: string;
}

interface ApprovalsTabProps {
  deliverables: Deliverable[];
  onApprove: (formData: FormData) => Promise<void>;
  onReject: (formData: FormData) => Promise<void>;
}

export function ApprovalsTab({ deliverables, onApprove, onReject }: ApprovalsTabProps) {
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  
  const pendingReviews = deliverables.filter(d => d.status === "client_review");
  const otherDeliverables = deliverables.filter(d => d.status !== "client_review");

  return (
    <div className="space-y-6">
      <DeliverableReviewModal
        deliverable={selectedDeliverable}
        isOpen={!!selectedDeliverable}
        onClose={() => setSelectedDeliverable(null)}
        approveStatus="approved"
        approveLabel="Approve Deliverable"
        onStatusUpdate={async (id, status, feedback) => {
          const formData = new FormData();
          formData.append("deliverableId", id);
          if (feedback) formData.append("notes", feedback); // Use 'notes' for rejection reason in onReject

          if (status === "approved") {
            await onApprove(formData);
          } else if (status === "changes_requested") {
            await onReject(formData);
          }
        }}
      />

      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium">Pending Approval ({pendingReviews.length})</h3>
        {pendingReviews.length === 0 && (
          <p className="text-muted-foreground text-sm">You&apos;re all caught up! No items waiting for your approval.</p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {pendingReviews.map((item) => {
            const assetUrl = item.latestVersion?.url || item.latestAsset?.url || "";
            const mediaType = getMediaType(assetUrl);
            
            return (
            <Card key={item._id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>{item.campaign?.title || "No Campaign"}</CardDescription>
                  </div>
                  <Badge>{item.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border bg-muted/10 h-32 flex items-center justify-center overflow-hidden relative">
                    {mediaType === "image" && assetUrl ? (
                      <Image 
                        src={assetUrl} 
                        alt="Preview" 
                        fill 
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : mediaType === "video" || mediaType === "video_external" ? (
                      <div className="flex flex-col items-center gap-2">
                        <PlayCircle className="h-10 w-10 text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground">Video Preview</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-10 w-10 text-muted-foreground/50" />
                        <span className="text-xs text-muted-foreground">Document</span>
                      </div>
                    )}
                </div>
                
                <Button 
                    className="w-full" 
                    onClick={() => setSelectedDeliverable(item)}
                >
                    Review Deliverable
                </Button>
              </CardContent>
            </Card>
          );
          })}
        </div>
      </div>

      {otherDeliverables.length > 0 && (
        <div className="flex flex-col gap-4 pt-6 border-t">
          <h3 className="text-lg font-medium">Recent Activity</h3>
          <div className="space-y-2">
            {otherDeliverables.map((item) => (
               <div key={item._id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${item.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {item.status === 'approved' ? <CheckCircle2 className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-xs text-muted-foreground capitalize">{item.status.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <Badge variant="outline">{item.type}</Badge>
               </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
