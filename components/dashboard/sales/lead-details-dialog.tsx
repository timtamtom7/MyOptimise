"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileAudio, Upload, User, Mail, DollarSign, Activity } from "lucide-react";
import { processCallRecording } from "@/app/actions/sales"; 
import { cn } from "@/lib/utils";

interface LeadDetailsDialogProps {
  lead: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailsDialog({ lead, open, onOpenChange }: LeadDetailsDialogProps) {
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("leadId", lead._id);

    try {
      await processCallRecording(formData);
      toast.success("Recording processed and summary added!");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to process recording");
    } finally {
      setUploading(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[3rem] p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-950 sm:max-w-[700px]">
        <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-8 border-b border-slate-100 dark:border-slate-800/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
            <DialogHeader>
                <DialogTitle className="text-3xl font-black text-slate-900 dark:text-slate-100">{lead.companyName}</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                    <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                        lead.status === "won" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    )}>
                        {lead.status}
                    </span>
                </div>
            </DialogHeader>
        </div>

        <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-[1rem] bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                            <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact</Label>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-lg">{lead.contactName || "-"}</div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-[1rem] bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                            <DollarSign className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Value</Label>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-lg">${lead.value?.toLocaleString() || "0"}</div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-[1rem] bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                            <Mail className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</Label>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-lg">{lead.email || "-"}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-[1rem] bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                            <Activity className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Activity</Label>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                                {lead._updatedAt ? new Date(lead._updatedAt).toLocaleDateString() : "Just now"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <FileAudio className="h-5 w-5 text-blue-500" />
                        Call Recordings & AI Analysis
                    </h3>
                    <Button disabled={uploading} asChild variant="outline" className="h-10 px-4 rounded-[1rem] border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50">
                        <label className="cursor-pointer flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            {uploading ? "Processing..." : "Upload"}
                            <input type="file" accept="audio/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                        </label>
                    </Button>
                </div>

                <div className="space-y-4">
                    {lead.transcriptions && lead.transcriptions.length > 0 ? (
                        lead.transcriptions.map((t: any, i: number) => (
                            <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                <div className="flex justify-between items-center mb-3">
                                    <p className="font-bold text-sm text-slate-500 uppercase tracking-wider">Analysis #{i + 1}</p>
                                    <span className={cn(
                                        "text-[10px] font-bold uppercase px-2 py-1 rounded-lg border",
                                        t.sentiment === 'positive' ? "bg-green-50 text-green-600 border-green-100" : "bg-slate-50 text-slate-600 border-slate-100"
                                    )}>
                                        {t.sentiment}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{t.summary}</p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-400 font-medium border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[1.5rem]">
                            No recordings processed yet. Upload an audio file to generate an AI summary.
                        </div>
                    )}
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
