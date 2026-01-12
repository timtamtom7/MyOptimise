"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlatformIcon, StatusBadge } from "./content-grid";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateContentSchedule, generateApprovalLink, updateContentStatus, addContentAnnotation } from "@/app/actions/content";
import { toast } from "sonner";
import { formatDate } from "@/lib/date-formatting";
import { Calendar as CalendarIcon, Loader2, MessageSquare, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { getOrCreateThreadForDocument } from "@/app/actions/messages";
import { ImageAnnotator } from "./image-annotator";
import { InstagramPreview } from "./previews/instagram-preview";
import { TikTokPreview } from "./previews/tiktok-preview";
import { LinkedInPreview } from "./previews/linkedin-preview";

interface PostPreviewDialogProps {
  post: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canWrite: boolean;
  targetTimezone?: string;
  authorName?: string;
  authorAvatar?: string;
}

export function PostPreviewDialog({ post, open, onOpenChange, canWrite, targetTimezone, authorName, authorAvatar }: PostPreviewDialogProps) {
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [approvalLink, setApprovalLink] = useState<string>("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [annotateMode, setAnnotateMode] = useState(false);
  const router = useRouter();

  if (!post) return null;

  async function handleApprove() {
    setStatusLoading(true);
    try {
        await updateContentStatus(post._id, "scheduled");
        toast.success("Content approved and scheduled");
        onOpenChange(false);
    } catch (e) {
        console.error(e);
        toast.error("Failed to approve content");
    } finally {
        setStatusLoading(false);
    }
  }

  async function handleRequestChanges() {
    setThreadLoading(true);
    try {
        await updateContentStatus(post._id, "changes_requested");
        const threadId = await getOrCreateThreadForDocument(
            post._id,
            "contentItem",
            post.title,
            post.client?._id || ""
        );
        if (threadId) {
            router.push(`/dashboard/client/messages/${threadId}`);
        }
        toast.success("Changes requested. Redirecting to chat...");
        onOpenChange(false);
    } catch (e) {
        console.error(e);
        toast.error("Failed to request changes");
    } finally {
        setThreadLoading(false);
    }
  }

  async function handleAddAnnotation(x: number, y: number, text: string) {
    try {
      await addContentAnnotation(post._id, { x, y, text });
      toast.success("Annotation added");
      setAnnotateMode(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to add annotation");
    }
  }

  async function handleReschedule() {
    if (!newDate) return;
    setLoading(true);
    try {
      await updateContentSchedule(post._id, newDate);
      toast.success("Post rescheduled");
      setIsRescheduling(false);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to reschedule");
    } finally {
      setLoading(false);
    }
  }
  
  async function handleGenerateLink() {
    setLinkLoading(true);
    try {
      const link = await generateApprovalLink(post._id);
      setApprovalLink(link);
      toast.success("Approval link generated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate link");
    } finally {
      setLinkLoading(false);
    }
  }
  
  async function handleSetInternalReview() {
    setStatusLoading(true);
    try {
      await updateContentStatus(post._id, "internal_review");
      toast.success("Moved to internal review");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
        onOpenChange(val);
        if(!val) setIsRescheduling(false);
    }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="truncate">{post.title || "Post Preview"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Asset</h3>
            {canWrite && post.firstAssetMime?.startsWith("image/") && (
              <Button 
                variant={annotateMode ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setAnnotateMode(!annotateMode)}
                className="h-7 text-xs"
              >
                <MessageSquare className="mr-2 h-3 w-3" />
                {annotateMode ? "Cancel Annotation" : "Add Comment"}
              </Button>
            )}
          </div>

          {post.platform === "instagram" ? (
             <InstagramPreview 
                post={post}
                authorName={authorName || "User"}
                authorAvatar={authorAvatar}
                onAddAnnotation={handleAddAnnotation}
                annotateMode={annotateMode}
             />
          ) : post.platform === "tiktok" ? (
             <TikTokPreview
                post={post}
                authorName={authorName || "User"}
                authorAvatar={authorAvatar}
                onAddAnnotation={handleAddAnnotation}
                annotateMode={annotateMode}
             />
          ) : post.platform === "linkedin" ? (
             <LinkedInPreview
                post={post}
                authorName={authorName || "User"}
                authorAvatar={authorAvatar}
                onAddAnnotation={handleAddAnnotation}
                annotateMode={annotateMode}
             />
          ) : (
            <>
              {post.firstAssetUrl && (
                post.firstAssetMime?.startsWith("video/")
                  ? <video controls className="w-full rounded-md max-h-[400px]" src={post.firstAssetUrl} />
                  : <ImageAnnotator 
                      src={post.firstAssetUrl}
                      alt={post.title}
                      annotations={post.annotations || []}
                      onAddAnnotation={handleAddAnnotation}
                      canAnnotate={annotateMode}
                      className="max-h-[400px] bg-muted/20 rounded-md"
                    />
              )}
              
              {post.caption && (
                <div className="bg-muted/30 p-3 rounded-md text-sm whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                    {post.caption}
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between text-xs border-t pt-4">
            <div className="flex items-center gap-2">
              <PlatformIcon platform={post.platform} />
              <span className="capitalize">{post.postType?.replace('_', ' ')}</span>
            </div>
            <StatusBadge status={post.status} />
          </div>
          
          <div className="flex items-center justify-between text-sm border-t pt-4">
             <div className="text-muted-foreground">
                Scheduled: <span className="text-foreground font-medium">
                    {post.scheduledAt ? formatDate(post.scheduledAt, "MMM d, yyyy @ h:mm a") : "Unscheduled"}
                </span>
                {post.scheduledAt && (
                  <div className="text-xs mt-1">
                    <span className="mr-2">Local:</span>
                    <span className="font-medium">{new Date(post.scheduledAt).toLocaleString()}</span>
                    <span className="ml-3 mr-2">UTC:</span>
                    <span className="font-medium">{new Date(post.scheduledAt).toLocaleString("en-GB", { timeZone: "UTC" })}</span>
                  </div>
                )}
             </div>
             {canWrite && !isRescheduling && (
                 <Button variant="outline" size="sm" onClick={() => {
                     setNewDate(post.scheduledAt ? formatDate(post.scheduledAt, "yyyy-MM-dd'T'HH:mm") : "");
                     setIsRescheduling(true);
                 }}>
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    Reschedule
                 </Button>
             )}
          </div>

          {isRescheduling && (
              <div className="bg-muted/30 p-4 rounded-md space-y-3 animate-in fade-in slide-in-from-top-2">
                  <Label>New Schedule Time</Label>
                  <div className="flex gap-2">
                      <Input 
                        type="datetime-local" 
                        value={newDate} 
                        onChange={(e) => setNewDate(e.target.value)}
                      />
                      <Button onClick={handleReschedule} disabled={loading || !newDate}>
                          {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          Save
                      </Button>
                      <Button variant="ghost" onClick={() => setIsRescheduling(false)} disabled={loading}>Cancel</Button>
                  </div>
              </div>
          )}
          
          {canWrite && (
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                 {/* Primary Actions for Approval/Changes */}
                 <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleApprove} 
                    disabled={statusLoading || post.status === 'scheduled' || post.status === 'published'}
                    className="bg-green-600 hover:bg-green-700 text-white"
                 >
                    {statusLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <CheckCircle className="mr-2 h-3 w-3" />}
                    Approve
                 </Button>

                 <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleRequestChanges} 
                    disabled={threadLoading}
                 >
                    {threadLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <MessageSquare className="mr-2 h-3 w-3" />}
                    Request Changes
                 </Button>

                 <div className="h-6 w-px bg-border mx-2" />

                <Button variant="secondary" size="sm" onClick={handleSetInternalReview} disabled={statusLoading}>
                  {statusLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  Internal Review
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerateLink} disabled={linkLoading}>
                  {linkLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  Get Link
                </Button>
              </div>
              {!!approvalLink && (
                <div className="flex items-center gap-2">
                  <Input readOnly value={approvalLink} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(approvalLink);
                        toast.success("Copied");
                      } catch {}
                    }}
                  >
                    Copy
                  </Button>
                </div>
              )}
            </div>
          )
          }
        </div>
      </DialogContent>
    </Dialog>
  );
}
