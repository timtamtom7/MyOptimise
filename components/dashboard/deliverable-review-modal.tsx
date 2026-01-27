"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Loader2, AlertTriangle, Target, Lightbulb, Link as LinkIcon, MessageSquare, CheckCircle, XCircle, Clock, History } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { getMediaType, getVideoEmbedUrl } from "@/lib/media";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DeliverableReviewModalProps {
  deliverable: any;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string, feedback?: string) => Promise<void>;
  approveStatus?: string;
  approveLabel?: string;
}

export function DeliverableReviewModal({ 
  deliverable, 
  isOpen, 
  onClose, 
  onStatusUpdate,
  approveStatus = "client_review",
  approveLabel = "Approve for Client"
}: DeliverableReviewModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);

  if (!deliverable) return null;

  // Map Sanity fields to Brief-like structure
  const title = deliverable.title;
  const status = deliverable.status || "drafting";
  const type = deliverable.type;
  const hook = deliverable.hook;
  const script = deliverable.script;
  const visualDirection = deliverable.visualDirection;
  const creativeGoal = deliverable.creativeGoal;
  const contentConcept = deliverable.contentConcept;
  const assets = deliverable.assets || [];
  const statusHistory = deliverable.statusHistory || [];
  const latestVersion = deliverable.latestVersion;
  const videoUrl = latestVersion?.url;
  const mediaType = videoUrl ? getMediaType(videoUrl) : "unknown";
  const notes = latestVersion?.notes;
  const assigneeName = deliverable.assigneeName;

  const handleApprove = async () => {
    try {
      setIsUpdating(true);
      // Approve moves to the target status (client_review or approved)
      await onStatusUpdate(deliverable._id, approveStatus);
      toast.success(approveStatus === "approved" ? "Deliverable approved" : "Deliverable sent to client review");
      onClose();
    } catch (error) {
      toast.error("Failed to approve deliverable");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!feedback.trim()) {
      toast.error("Please provide feedback for the changes requested");
      return;
    }

    try {
      setIsUpdating(true);
      await onStatusUpdate(deliverable._id, "changes_requested", feedback);
      toast.success("Changes requested successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to request changes");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
            <div className="space-y-1">
              <DialogTitle className="text-2xl">{title}</DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {type && <Badge variant="outline">{type}</Badge>}
                {assigneeName && <span className="text-xs">By {assigneeName}</span>}
              </div>
            </div>
            <Badge variant={status === "internal_review" ? "default" : "secondary"}>
              {status.replace("_", " ")}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="review" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b">
            <TabsList>
              <TabsTrigger value="review">Review</TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="review" className="flex-1 overflow-y-auto p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column: The Work */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    Submitted Work
                    {latestVersion?.versionNumber && (
                      <Badge variant="outline" className="text-xs">v{latestVersion.versionNumber}</Badge>
                    )}
                  </h3>
                  
                  {videoUrl ? (
                    <div className="space-y-2">
                      <div className="rounded-md overflow-hidden border bg-black aspect-video flex items-center justify-center relative bg-slate-100">
                        {mediaType === "video" ? (
                          <video src={videoUrl} controls className="w-full h-full" />
                        ) : mediaType === "video_external" ? (
                          getVideoEmbedUrl(videoUrl) ? (
                            <iframe 
                              src={getVideoEmbedUrl(videoUrl)!} 
                              className="w-full h-full" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowFullScreen 
                            />
                          ) : (
                            <div className="text-center p-4">
                               <p className="mb-2 font-medium">External Video</p>
                               <a 
                                 href={videoUrl} 
                                 target="_blank" 
                                 rel="noreferrer" 
                                 className="text-primary underline"
                               >
                                 Open on {videoUrl.includes('vimeo') ? 'Vimeo' : 'YouTube'}
                               </a>
                            </div>
                          )
                        ) : mediaType === "image" ? (
                          <Image
                            src={videoUrl}
                            alt="Deliverable preview"
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <p className="mb-2">External Link or File</p>
                            <a 
                              href={videoUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-primary underline"
                            >
                              Open in new tab
                            </a>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <a href={videoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary">
                          <LinkIcon className="h-3 w-3" /> Open original link
                        </a>
                      </div>
                    </div>
                  ) : (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>No submission found</AlertTitle>
                      <AlertDescription>The editor has not submitted a URL yet.</AlertDescription>
                    </Alert>
                  )}

                  {notes && (
                    <div className="mt-4 bg-muted p-3 rounded-md text-sm">
                      <span className="font-semibold block mb-1">Editor Notes:</span>
                      {notes}
                    </div>
                  )}
                </div>

                {/* Review Actions */}
                {(status === "internal_review" || status === "client_review") && (
                  <div className="p-4 border rounded-lg bg-slate-50 space-y-4">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Review Actions</h3>
                    
                    {!showFeedbackInput ? (
                      <div className="flex gap-3">
                        <Button 
                          onClick={handleApprove} 
                          disabled={isUpdating}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                          {approveLabel}
                        </Button>
                        <Button 
                          onClick={() => setShowFeedbackInput(true)} 
                          variant="destructive"
                          disabled={isUpdating}
                          className="flex-1"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Request Changes
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Feedback for Editor</label>
                          <Textarea 
                            placeholder="Describe what needs to be fixed..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="min-h-[100px]"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => setShowFeedbackInput(false)}>Cancel</Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={handleRequestChanges}
                            disabled={isUpdating || !feedback.trim()}
                          >
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: The Brief */}
              <div className="space-y-6 border-l pl-6">
                <h3 className="font-semibold text-lg">Original Brief</h3>
                
                {(creativeGoal || contentConcept) && (
                  <div className="space-y-4">
                      {creativeGoal && (
                          <div className="space-y-1">
                              <h4 className="font-medium text-sm flex items-center gap-2"><Target className="h-3 w-3" /> Creative Goal</h4>
                              <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{creativeGoal}</p>
                          </div>
                      )}
                      {contentConcept && (
                          <div className="space-y-1">
                              <h4 className="font-medium text-sm flex items-center gap-2"><Lightbulb className="h-3 w-3" /> Concept</h4>
                              <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{contentConcept}</p>
                          </div>
                      )}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-1">Hook</h4>
                    <div className="bg-muted/50 p-3 rounded text-sm">{hook || "N/A"}</div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Script</h4>
                    <div className="bg-muted/50 p-3 rounded text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto custom-scrollbar">
                      {script || "N/A"}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-1">Visual Direction</h4>
                    <div className="bg-muted/50 p-3 rounded text-sm whitespace-pre-wrap">
                      {visualDirection || "N/A"}
                    </div>
                  </div>

                  {assets && assets.length > 0 && (
                    <div>
                       <h4 className="font-medium text-sm mb-1">Assets</h4>
                       <div className="flex flex-col gap-1">
                         {assets.map((asset: any, i: number) => (
                           <a 
                             key={i} 
                             href={asset.url} 
                             target="_blank" 
                             rel="noreferrer"
                             className="text-xs text-primary underline truncate"
                           >
                             {asset.originalFilename || `Asset ${i + 1}`}
                           </a>
                         ))}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-8">
              {statusHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No history available for this deliverable.</p>
                </div>
              ) : (
                <div className="relative border-l border-slate-200 ml-3 space-y-8">
                  {[...statusHistory].reverse().map((item: any, i: number) => (
                    <div key={i} className="relative pl-8">
                      <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-medium">
                          Changed status to <Badge variant="outline" className="ml-1">{item.toStatus?.replace("_", " ") || "Unknown"}</Badge>
                        </div>
                        {item.fromStatus && (
                          <div className="text-xs text-muted-foreground">
                            Previous status: {item.fromStatus.replace("_", " ")}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(item.changedAt).toLocaleString()}</span>
                          {item.changedBy && (
                            <>
                              <span>•</span>
                              <span>by {item.changedBy.name || item.changedBy.email || "Unknown User"}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
