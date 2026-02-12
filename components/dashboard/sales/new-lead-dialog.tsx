"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Building2, User, Mail, DollarSign, FileText, Loader2 } from "lucide-react";
import { createLead } from "@/app/actions/sales";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function NewLeadDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await createLead({
        companyName: formData.get("companyName") as string,
        contactName: formData.get("contactName") as string,
        email: formData.get("email") as string,
        value: Number(formData.get("value")) || 0,
        notes: formData.get("notes") as string,
      });
      toast.success("Lead created successfully");
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-14 px-8 rounded-[1.5rem] font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5">
          <Plus className="mr-2 h-5 w-5" />
          New Deal
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[3rem] p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-950 sm:max-w-[600px]">
        <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-8 border-b border-slate-100 dark:border-slate-800/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
            <DialogHeader>
                <DialogTitle className="text-3xl font-black text-slate-900 dark:text-slate-100">Add New Deal</DialogTitle>
                <DialogDescription className="text-base font-medium mt-1">
                    Create a new opportunity in your pipeline.
                </DialogDescription>
            </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Company</Label>
                    <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input id="companyName" name="companyName" required className="h-14 rounded-[1.2rem] pl-12 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="Acme Corp" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="value" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Est. Value</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input id="value" name="value" type="number" min="0" step="1000" className="h-14 rounded-[1.2rem] pl-12 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="50000" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="contactName" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Contact Person</Label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input id="contactName" name="contactName" className="h-14 rounded-[1.2rem] pl-12 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="John Doe" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Email</Label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input id="email" name="email" type="email" className="h-14 rounded-[1.2rem] pl-12 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="john@acme.com" />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Notes</Label>
                <div className="relative">
                    <FileText className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                    <Textarea id="notes" name="notes" className="min-h-[120px] rounded-[1.5rem] pl-12 pt-4 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none" placeholder="Initial requirements..." />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-14 px-6 rounded-[1.5rem] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800">
                    Cancel
                </Button>
                <Button type="submit" disabled={loading} className="h-14 px-8 rounded-[1.5rem] font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 min-w-[140px]">
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Create Deal"}
                </Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
