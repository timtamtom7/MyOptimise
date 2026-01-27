"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { createDeliverable } from "@/app/actions/deliverables";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NewBriefDialogProps {
  campaignId: string;
  strategyDeck?: any;
}

export function NewBriefDialog({ campaignId, strategyDeck }: NewBriefDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.append("campaignId", campaignId);
      
      const result = await createDeliverable(formData);
      
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Brief created successfully");
        setOpen(false);
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to create brief");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 text-white hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-2" /> New Brief
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Brief</DialogTitle>
          <DialogDescription>
            Define the requirements for this deliverable. Be specific to ensure the editor has everything they need.
          </DialogDescription>
        </DialogHeader>

        {strategyDeck && strategyDeck.status === 'approved' && (
             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-800">
                 <p className="font-semibold mb-1">Aligned with Strategy:</p>
                 <ul className="list-disc pl-5 space-y-1">
                     <li>Refer to the <strong>Approved Strategy Deck</strong> for visual direction.</li>
                     {strategyDeck.moodboard && strategyDeck.moodboard.length > 0 && (
                         <li>Moodboard has {strategyDeck.moodboard.length} approved items.</li>
                     )}
                 </ul>
             </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g. Product Showcase Reel" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue="reel">
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reel">Reel / TikTok</SelectItem>
                  <SelectItem value="story">Story Set</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="static">Static Post</SelectItem>
                  <SelectItem value="video_long">Long Form Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" name="dueDate" type="date" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hook">Hook / Opening</Label>
            <Textarea 
              id="hook" 
              name="hook" 
              placeholder="What happens in the first 3 seconds?" 
              className="h-20"
              required 
            />
            <p className="text-xs text-slate-500">Crucial for grabbing attention.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="script">Script / Key Points</Label>
            <Textarea 
              id="script" 
              name="script" 
              placeholder="Full script or bullet points of what needs to be said/shown." 
              className="h-32"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="visualDirection">Visual Direction</Label>
            <Textarea 
              id="visualDirection" 
              name="visualDirection" 
              placeholder="Camera angles, B-roll, style, text overlays..." 
              className="h-24"
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="creativeGoal">Creative Goal</Label>
                <Input id="creativeGoal" name="creativeGoal" placeholder="e.g. Drive clicks to bio" required />
             </div>
             <div className="space-y-2">
                <Label htmlFor="contentConcept">Concept / Angle</Label>
                <Input id="contentConcept" name="contentConcept" placeholder="e.g. Educational / How-to" required />
             </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assets">Assets (Optional)</Label>
            <Input id="assets" name="assets" type="file" multiple className="cursor-pointer" />
            <p className="text-xs text-slate-500">Upload raw footage, images, or reference files.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-slate-900 text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Brief
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
