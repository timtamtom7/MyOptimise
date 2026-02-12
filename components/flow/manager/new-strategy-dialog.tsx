"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCampaign } from "@/app/actions/campaigns";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Client {
  _id: string;
  name: string;
  avatar?: any;
}

interface NewStrategyDialogProps {
  clients: Client[];
  managerId: string;
  defaultClientId?: string;
}

export function NewStrategyDialog({ clients, managerId, defaultClientId }: NewStrategyDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    clientId: defaultClientId || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.clientId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createCampaign({
        title: formData.title,
        clientId: formData.clientId,
        managerId,
        description: ""
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success("Strategy created successfully");
      setOpen(false);
      // Redirect to the new campaign's strategy tab
      router.push(`/dashboard/manager/strategy/${result.campaignId}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create strategy");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ size: "default" }), "h-14 rounded-[2rem] px-8 font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all")}>
          <Plus className="w-5 h-5 mr-2" />
          New Strategy
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-950">
        <div className="bg-slate-50 dark:bg-slate-900/50 px-10 py-10 pb-8 border-b border-slate-100 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Create New Strategy</DialogTitle>
            <DialogDescription className="text-lg text-slate-500 font-medium mt-2">
              Start a new campaign strategy for a client.
            </DialogDescription>
          </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 pt-8 space-y-8">
          <div className="space-y-3">
            <Label htmlFor="client" className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">Client</Label>
            <Select 
              value={formData.clientId} 
              onValueChange={(val) => setFormData({...formData, clientId: val})}
            >
              <SelectTrigger className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium px-6 text-lg">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent className="rounded-[2rem] p-3 shadow-2xl">
                {clients.map((client) => (
                  <SelectItem key={client._id} value={client._id} className="rounded-2xl py-4 px-4 cursor-pointer font-medium text-base mb-1">
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="title" className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">Campaign Title</Label>
            <Input
              id="title"
              placeholder="e.g. Q4 Brand Awareness"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium px-6 text-lg"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-16 rounded-[2rem] px-8 font-bold text-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="h-16 rounded-[2rem] px-10 font-bold text-lg shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Create Strategy
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
