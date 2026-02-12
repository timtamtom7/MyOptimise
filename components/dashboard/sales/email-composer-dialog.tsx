"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Send, Loader2, Type } from "lucide-react";

interface EmailComposerDialogProps {
  lead: {
    companyName: string;
    contactName?: string;
    email?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEMPLATE = `Hi {name},

I noticed that {company} is doing great work in...

I'd love to connect and discuss how we can help you scale...

Best,
[Your Name]`;

export function EmailComposerDialog({ lead, open, onOpenChange }: EmailComposerDialogProps) {
  const [subject, setSubject] = useState("Quick question");
  const [body, setBody] = useState(() => {
    if (!lead) return "";
    return TEMPLATE
      .replace("{name}", lead.contactName || "there")
      .replace("{company}", lead.companyName || "your company");
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate sending
    await new Promise(r => setTimeout(r, 1000));
    toast.success("Email sent!");
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[3rem] p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-950 sm:max-w-[600px]">
        <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-8 border-b border-slate-100 dark:border-slate-800/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
            <DialogHeader>
                <DialogTitle className="text-3xl font-black text-slate-900 dark:text-slate-100">Compose Email</DialogTitle>
            </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">To</Label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input value={lead?.email || ""} disabled className="h-14 rounded-[1.2rem] pl-12 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/30 text-slate-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Subject</Label>
                    <div className="relative">
                        <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input 
                            value={subject} 
                            onChange={e => setSubject(e.target.value)} 
                            className="h-14 rounded-[1.2rem] pl-12 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium" 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Message</Label>
                    <Textarea 
                        value={body} 
                        onChange={e => setBody(e.target.value)} 
                        className="min-h-[250px] rounded-[1.5rem] p-6 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium leading-relaxed resize-none" 
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-14 px-6 rounded-[1.5rem] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800">
                    Cancel
                </Button>
                <Button type="submit" disabled={loading} className="h-14 px-8 rounded-[1.5rem] font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 min-w-[140px]">
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <><Send className="mr-2 h-5 w-5" /> Send Email</>}
                </Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
