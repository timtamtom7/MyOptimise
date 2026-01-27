"use client";

import { Brief } from "@/types/briefs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, FileVideo, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface BriefReviewProps {
    brief: Brief | null;
    isOpen: boolean;
    onClose: () => void;
    onApprove: (briefId: string) => Promise<void>;
    onReject: (briefId: string, feedback: string) => Promise<void>;
}

function isVideoFile(url: string) {
    if (!url) return false;
    // Check common video extensions
    if (/\.(mp4|mov|webm|ogg)$/i.test(url)) return true;
    // Check if it comes from our supabase storage
    if (url.includes("/storage/v1/object/public/deliverables/")) return true;
    return false;
}

export function BriefReview({ brief, isOpen, onClose, onApprove, onReject }: BriefReviewProps) {
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!brief) return null;

    const meta = (brief.metadata || {}) as any;
    const approvalToken = meta?.approvalToken as string | undefined;

    const handleCopyLink = () => {
        if (!approvalToken) return;
        const origin = window.location.origin;
        const link = `${origin}/approve/${approvalToken}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success("Approval link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };


    const handleReject = async () => {
        if (!feedback.trim()) return;
        try {
            setIsSubmitting(true);
            await onReject(brief.id, feedback);
            toast.success("Revision requested");
            onClose();
        } catch (error) {
            console.error("Failed to reject brief:", error);
            toast.error(error instanceof Error ? error.message : "Failed to request revision");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async () => {
        try {
            setIsSubmitting(true);
            await onApprove(brief.id);
            toast.success("Brief approved for client review");
            onClose();
        } catch (error) {
            console.error("Failed to approve brief:", error);
            const msg = error instanceof Error ? error.message : "Failed to approve brief";
            toast.error(msg);
            alert(`Error: ${msg}`); // Fallback for non-technical user feedback
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{brief.title}</DialogTitle>
                    <DialogDescription>Review deliverable and provide feedback</DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto pr-4">
                    <div className="space-y-6 py-4">
                        {/* Video Player or Link */}
                        {brief.video_url ? (
                            isVideoFile(brief.video_url) ? (
                                <div className="rounded-md overflow-hidden border bg-black">
                                    <video src={brief.video_url} controls className="w-full max-h-[400px]" />
                                </div>
                            ) : (
                                <div className="p-6 border rounded-md bg-muted/30 flex flex-col items-center justify-center gap-4 text-center">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                        <ExternalLink className="h-6 w-6 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-medium">External Deliverable Link</h3>
                                        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                            The editor has submitted an external link (Loom, Drive, etc.).
                                            Please review it before approving.
                                        </p>
                                    </div>
                                    <a 
                                        href={brief.video_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                                    >
                                        Open Link <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </div>
                            )
                        ) : (
                            <div className="p-8 border-2 border-dashed rounded-md text-center text-muted-foreground bg-muted/50">
                                No deliverable uploaded yet.
                            </div>
                        )}

                        <div>
                            <h3 className="font-semibold mb-2">Script</h3>
                            <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                                {brief.script || "No script provided"}
                            </div>
                        </div>

                        {brief.visual_direction && (
                            <div>
                                <h3 className="font-semibold mb-2">Visual Direction</h3>
                                <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                                    {brief.visual_direction}
                                </div>
                            </div>
                        )}

                        {brief.status === 'client_review' && approvalToken && (
                            <>
                                <hr className="my-4" />
                                <div className="space-y-4 pt-2">
                                    <h3 className="font-semibold">Client Approval</h3>
                                    <div className="p-4 bg-muted rounded-md border">
                                        <p className="text-sm text-muted-foreground mb-3">
                                            This deliverable is ready for client review. Share the link below with the client.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 p-2 bg-background border rounded text-xs font-mono overflow-x-auto whitespace-nowrap">
                                                {typeof window !== 'undefined' ? `${window.location.origin}/approve/${approvalToken}` : `/approve/${approvalToken}`}
                                            </code>
                                            <Button size="sm" variant="outline" onClick={handleCopyLink} className="shrink-0">
                                                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                                <span className="sr-only">Copy Link</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Review Controls */}
                        {brief.status === 'in_review' && (
                            <>
                                <hr className="my-4" />
                                <div className="space-y-4 pt-2">
                                    <h3 className="font-semibold">Review Action</h3>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Feedback (Required for revision request)</label>
                                        <Textarea 
                                            value={feedback} 
                                            onChange={(e) => setFeedback(e.target.value)} 
                                            placeholder="Enter specific feedback for the editor..."
                                            className="min-h-[100px]"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-4">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Close
                    </Button>
                    
                    {brief.status === 'in_review' && (
                        <>
                            <Button 
                                variant="destructive" 
                                onClick={handleReject} 
                                disabled={!feedback.trim() || isSubmitting}
                            >
                                Request Revision
                            </Button>
                            <Button 
                                onClick={handleApprove} 
                                disabled={isSubmitting} 
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isSubmitting ? "Approving..." : "Approve for Client"}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
