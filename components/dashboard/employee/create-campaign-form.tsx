"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createCampaign } from "@/app/actions/campaigns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

interface CreateCampaignFormProps {
  clientId: string;
  clientName: string;
}

export function CreateCampaignForm({ clientId, clientName }: CreateCampaignFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const res = await createCampaign(formData);
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.success && res.campaignId) {
        toast.success("Campaign created successfully");
        router.push(`/dashboard/employee/campaigns/${res.campaignId}`);
      }
    } catch (error) {
      toast.error("Failed to create campaign");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Campaign for {clientName}</CardTitle>
      </CardHeader>
      <form action={handleSubmit}>
        <input type="hidden" name="clientId" value={clientId} />
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Campaign Title</Label>
            <Input id="title" name="title" placeholder="e.g. Q3 Brand Awareness" required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" placeholder="Brief overview of the campaign..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" name="startDate" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date (Optional)</Label>
              <Input id="endDate" name="endDate" type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objectives">Objectives</Label>
            <Textarea id="objectives" name="objectives" placeholder="What are the main goals?" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kpis">KPIs</Label>
            <Input id="kpis" name="kpis" placeholder="e.g. 10k Reach, 50 Leads" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Campaign
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
