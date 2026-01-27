"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X, FileText, Download, Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { submitPublicApproval } from "@/app/actions/deliverables";
import Image from "next/image";
import { getMediaType, getVideoEmbedUrl } from "@/lib/media";

type Deliverable = {
  _id: string;
  title: string;
  status: string;
  description?: string;
  hook?: string;
  script?: string;
  visualDirection?: string;
  creativeGoal?: string;
  contentConcept?: string;
  platform?: string;
  format?: string;
  dueDate?: string;
  versionHistory?: any[];
  latestVersion?: {
    url: string;
    notes?: string;
    createdAt: string;
  };
  campaign?: {
    title: string;
    client?: { name: string };
  };
};

export function DeliverableApprovalView({ 
  deliverable, 
  token 
}: { 
  deliverable: Deliverable; 
  token: string 
}) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [comment, setComment] = useState("");
  const [clientName, setClientName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproved, setIsApproved] = useState(deliverable.status === "approved");
  const [isChangesRequested, setIsChangesRequested] = useState(deliverable.status === "changes_requested");

  const mediaUrl = deliverable.latestVersion?.url;
  const mediaType = mediaUrl ? getMediaType(mediaUrl) : "unknown";

  async function handleAction(decision: "approve" | "reject") {
    if (decision === "reject" && !comment.trim()) {
      toast.error("Please provide feedback for changes.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("token", token);
    formData.append("decision", decision);
    if (comment) formData.append("notes", comment);
    if (clientName) formData.append("clientName", clientName);

    try {
      const result = await submitPublicApproval(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        if (decision === "approve") {
          setIsApproved(true);
          toast.success("Deliverable approved!");
        } else {
          setIsChangesRequested(true);
          toast.success("Changes requested. The team has been notified.");
        }
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isApproved) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
          <Check className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">Approved!</h2>
        <p className="text-muted-foreground max-w-md">
          Thank you for approving this deliverable. Our team has been notified and will proceed with scheduling.
        </p>
      </div>
    );
  }

  if (isChangesRequested && !isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
          <FileText className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">Feedback Sent</h2>
        <p className="text-muted-foreground max-w-md">
          We have received your feedback. Our team will review your comments and submit a new version shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Left Column: Preview */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-black/5 rounded-xl overflow-hidden border flex items-center justify-center min-h-[400px] bg-slate-100">
          {mediaUrl ? (
            mediaType === "video" ? (
              <video 
                src={mediaUrl} 
                controls 
                className="max-h-[600px] w-full object-contain" 
              />
            ) : mediaType === "video_external" ? (
              <div className="w-full h-full min-h-[400px]">
                {getVideoEmbedUrl(mediaUrl) ? (
                  <iframe 
                    src={getVideoEmbedUrl(mediaUrl)!} 
                    className="w-full h-full min-h-[400px]" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen 
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <ExternalLink className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="mb-4">External Video Link</p>
                    <Button variant="outline" asChild>
                      <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
                        Open Video
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            ) : mediaType === "image" ? (
            <Image 
              src={mediaUrl} 
              alt={deliverable.title} 
              width={0}
              height={0}
              sizes="100vw"
              style={{ width: '100%', height: 'auto' }}
              className="max-h-[600px] object-contain" 
            />
          ) : (
              <div className="text-center p-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="mb-4">Preview not available directly</p>
                <Button variant="outline" asChild>
                  <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
                    {mediaUrl.includes("/storage/v1/object/public/") ? (
                        <>
                            <Download className="mr-2 h-4 w-4" /> Download File
                        </>
                    ) : (
                        <>
                            <ExternalLink className="mr-2 h-4 w-4" /> Open External Link
                        </>
                    )}
                  </a>
                </Button>
              </div>
            )
          ) : (
            <div className="text-center text-muted-foreground">
              No content uploaded yet
            </div>
          )}
        </div>

        {/* Deliverable Details */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Platform</Label>
              <div className="font-medium capitalize">{deliverable.platform || "N/A"}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">Format</Label>
              <div className="font-medium capitalize">{deliverable.format?.replace("_", " ") || "N/A"}</div>
            </div>
            {deliverable.dueDate && (
              <div>
                <Label className="text-muted-foreground">Scheduled Date</Label>
                <div className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {new Date(deliverable.dueDate).toLocaleDateString()}
                </div>
              </div>
            )}
            {deliverable.hook && (
              <div className="sm:col-span-2">
                <Label className="text-muted-foreground">Hook / Angle</Label>
                <div className="font-medium">{deliverable.hook}</div>
              </div>
            )}
            {deliverable.script && (
              <div className="sm:col-span-2">
                <Label className="text-muted-foreground">Script</Label>
                <div className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md max-h-[200px] overflow-y-auto">{deliverable.script}</div>
              </div>
            )}
            {deliverable.visualDirection && (
              <div className="sm:col-span-2">
                <Label className="text-muted-foreground">Visual Direction</Label>
                <div className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md">{deliverable.visualDirection}</div>
              </div>
            )}
            {deliverable.contentConcept && (
              <div className="sm:col-span-2">
                <Label className="text-muted-foreground">Concept</Label>
                <div className="text-sm">{deliverable.contentConcept}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Actions */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Approval</CardTitle>
            <CardDescription>
              Review the content and approve or request changes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Your Name (Optional)</Label>
              <Input 
                id="clientName" 
                placeholder="Enter your name" 
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            {isRejecting ? (
              <div className="space-y-4 pt-4 border-t animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label htmlFor="comment">Feedback / Changes Required</Label>
                  <Textarea 
                    id="comment" 
                    placeholder="Please be specific about what needs to change..."
                    className="min-h-[150px]"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsRejecting(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleAction("reject")}
                    disabled={isSubmitting || !comment.trim()}
                    className="flex-1"
                  >
                    {isSubmitting ? "Sending..." : "Submit Feedback"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-4">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white" 
                  size="lg"
                  onClick={() => handleAction("approve")}
                  disabled={isSubmitting}
                >
                  <Check className="mr-2 h-5 w-5" /> Approve Content
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                  onClick={() => setIsRejecting(true)}
                  disabled={isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" /> Request Changes
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/50 text-xs text-muted-foreground p-4">
            Approving will notify the team to schedule this content.
          </CardFooter>
        </Card>

        {/* Latest Notes */}
        {deliverable.latestVersion?.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Editor Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {deliverable.latestVersion.notes}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}