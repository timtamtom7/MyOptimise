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
import { Building2, User, Mail, DollarSign, Sparkles, Loader2, CheckCircle2 } from "lucide-react";

interface ConvertClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  onSuccess?: (leadId: string) => void;
}

export function ConvertClientDialog({ open, onOpenChange, leadId, leadName, onSuccess }: ConvertClientDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: leadName || "",
    contactName: "",
    email: "",
    monthlyValue: 0
  });

  // Reset form when dialog opens/closes or lead changes
  useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        businessName: leadName || ""
      }));
    }
  }, [open, leadName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) return;

    setLoading(true);
    try {
      await convertLeadToClient(leadId, formData);
      toast.success("Client converted successfully!", {
        description: "Welcome packet sent and account created."
      });
      onSuccess?.(leadId);
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
      <DialogContent className="rounded-[3rem] p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-950 sm:max-w-[600px]">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 px-8 py-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl pointer-events-none -translate-x-1/4 translate-y-1/4" />
            
            <DialogHeader className="relative z-10">
                <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30 shadow-xl">
                    <Sparkles className="h-8 w-8 text-white" />
                </div>
                <DialogTitle className="text-3xl font-black text-white">Convert to Client</DialogTitle>
                <DialogDescription className="text-emerald-100 text-base font-medium mt-2 max-w-[90%]">
                    This will create a new Client Account, generate a Stripe ID, and send the welcome packet to {leadName}.
                </DialogDescription>
            </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-6">
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Business Name</Label>
                    <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input 
                            value={formData.businessName} 
                            onChange={e => setFormData({...formData, businessName: e.target.value})}
                            className="h-14 rounded-[1.2rem] pl-12 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium"
                            required 
                            placeholder="Business Name"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Contact Person</Label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input 
                                value={formData.contactName} 
                                onChange={e => setFormData({...formData, contactName: e.target.value})}
                                className="h-14 rounded-[1.2rem] pl-12 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium"
                                required 
                                placeholder="John Doe"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Monthly Value</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input 
                                type="number"
                                value={formData.monthlyValue} 
                                onChange={e => setFormData({...formData, monthlyValue: Number(e.target.value)})}
                                className="h-14 rounded-[1.2rem] pl-12 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium"
                                required 
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Billing Email</Label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input 
                            type="email"
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="h-14 rounded-[1.2rem] pl-12 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all font-medium"
                            required 
                            placeholder="billing@company.com"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-14 px-6 rounded-[1.5rem] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800">
                    Cancel
                </Button>
                <Button type="submit" disabled={loading} className="h-14 px-8 rounded-[1.5rem] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 min-w-[160px]">
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <><CheckCircle2 className="mr-2 h-5 w-5" /> Convert Client</>}
                </Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
