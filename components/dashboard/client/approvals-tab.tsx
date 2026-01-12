"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, FileText, Activity } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Deliverable {
  _id: string;
  title: string;
  status: string;
  type: string;
  versionHistory?: any[];
  campaign?: { title: string };
  latestAsset?: {
    url: string;
    mimeType: string;
    originalFilename?: string;
  };
}

interface ApprovalsTabProps {
  deliverables: Deliverable[];
  actions: {
    approve: (formData: FormData) => Promise<void>;
    reject: (formData: FormData) => Promise<void>;
  };
}

export function ApprovalsTab({ deliverables, actions }: ApprovalsTabProps) {
  const pendingReviews = deliverables.filter(d => d.status === "client_review");
  const otherDeliverables = deliverables.filter(d => d.status !== "client_review");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-medium">Pending Approval ({pendingReviews.length})</h3>
        {pendingReviews.length === 0 && (
          <p className="text-muted-foreground text-sm">You&apos;re all caught up! No items waiting for your approval.</p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {pendingReviews.map((item) => (
            <Card key={item._id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription>{item.campaign?.title || "No Campaign"}</CardDescription>
                  </div>
                  <Badge>{item.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Asset Preview */}
                <div className="rounded-lg border bg-muted/10 overflow-hidden">
                  {item.latestAsset?.mimeType?.startsWith('image/') ? (
                    <img 
                      src={item.latestAsset.url} 
                      alt={item.title}
                      className="w-full h-48 object-contain bg-white" 
                    />
                  ) : item.latestAsset?.mimeType?.startsWith('video/') ? (
                    <video 
                      src={item.latestAsset.url} 
                      controls 
                      className="w-full h-48 bg-black"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 p-4">
                      <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground text-center">
                        {item.latestAsset?.originalFilename || "No preview available"}
                      </p>
                    </div>
                  )}
                </div>

                {item.latestAsset?.url && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 justify-center">
                     <a 
                       href={item.latestAsset.url} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="flex items-center gap-2 hover:underline"
                     >
                       <FileText className="h-4 w-4" />
                       View Original File
                     </a>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                   <form action={actions.approve}>
                     <input type="hidden" name="deliverableId" value={item._id} />
                     <Button type="submit" size="sm" className="bg-green-600 hover:bg-green-700">
                       <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                     </Button>
                   </form>
                   
                   <Dialog>
                     <DialogTrigger asChild>
                       <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                         <XCircle className="mr-2 h-4 w-4" /> Request Changes
                       </Button>
                     </DialogTrigger>
                     <DialogContent>
                       <DialogHeader>
                         <DialogTitle>Request Changes</DialogTitle>
                         <DialogDescription>
                           Please describe what needs to be changed for {item.title}.
                         </DialogDescription>
                       </DialogHeader>
                       <form action={actions.reject}>
                         <input type="hidden" name="deliverableId" value={item._id} />
                         <div className="space-y-4 py-4">
                           <div className="space-y-2">
                             <Label htmlFor="notes">Feedback</Label>
                             <Textarea id="notes" name="notes" placeholder="Detailed feedback..." required />
                           </div>
                         </div>
                         <DialogFooter>
                           <Button type="submit" variant="destructive">Submit Feedback</Button>
                         </DialogFooter>
                       </form>
                     </DialogContent>
                   </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {otherDeliverables.length > 0 && (
        <div className="flex flex-col gap-4 pt-6 border-t">
          <h3 className="text-lg font-medium">Recent Activity</h3>
          <div className="space-y-2">
            {otherDeliverables.map((item) => (
               <div key={item._id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${item.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {item.status === 'approved' ? <CheckCircle2 className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-xs text-muted-foreground capitalize">{item.status.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <Badge variant="outline">{item.type}</Badge>
               </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
