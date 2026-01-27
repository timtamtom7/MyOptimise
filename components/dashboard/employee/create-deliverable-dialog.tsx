"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Upload } from "lucide-react";
import { createDeliverable } from "@/app/actions/deliverables";
import { toast } from "sonner";

interface CreateDeliverableDialogProps {
  clientId: string;
  activeCampaigns: any[];
  brandAssets?: any[];
}

export function CreateDeliverableDialog({ clientId, activeCampaigns, brandAssets }: CreateDeliverableDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    // Append selected existing asset IDs
    if (selectedAssets.length > 0) {
        formData.append("existingAssetIds", JSON.stringify(selectedAssets));
    }

    try {
      const res = await createDeliverable(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Deliverable created successfully");
        setOpen(false);
        setSelectedAssets([]); // Reset selection
      }
    } catch (error) {
      toast.error("Failed to create deliverable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Deliverable
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Deliverable</DialogTitle>
          <DialogDescription>
            Create a new deliverable brief and assign it to a campaign.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-6 py-4">
          <input type="hidden" name="clientId" value={clientId} />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g. Q3 Brand Reel" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaignId">Campaign</Label>
              <Select name="campaignId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  {activeCampaigns.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Format</Label>
              <Select name="type" defaultValue="reel">
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="static_post">Static Post</SelectItem>
                  <SelectItem value="video_long">Video (Long form)</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select name="platform" defaultValue="instagram">
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" name="dueDate" type="date" />
          </div>

          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium">Brief Details</h4>
            
            <div className="space-y-2">
              <Label htmlFor="creativeGoal">Creative Goal</Label>
              <Textarea id="creativeGoal" name="creativeGoal" placeholder="What is the main objective?" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hook">Hook / Angle</Label>
                <Input id="hook" name="hook" placeholder="Opening hook..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visualDirection">Visual Direction</Label>
                <Input id="visualDirection" name="visualDirection" placeholder="Style, mood..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="script">Script / Outline</Label>
              <Textarea id="script" name="script" placeholder="Detailed script or content outline..." className="min-h-[100px]" />
            </div>

            {brandAssets && brandAssets.length > 0 && (
              <div className="space-y-2">
                <Label>Select Existing Brand Assets</Label>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-4 max-h-40 overflow-y-auto">
                  {brandAssets.map((asset) => (
                    <div key={asset._key} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`asset-${asset._key}`}
                        checked={selectedAssets.includes(asset._key)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedAssets([...selectedAssets, asset._key]);
                          else setSelectedAssets(selectedAssets.filter(id => id !== asset._key));
                        }}
                      />
                      <Label htmlFor={`asset-${asset._key}`} className="text-sm truncate cursor-pointer font-normal" title={asset.name || asset.title || asset.originalFilename}>
                        {asset.name || asset.title || asset.originalFilename || "Untitled Asset"}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

             <div className="space-y-2">
              <Label htmlFor="assets">Upload New Reference Assets</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                <Input
                  id="assets"
                  name="assets"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    // Optional: show selected file names
                  }}
                />
                <Label htmlFor="assets" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload images, videos, or docs
                  </span>
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Deliverable
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
