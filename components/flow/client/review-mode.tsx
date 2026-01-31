"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle, Play, Maximize2, Minimize2, MessageSquare, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Deliverable {
  _id: string;
  title: string;
  status: string;
  type: string;
  platform: string;
  versionHistory?: { versionNumber?: number; url: string; notes?: string; createdAt: string }[];
  client?: { name: string };
  campaign?: { title: string };
}

interface ReviewModeProps {
  deliverable: Deliverable;
  actions: {
    approve: (formData: FormData) => Promise<any>;
    reject: (formData: FormData) => Promise<any>;
  };
}

export function ReviewMode({ deliverable, actions }: ReviewModeProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const latestVersion = deliverable.versionHistory?.[deliverable.versionHistory.length - 1];
  const mediaUrl = latestVersion?.url;
  const isVideo = mediaUrl?.match(/\.(mp4|mov|webm)$/i) || mediaUrl?.includes("youtube") || mediaUrl?.includes("vimeo");

  const handleApprove = async () => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("deliverableId", deliverable._id);
    try {
      await actions.approve(formData);
      setShowApproveDialog(false);
      router.push("/flow/client?status=approved");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason) return;
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("deliverableId", deliverable._id);
    formData.append("rejectionReason", rejectReason);
    try {
      await actions.reject(formData);
      setShowRejectDialog(false);
      router.push("/flow/client?status=rejected");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link 
            href="/flow/client" 
            className="text-slate-400 hover:text-white transition-colors flex items-center text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
          <div className="h-6 w-px bg-slate-800 mx-2" />
          <div>
            <h1 className="text-sm font-medium text-white">{deliverable.title}</h1>
            <p className="text-xs text-slate-500">
              {deliverable.campaign?.title} • {deliverable.platform} {deliverable.type}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-400 hover:text-white"
            onClick={() => window.open(mediaUrl, '_blank')}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <div className="h-6 w-px bg-slate-800 mx-2" />
          <Button 
            variant="outline" 
            className="border-slate-700 bg-transparent text-white hover:bg-slate-800 hover:text-white"
            onClick={() => setShowRejectDialog(true)}
          >
            Request Changes
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white border-none"
            onClick={() => setShowApproveDialog(true)}
          >
            Approve Content
          </Button>
        </div>
      </header>

      {/* Main Content Area (Cinema Mode) */}
      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        <div className={cn(
          "relative transition-all duration-500 ease-in-out shadow-2xl rounded-lg overflow-hidden bg-black",
          isFullscreen ? "w-full h-full fixed inset-0 z-40 rounded-none" : "w-full max-w-5xl aspect-video"
        )}>
           {isVideo ? (
             <video 
               src={mediaUrl} 
               controls 
               className="w-full h-full object-contain"
               poster={latestVersion.url + "?w=1920&h=1080&fit=crop&auto=format"} 
             />
           ) : (
             <img 
               src={mediaUrl} 
               alt={deliverable.title} 
               className="w-full h-full object-contain" 
             />
           )}
           
           {/* Floating Controls */}
           <div className="absolute bottom-6 right-6 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
              <Button 
                variant="secondary" 
                size="icon" 
                className="bg-black/50 hover:bg-black/70 text-white border-none backdrop-blur-sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
           </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-slate-800 bg-slate-950 p-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
             <h3 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">Editor Notes</h3>
             <p className="text-slate-300 text-sm leading-relaxed">
               {latestVersion.notes || "No notes provided for this version."}
             </p>
          </div>
          <div className="flex justify-start md:justify-end items-start">
             <div className="bg-slate-900 rounded-lg p-4 border border-slate-800 max-w-sm w-full">
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <MessageSquare className="w-4 h-4" />
                   </div>
                   <span className="text-sm font-medium text-white">Feedback Instructions</span>
                </div>
                <p className="text-xs text-slate-400">
                  Please review the content for brand alignment, tone, and accuracy. 
                  If changes are needed, be specific in your request to ensure a quick turnaround.
                </p>
             </div>
          </div>
        </div>
      </footer>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Approve Deliverable
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to approve this content? This will notify the team to proceed with publishing or final delivery.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button 
              variant="ghost" 
              onClick={() => setShowApproveDialog(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApprove} 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white border-none"
            >
              {isSubmitting ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-amber-500" />
              Request Changes
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Please describe the changes needed. Be as specific as possible.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., The logo intro is too fast, please slow it down..."
              className="min-h-[120px] bg-slate-950 border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>
          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setShowRejectDialog(false)}
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReject} 
              disabled={isSubmitting || !rejectReason.trim()}
              className="bg-amber-600 hover:bg-amber-700 text-white border-none"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
