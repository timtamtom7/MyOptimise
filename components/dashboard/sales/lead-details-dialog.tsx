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
import { FileAudio } from "lucide-react";
import { processCallRecording } from "@/app/actions/sales"; 

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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{lead.companyName}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Contact</Label>
              <div className="text-sm font-medium">{lead.contactName || "-"}</div>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Email</Label>
              <div className="text-sm font-medium">{lead.email || "-"}</div>
            </div>
             <div>
              <Label className="text-muted-foreground text-xs">Value</Label>
              <div className="text-sm font-medium">${lead.value?.toLocaleString() || "0"}</div>
            </div>
             <div>
              <Label className="text-muted-foreground text-xs">Status</Label>
              <div className="text-sm font-medium capitalize">{lead.status}</div>
            </div>
          </div>
          
          <div className="border-t pt-4 mt-2">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <FileAudio className="h-4 w-4" />
              Call Recordings & AI Analysis
            </h3>
            
            <div className="flex items-center gap-3">
                <Button disabled={uploading} asChild variant="secondary" className="w-full sm:w-auto">
                    <label className="cursor-pointer">
                        {uploading ? "Processing with Whisper..." : "Upload Recording"}
                        <input type="file" accept="audio/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                </Button>
                <span className="text-xs text-muted-foreground">MP3, WAV, M4A (Max 25MB)</span>
            </div>

            {lead.transcriptions && lead.transcriptions.length > 0 && (
              <div className="mt-4 space-y-3">
                {lead.transcriptions.map((t: any, i: number) => (
                  <div key={i} className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap text-muted-foreground">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-foreground text-xs">Analysis #{i + 1}</p>
                      <span className="text-[10px] uppercase border px-1 rounded">{t.sentiment}</span>
                    </div>
                    <p className="mb-2">{t.summary}</p>
                    {t.actionItems && t.actionItems.length > 0 && (
                      <div className="bg-background/50 p-2 rounded">
                        <p className="text-xs font-medium mb-1">Action Items:</p>
                        <ul className="list-disc list-inside text-xs">
                          {t.actionItems.map((item: string, k: number) => (
                            <li key={k}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
