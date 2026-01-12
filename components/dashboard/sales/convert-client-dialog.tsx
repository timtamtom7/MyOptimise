"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { convertLeadToClient } from "@/app/actions/sales";

interface ConvertClientDialogProps {
  lead: {
    _id: string;
    companyName: string;
    contactName?: string;
    email?: string;
    value?: number;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (leadId: string) => void;
}

export function ConvertClientDialog({ lead, open, onOpenChange, onSuccess }: ConvertClientDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    contactName: "",
    email: "",
    monthlyValue: 0
  });

  useEffect(() => {
    if (lead && open) {
      setFormData({
        businessName: lead.companyName || "",
        contactName: lead.contactName || "",
        email: lead.email || "",
        monthlyValue: lead.value || 0
      });
    }
  }, [lead, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setLoading(true);
    try {
      await convertLeadToClient(lead._id, formData);
      toast.success("Client converted successfully!", {
        description: "Welcome packet sent and account created."
      });
      onSuccess?.(lead._id);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to convert client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Convert to Client</DialogTitle>
          <DialogDescription>
            This will create a new Client Account, generate a Stripe ID, and send the welcome packet.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Business</Label>
              <Input 
                value={formData.businessName} 
                onChange={e => setFormData({...formData, businessName: e.target.value})}
                className="col-span-3"
                required 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Contact</Label>
              <Input 
                value={formData.contactName} 
                onChange={e => setFormData({...formData, contactName: e.target.value})}
                className="col-span-3"
                required 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Email</Label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="col-span-3"
                required 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Value ($/mo)</Label>
              <Input 
                type="number"
                value={formData.monthlyValue} 
                onChange={e => setFormData({...formData, monthlyValue: Number(e.target.value)})}
                className="col-span-3"
                required 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
              {loading ? "Onboarding..." : "Confirm & Onboard"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
