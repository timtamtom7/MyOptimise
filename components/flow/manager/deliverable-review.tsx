"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, CheckCircle, XCircle, Clock, FileText, Play, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import dynamic from "next/dynamic";
import { addVersionComment } from "@/app/actions/deliverables";
import { getMediaType } from "@/lib/media";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as unknown as React.ComponentType<any>;

interface Brief {
  _id: string;
  title: string;
  status: string;
  type: string;
  platform: string;
  dueDate?: string;
  hook?: string;
  script?: string;
  visualDirection?: string;
  creativeGoal?: string;
  contentConcept?: string;
  campaign: { _id: string; title: string; client: { name: string } };
  assignedTo?: { name: string };
  versionHistory?: { 
    versionNumber?: number; 
    url: string; 
    notes?: string; 
    createdAt: string;
    comments?: {
       _key: string;
       text: string;
       timestamp: number;
       author: { name: string; avatar?: any };
       createdAt: string;
    }[];
  }[];
  approvalToken?: string;
}

interface ManagerDeliverableReviewProps {
  brief: Brief;
  actions: {
    updateStatus: (formData: FormData) => Promise<any>;
    generateApproval: (formData: FormData) => Promise<any>;
  };
  user: any;
}

export function ManagerDeliverableReview({ brief, actions, user }: ManagerDeliverableReviewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  
  // Video & Comments State
  const [currentTime, setCurrentTime] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const playerRef = useRef<any>(null);

  const latestVersion = brief.versionHistory?.[brief.versionHistory.length - 1];
  const mediaType = latestVersion ? getMediaType(latestVersion.url) : "unknown";
  const isVideo = mediaType === "video" || mediaType === "video_external";

  const handleApprove = async () => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("id", brief._id);
    
    try {
        await actions.generateApproval(formData);
        // Server action revalidates, UI updates automatically
    } catch (e) {
        console.error(e);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!feedback) return;
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("id", brief._id);
    formData.append("status", "changes_requested");
    formData.append("feedback", feedback);

    try {
        await actions.updateStatus(formData);
        setShowRejectForm(false);
    } catch (e) {
        console.error(e);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment || !latestVersion) return;
    setIsAddingComment(true);
    
    const formData = new FormData();
    formData.append("deliverableId", brief._id);
    formData.append("versionNumber", String(latestVersion.versionNumber));
    formData.append("text", newComment);
    formData.append("timestamp", String(currentTime));

    try {
      await addVersionComment(formData);
      setNewComment("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingComment(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Link href={`/flow/manager/${brief.campaign._id}`} className="text-slate-500 hover:text-slate-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                 <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    {brief.campaign.client.name} / {brief.campaign.title}
                 </div>
                 <h1 className="text-lg font-display font-medium text-slate-900 dark:text-slate-50">
                    {brief.title}
                 </h1>
              </div>
           </div>

           <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-slate-100 font-normal">
                {brief.status.replace("_", " ")}
              </Badge>
              {brief.status === "internal_review" && (
                  <>
                    <Button 
                        variant="destructive" 
                        size="sm" 
                        className="text-white"
                        onClick={() => setShowRejectForm(!showRejectForm)}
                        disabled={isSubmitting}
                    >
                        <XCircle className="w-4 h-4 mr-2" /> Request Changes
                    </Button>
                    <Button 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white" 
                        size="sm"
                        onClick={handleApprove}
                        disabled={isSubmitting}
                    >
                        <CheckCircle className="w-4 h-4 mr-2" /> Approve for Client
                    </Button>
                  </>
              )}
           </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left: Creative Work */}
         <div className="lg:col-span-2 space-y-6">
            {latestVersion ? (
                <div className="space-y-6">
                    <div className={cn("bg-black rounded-lg overflow-hidden shadow-lg relative group", isVideo ? "aspect-video" : "aspect-auto")}>
                        {isVideo ? (
                            <ReactPlayer
                                ref={playerRef}
                                url={latestVersion.url}
                                width="100%"
                                height="100%"
                                controls
                                onProgress={(state: any) => setCurrentTime(state.playedSeconds)}
                            />
                        ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img 
                                src={latestVersion.url} 
                                alt="Version Preview" 
                                className="w-full h-auto max-h-[600px] object-contain mx-auto"
                            />
                        )}
                    </div>

                    {/* Visual Feedback Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
                       <div className="flex items-center justify-between mb-4">
                          <h3 className="font-medium text-slate-900 flex items-center gap-2">
                             <MessageSquare className="w-4 h-4" /> Visual Feedback
                          </h3>
                          {isVideo && (
                              <Badge variant="outline" className="font-mono">
                                 {formatTime(currentTime)}
                              </Badge>
                          )}
                       </div>
                       
                       <div className="flex gap-2 mb-6">
                          <Textarea
                             placeholder={isVideo ? `Add a comment at ${formatTime(currentTime)}...` : "Add a comment on this version..."}
                             value={newComment}
                             onChange={(e) => setNewComment(e.target.value)}
                             onFocus={() => {
                                 if (isVideo && playerRef.current) {
                                     // ReactPlayer internal player access depends on the player type, but often this works for pausing
                                     try {
                                         // For custom players or just ensuring it pauses
                                         // We can't easily force pause via ref without state control for playing
                                         // But we can try assuming the user will pause manually or we add a playing state
                                         // Since we don't track 'playing' state here, we'll skip auto-pause to avoid complexity/bugs
                                     } catch (e) { /* ignore */ }
                                 }
                             }}
                             className="min-h-[60px]"
                          />
                          <Button 
                             onClick={handleAddComment} 
                             disabled={!newComment || isAddingComment}
                             className="h-auto"
                          >
                             Add
                          </Button>
                       </div>

                       <div className="space-y-3 max-h-[300px] overflow-y-auto">
                          {latestVersion.comments?.slice().sort((a,b) => a.timestamp - b.timestamp).map((comment) => (
                             <div 
                                key={comment._key} 
                                className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded border border-slate-100 dark:border-slate-800 hover:border-blue-200 cursor-pointer transition-colors"
                                onClick={() => playerRef.current?.seekTo(comment.timestamp)}
                             >
                                <div className="mt-1">
                                   <div className="w-12 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold font-mono">
                                      {formatTime(comment.timestamp)}
                                   </div>
                                </div>
                                <div>
                                   <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-medium text-slate-900">{comment.author?.name || "Unknown"}</span>
                                      <span className="text-xs text-slate-400">{format(new Date(comment.createdAt), "MMM d, h:mm a")}</span>
                                   </div>
                                   <p className="text-sm text-slate-600">{comment.text}</p>
                                </div>
                             </div>
                          ))}
                          {(!latestVersion.comments || latestVersion.comments.length === 0) && (
                             <div className="text-center text-sm text-slate-400 py-4">
                                No comments yet. Play the video and add feedback at specific timestamps.
                             </div>
                          )}
                       </div>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-100 dark:bg-slate-900 rounded-lg aspect-video flex items-center justify-center text-slate-400">
                    No work submitted yet.
                </div>
            )}

            {/* Reject Form */}
            {showRejectForm && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
                    <CardHeader>
                        <CardTitle className="text-red-700 text-lg">Request Changes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea 
                            placeholder="Describe what needs to be fixed..." 
                            className="bg-white dark:bg-slate-950 mb-4"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowRejectForm(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleReject} disabled={!feedback || isSubmitting}>
                                Send Feedback
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Version History */}
            <div className="space-y-4">
                <h3 className="font-display text-lg text-slate-900">Version History</h3>
                {brief.versionHistory?.slice().reverse().map((version, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="flex-1">
                            <div className="flex justify-between mb-1">
                                <span className="font-medium text-slate-900">Version {version.versionNumber || "?"}</span>
                                <span className="text-xs text-slate-500">{format(new Date(version.createdAt), "MMM d, h:mm a")}</span>
                            </div>
                            <a href={version.url} target="_blank" className="text-sm text-blue-600 hover:underline flex items-center mb-2">
                                {version.url} <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                            {version.notes && (
                                <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                                    &quot;{version.notes}&quot;
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
         </div>

         {/* Right: Brief Details */}
         <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="font-display">Brief Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <DetailSection title="Hook / Angle" content={brief.hook} />
                    <DetailSection title="Script" content={brief.script} />
                    <DetailSection title="Visual Direction" content={brief.visualDirection} />
                    <DetailSection title="Creative Goal" content={brief.creativeGoal} />
                    
                    <div className="pt-4 border-t border-slate-100">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-500">Platform</span>
                            <span className="font-medium">{brief.platform}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-500">Format</span>
                            <span className="font-medium">{brief.type}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Due Date</span>
                            <span className="font-medium">{brief.dueDate ? format(new Date(brief.dueDate), "MMM d, yyyy") : "None"}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}

function DetailSection({ title, content }: { title: string, content?: string }) {
    if (!content) return null;
    return (
        <div>
            <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{title}</h4>
            <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {content}
            </div>
        </div>
    )
}
