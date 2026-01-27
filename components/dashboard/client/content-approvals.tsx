"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { InstagramPreview } from "@/components/content/previews/InstagramPreview";
import { TikTokPreview } from "@/components/content/previews/TikTokPreview";
import { urlFor } from "@/sanity/lib/image";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";

type ContentItem = {
  _id: string;
  title: string;
  platform: string;
  status: string;
  scheduledAt?: string;
  caption?: string;
  media?: any[];
  client?: {
    name?: string;
    logo?: any;
    timezone?: string;
  };
};

interface ContentApprovalsProps {
  items: ContentItem[];
  onApprove: (id: string, comment?: string) => Promise<void>;
  onReject: (id: string, comment: string) => Promise<void>;
}

export function ContentApprovals({ items, onApprove, onReject }: ContentApprovalsProps) {
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [comment, setComment] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const pendingItems = items.filter(i => i.status === "client_review");

  const getImageUrl = (item: ContentItem) => {
    if (!item.media || item.media.length === 0) return undefined;
    try {
      return urlFor(item.media[0]).url();
    } catch (e) {
      console.error("Error generating image URL", e);
      return undefined;
    }
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedItem) return;
    
    if (action === 'reject') {
        if (!isRejecting) {
            setIsRejecting(true);
            return;
        }
        await onReject(selectedItem._id, comment);
        toast.info("Content rejected. Feedback sent to team.");
    } else {
        await onApprove(selectedItem._id, comment);
        toast.success("Content approved and scheduled!");
    }
    
    setSelectedItem(null);
    setComment("");
    setIsRejecting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Pending Approvals</h2>
        <p className="text-muted-foreground">
          Review and approve content scheduled for your social channels.
        </p>
      </div>

      {pendingItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/50">
          <div className="rounded-full bg-muted p-4 mb-4">
             <Check className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">All caught up!</h3>
          <p className="text-muted-foreground max-w-sm mt-2">
            There is no content waiting for your review at the moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pendingItems.map((item) => (
            <Card key={item._id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted relative group cursor-pointer" onClick={() => setSelectedItem(item)}>
                 {getImageUrl(item) ? (
                    <Image 
                      src={getImageUrl(item)!} 
                      alt={item.title} 
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                 ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        No Preview
                    </div>
                 )}
                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button variant="secondary" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" /> Review
                    </Button>
                 </div>
                 <Badge className="absolute top-2 right-2 uppercase text-[10px]" variant="secondary">
                    {item.platform}
                 </Badge>
              </div>
              <CardHeader className="p-4">
                <CardTitle className="text-base line-clamp-1">{item.title}</CardTitle>
                <CardDescription>
                    {item.scheduledAt 
                        ? `Scheduled for ${new Date(item.scheduledAt).toLocaleDateString()}` 
                        : "Unscheduled"}
                </CardDescription>
              </CardHeader>
              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button className="flex-1" onClick={() => setSelectedItem(item)}>
                    Review
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={!!selectedItem} onOpenChange={(open) => {
        if (!open) {
            setSelectedItem(null);
            setIsRejecting(false);
            setComment("");
        }
      }}>
        <SheetContent className="sm:max-w-xl overflow-y-auto w-full">
          <SheetHeader className="mb-6">
            <SheetTitle>Review Content</SheetTitle>
          <SheetDescription className="block">
            <span className="block mt-2">
              {selectedItem?.platform} post
              {selectedItem?.scheduledAt && (
                  <span className="text-xs mt-2 grid grid-cols-1 gap-1 border-l-2 border-primary/20 pl-3">
                      <span className="block">
                      <span className="mr-2 text-muted-foreground">Local:</span>
                      <span className="font-medium">{new Date(selectedItem.scheduledAt).toLocaleString()}</span>
                      </span>
                      {selectedItem.client?.timezone && (
                      <span className="block">
                          <span className="mr-2 text-muted-foreground">Target ({selectedItem.client.timezone}):</span>
                          <span className="font-medium">{new Date(selectedItem.scheduledAt).toLocaleString("en-US", { timeZone: selectedItem.client.timezone })}</span>
                      </span>
                      )}
                      <span className="block">
                      <span className="mr-2 text-muted-foreground">UTC:</span>
                      <span className="font-medium">{new Date(selectedItem.scheduledAt).toLocaleString("en-GB", { timeZone: "UTC" })}</span>
                      </span>
                  </span>
              )}
            </span>
          </SheetDescription>
          </SheetHeader>
          
          {selectedItem && (
            <div className="flex flex-col gap-6">
               {/* Preview Area */}
               <div className="flex justify-center bg-gray-50 p-4 md:p-6 rounded-xl border border-dashed min-h-[300px] md:min-h-[400px] items-center">
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
               
               {/* Approval Actions */}
               <div className="bg-card border rounded-lg p-4 space-y-4 shadow-sm">
                  <h3 className="font-semibold text-sm">Decision</h3>
                  
                  {isRejecting ? (
                      <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                          <div className="space-y-1">
                              <Label htmlFor="comment">Reason for rejection</Label>
                              <Textarea 
                                id="comment" 
                                placeholder="Please let us know what needs to be changed..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="min-h-[100px]"
                              />
                          </div>
                          <div className="flex gap-2">
                              <Button variant="outline" onClick={() => setIsRejecting(false)} className="flex-1">
                                  Cancel
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={() => handleAction('reject')}
                                disabled={!comment.trim()}
                                className="flex-1"
                              >
                                  Submit Rejection
                              </Button>
                          </div>
                      </div>
                  ) : (
                      <div className="flex gap-3">
                          <Button 
                            variant="outline" 
                            className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                            onClick={() => handleAction('reject')}
                          >
                              <X className="mr-2 h-4 w-4" /> Request Changes
                          </Button>
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleAction('approve')}
                          >
                              <Check className="mr-2 h-4 w-4" /> Approve
                          </Button>
                      </div>
                  )}
               </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
