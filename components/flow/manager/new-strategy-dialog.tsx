"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createCampaign } from "@/app/actions/campaigns";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
      router.push(`/flow/manager/${result.campaignId}?tab=strategy`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create strategy");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Strategy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Strategy</DialogTitle>
          <DialogDescription>
            Start a new campaign strategy for a client.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select 
              value={formData.clientId} 
              onValueChange={(val) => setFormData({...formData, clientId: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client._id} value={client._id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Strategy Title</Label>
            <Input 
              id="title" 
              placeholder="e.g. Q2 Brand Awareness" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Strategy
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
