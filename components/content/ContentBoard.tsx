"use client";

import { useState } from "react";
import { useCapabilities } from "@/hooks/use-capabilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { InstagramPreview } from "./previews/InstagramPreview";
import { TikTokPreview } from "./previews/TikTokPreview";
import { urlFor } from "@/sanity/lib/image";
import { generateApprovalLink } from "@/app/actions/content";
import { toast } from "sonner";
import { Link as LinkIcon, Copy, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { getOrCreateThreadForDocument } from "@/app/actions/messages";

type ContentItem = {
  _id: string;
  title: string;
  platform: string;
  status: string;
  scheduledAt?: string;
  caption?: string;
  media?: any[];
  client?: { _id: string; businessName?: string; name?: string };
};

interface ContentBoardProps {
  items: ContentItem[];
}

const COLUMNS = [
  { id: "draft", label: "Drafts" },
  { id: "internal_review", label: "Internal Review" },
  { id: "client_review", label: "Client Review" },
  { id: "scheduled", label: "Scheduled" },
  { id: "published", label: "Published" },
];

export function ContentBoard({ items }: ContentBoardProps) {
  const { hasCapability } = useCapabilities();
  const canCreate = hasCapability("content.create");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDiscuss = async () => {
    if (!selectedItem) return;
    try {
        setLoading(true);
        const threadId = await getOrCreateThreadForDocument(
            selectedItem._id,
            "contentItem",
            selectedItem.title,
            selectedItem.client?._id || ""
        );
        if (threadId) {
            router.push(`/dashboard/employee/messages/${threadId}`);
        }
    } catch (e) {
        toast.error("Failed to start discussion");
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const getImageUrl = (item: ContentItem) => {
    if (!item.media || item.media.length === 0) return undefined;
    try {
      return urlFor(item.media[0]).url();
    } catch (e) {
      console.error("Error generating image URL", e);
      return undefined;
    }
  };

  const handleGenerateLink = async () => {
    if (!selectedItem) return;
    try {
        const path = await generateApprovalLink(selectedItem._id);
        const fullUrl = `${window.location.origin}${path}`;
        await navigator.clipboard.writeText(fullUrl);
        toast.success("Approval link copied to clipboard!");
    } catch (e) {
        toast.error("Failed to generate link");
        console.error(e);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex justify-between items-center">
        <p className="text-muted-foreground">Manage your content pipeline.</p>
        {canCreate && (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Content
          </Button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {COLUMNS.map((col) => {
          const colItems = items.filter((i) => i.status === col.id);
          return (
            <div
              key={col.id}
              className="min-w-[300px] w-[300px] flex flex-col bg-muted/50 rounded-lg p-4"
            >
              <h3 className="font-semibold mb-3 flex items-center justify-between">
                {col.label}
                <Badge variant="secondary">{colItems.length}</Badge>
              </h3>
              <div className="flex flex-col gap-3 overflow-y-auto">
                {colItems.map((item) => (
                  <Card
                    key={item._id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedItem(item)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium leading-tight">
                          {item.title}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] uppercase">
                          {item.platform}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      {item.scheduledAt && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.scheduledAt).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {colItems.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed rounded-md">
                    No items
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Content Preview</SheetTitle>
            <SheetDescription>
              Review how this content will appear on the platform.
            </SheetDescription>
          </SheetHeader>
          
          {selectedItem && (
            <div className="flex flex-col gap-6">
               <div className="flex justify-center bg-gray-50 p-6 rounded-xl border border-dashed">
                  {selectedItem.platform === "instagram" ? (
                    <InstagramPreview 
                        image={getImageUrl(selectedItem)}
                        caption={selectedItem.caption}
                    />
                  ) : selectedItem.platform === "tiktok" ? (
                    <TikTokPreview 
                        image={getImageUrl(selectedItem)}
                        caption={selectedItem.caption}
                    />
                  ) : (
                    <div className="text-center p-8 text-muted-foreground">
                        Preview not available for {selectedItem.platform}
                    </div>
                  )}
               </div>
               
               <div className="space-y-4">
                  <div>
                      <h4 className="text-sm font-medium mb-1">Internal Title</h4>
                      <p className="text-sm text-muted-foreground">{selectedItem.title}</p>
                  </div>
                  <div>
                      <h4 className="text-sm font-medium mb-1">Status</h4>
                      <Badge>{selectedItem.status}</Badge>
                  </div>
                  {selectedItem.scheduledAt && (
                      <div>
                          <h4 className="text-sm font-medium mb-1">Scheduled For</h4>
                          <p className="text-sm text-muted-foreground">{new Date(selectedItem.scheduledAt).toLocaleString()}</p>
                      </div>
                  )}
               </div>

               <div className="pt-4 border-t mt-4 flex gap-2">
                    <Button onClick={handleGenerateLink} className="flex-1" variant="outline">
                        <LinkIcon className="mr-2 h-4 w-4" /> Copy Approval Link
                    </Button>
                    <Button onClick={handleDiscuss} className="flex-1" variant="secondary">
                        <MessageSquare className="mr-2 h-4 w-4" /> Discuss
                    </Button>
               </div>
               <p className="text-xs text-muted-foreground text-center mt-2">
                    Share this link with the client for one-click approval.
               </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
