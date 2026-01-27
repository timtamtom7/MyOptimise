"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { createContentItem } from "@/app/actions/content";
import { formatDate } from "@/lib/date-formatting";
import Image from "next/image";

interface CreatePostDialogProps {
  clientId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultDate?: Date;
  trigger?: React.ReactNode | null;
  targetTimezone?: string;
}

export function CreatePostDialog({ clientId, open, onOpenChange, defaultDate, trigger, targetTimezone }: CreatePostDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>("");

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append("clientId", clientId);
      
      await createContentItem(formData);
      
      toast.success("Post created successfully");
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {typeof trigger === "object" && trigger !== null && "props" in (trigger as any) ? (
            trigger as React.ReactElement
          ) : (
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Post
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Draft a new social media post. You can schedule it now or save it as a draft.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Internal Title</Label>
            <Input id="title" name="title" placeholder="e.g. Summer Campaign Launch" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Platform</Label>
              <Select name="platform" defaultValue="instagram" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="youtube_shorts">YouTube Shorts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="postType">Type</Label>
              <Select name="postType" defaultValue="post" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Feed Post</SelectItem>
                  <SelectItem value="reel">Reel / Video</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Schedule (Optional)</Label>
            <Input 
              id="scheduledAt" 
              name="scheduledAt" 
              type="datetime-local" 
              defaultValue={defaultDate ? formatDate(defaultDate, "yyyy-MM-dd'T'HH:mm") : ""}
            />
            {targetTimezone && (
              <p className="text-xs text-muted-foreground">
                Target timezone: {targetTimezone}. This input uses your browser local time.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea 
              id="caption" 
              name="caption" 
              placeholder="Write your caption here..." 
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Media Asset</Label>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Input 
                id="file" 
                name="file" 
                type="file" 
                accept="image/*,video/*" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setPreviewUrl(url);
                    setFileType(file.type);
                  } else {
                    setPreviewUrl(null);
                    setFileType("");
                  }
                }}
              />
            </div>
            {previewUrl && (
              <div className="mt-2 relative aspect-video bg-muted rounded-md overflow-hidden border">
                 {fileType.startsWith("video/") ? (
                   <video src={previewUrl} controls className="w-full h-full object-contain" />
                 ) : (
                   <Image src={previewUrl} alt="Preview" fill className="object-contain" />
                 )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating..." : "Create Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
