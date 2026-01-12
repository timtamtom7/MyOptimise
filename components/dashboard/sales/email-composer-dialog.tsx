"use client";

import { useState, useEffect } from "react";
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
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lead && open) {
        const filledBody = TEMPLATE
            .replace("{name}", lead.contactName || "there")
            .replace("{company}", lead.companyName || "your company");
        setBody(filledBody);
    }
  }, [lead, open]);

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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">To</Label>
              <Input value={lead?.email || ""} disabled className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Subject</Label>
              <Input 
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                className="col-span-3" 
              />
            </div>
            <div className="gap-2">
              <Label>Message</Label>
              <Textarea 
                value={body} 
                onChange={e => setBody(e.target.value)} 
                className="min-h-[200px] mt-2 font-mono text-sm" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
