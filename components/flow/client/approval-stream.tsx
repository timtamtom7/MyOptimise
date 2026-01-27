"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, ExternalLink, Play, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StrategyReviewSection } from "./strategy-review-section";

interface Deliverable {
  _id: string;
  title: string;
  status: string;
  type: string;
  platform: string;
  campaign: { title: string };
  versionHistory?: { versionNumber?: number; url: string; notes?: string; createdAt: string }[];
}

interface ApprovalStreamProps {
  user: { name: string; email: string };
  deliverables: Deliverable[];
  strategies?: any[];
  actions: {
    approve: (formData: FormData) => Promise<any>;
    reject: (formData: FormData) => Promise<any>;
  };
}

export function ApprovalStream({ user, deliverables, strategies, actions }: ApprovalStreamProps) {
  const [activeTab, setActiveTab] = useState("review");
  const [searchQuery, setSearchQuery] = useState("");

  const reviewItems = deliverables.filter(d => d.status === "client_review");
  const approvedItems = deliverables.filter(d => d.status === "approved" || d.status === "scheduled");
  const inProgressItems = deliverables.filter(d => ["drafting", "assigned", "internal_review", "changes_requested"].includes(d.status));

  const filteredReview = reviewItems.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredApproved = approvedItems.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4">
      <header className="mb-12">
        <h1 className="text-4xl font-display font-medium text-slate-900 dark:text-slate-50 mb-2">
          Approval Stream
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-sans">
          Review and approve your content.
        </p>
      </header>

      {strategies && strategies.length > 0 && (
          <StrategyReviewSection strategies={strategies} />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-0">
            <TabsList className="bg-transparent w-full md:w-auto justify-start rounded-none h-auto p-0">
                <TabTrigger value="review" label="To Review" count={reviewItems.length} highlight={reviewItems.length > 0} />
                <TabTrigger value="approved" label="Approved" count={approvedItems.length} />
                <TabTrigger value="progress" label="In Progress" count={inProgressItems.length} />
            </TabsList>
            
            {activeTab !== "progress" && (
                <div className="relative w-full md:w-64 mb-2 md:mb-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search items..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                </div>
            )}
        </div>

        <TabsContent value="review" className="space-y-6">
            {filteredReview.length === 0 ? (
                <EmptyState 
                    title="You're all caught up!" 
                    description="No items currently waiting for your approval." 
                    icon={CheckCircle}
                />
            ) : (
                <div className="grid gap-8">
                    {filteredReview.map(item => (
                        <ReviewCard key={item._id} item={item} actions={actions} />
                    ))}
                </div>
            )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-6">
             {filteredApproved.length === 0 ? (
                <EmptyState 
                    title="No approved items yet" 
                    description="Items you approve will appear here." 
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredApproved.map(item => (
                        <ApprovedCard key={item._id} item={item} />
                    ))}
                </div>
            )}
        </TabsContent>

        <TabsContent value="progress">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {inProgressItems.map(item => (
                    <ProgressCard key={item._id} item={item} />
                ))}
                 {inProgressItems.length === 0 && (
                     <div className="col-span-full">
                        <EmptyState title="No items in progress" description="Your team hasn't started any new tasks yet." />
                     </div>
                 )}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TabTrigger({ value, label, count, highlight }: { value: string, label: string, count?: number, highlight?: boolean }) {
    return (
        <TabsTrigger 
            value={value}
            className={cn(
                "rounded-none border-b-2 border-transparent px-4 py-3 font-medium text-slate-500 data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 transition-colors",
                highlight && "text-blue-600 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700"
            )}
        >
            {label}
            {count !== undefined && (
                <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 hover:bg-slate-200">
                    {count}
                </Badge>
            )}
        </TabsTrigger>
    )
}

function ReviewCard({ item, actions }: { item: Deliverable, actions: ApprovalStreamProps['actions'] }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    
    const latestVersion = item.versionHistory?.[item.versionHistory.length - 1];

    const handleApprove = async () => {
        if (!confirm("Are you sure you want to approve this deliverable?")) return;
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("deliverableId", item._id);
        try {
            await actions.approve(formData);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason) return;
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("deliverableId", item._id);
        formData.append("rejectionReason", rejectReason);
        try {
            await actions.reject(formData);
            setShowRejectDialog(false);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="grid md:grid-cols-5 gap-0">
                {/* Media Preview (Left) */}
                <div className="md:col-span-3 bg-slate-900 relative min-h-[300px] flex items-center justify-center group">
                    {latestVersion ? (
                         <div className="text-center p-6">
                            <p className="text-slate-400 mb-4 text-sm">Preview</p>
                            <Button asChild variant="secondary" className="bg-white/10 text-white hover:bg-white/20 border-white/20">
                                <a href={latestVersion.url} target="_blank" rel="noopener noreferrer">
                                    <Play className="w-4 h-4 mr-2" /> Open {item.type}
                                </a>
                            </Button>
                            {latestVersion.notes && (
                                <p className="mt-4 text-xs text-slate-500 max-w-xs mx-auto italic">
                                    &quot;{latestVersion.notes}&quot;
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-slate-500">No preview available</p>
                    )}
                </div>

                {/* Details & Actions (Right) */}
                <div className="md:col-span-2 p-6 flex flex-col justify-between bg-white dark:bg-slate-900">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <Badge variant="outline" className="mb-2 text-xs font-normal text-slate-500">
                                    {item.campaign.title}
                                </Badge>
                                <h3 className="text-xl font-display font-medium text-slate-900 dark:text-slate-50">
                                    {item.title}
                                </h3>
                            </div>
                        </div>
                        
                        <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                                <span>Platform</span>
                                <span className="font-medium text-slate-900 dark:text-slate-50 capitalize">{item.platform}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                                <span>Type</span>
                                <span className="font-medium text-slate-900 dark:text-slate-50 capitalize">{item.type}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                                <span>Version</span>
                                <span className="font-medium text-slate-900 dark:text-slate-50">v{latestVersion?.versionNumber || 1}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 space-y-3">
                        <Button 
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleApprove}
                            disabled={isSubmitting}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" /> Approve Content
                        </Button>
                        <Button 
                            variant="outline" 
                            className="w-full border-slate-200 hover:bg-slate-50 text-slate-700"
                            onClick={() => setShowRejectDialog(true)}
                            disabled={isSubmitting}
                        >
                            <XCircle className="w-4 h-4 mr-2" /> Request Changes
                        </Button>
                    </div>
                </div>
            </div>

            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Changes</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            placeholder="Please explain what needs to be changed..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleReject}
                            disabled={!rejectReason || isSubmitting}
                        >
                            Submit Request
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

function ApprovedCard({ item }: { item: Deliverable }) {
    const latestVersion = item.versionHistory?.[item.versionHistory.length - 1];
    return (
        <Card className="group hover:shadow-md transition-all duration-200 border-slate-200">
            <CardHeader className="p-4 pb-2">
                 <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-xs font-normal text-emerald-600 border-emerald-100 bg-emerald-50">
                        Approved
                    </Badge>
                </div>
                <h4 className="font-medium text-slate-900 mt-2 line-clamp-2">{item.title}</h4>
                <p className="text-xs text-slate-500">{item.campaign.title}</p>
            </CardHeader>
             <CardContent className="p-4 pt-2 mt-2">
                 {latestVersion && (
                     <Button asChild variant="secondary" size="sm" className="w-full">
                         <a href={latestVersion.url} target="_blank">
                             <ExternalLink className="w-3 h-3 mr-2" /> View Asset
                         </a>
                     </Button>
                 )}
             </CardContent>
        </Card>
    )
}

function ProgressCard({ item }: { item: Deliverable }) {
    return (
        <Card className="border-slate-200 bg-slate-50/50">
            <CardHeader className="p-4 pb-2">
                 <div className="flex justify-between items-start">
                    <Badge variant="outline" className="text-xs font-normal text-slate-500 border-slate-200 bg-white">
                        {item.status.replace("_", " ")}
                    </Badge>
                </div>
                <h4 className="font-medium text-slate-900 mt-2 line-clamp-2">{item.title}</h4>
                <p className="text-xs text-slate-500">{item.campaign.title}</p>
            </CardHeader>
        </Card>
    )
}

function EmptyState({ title, description, icon: Icon }: { title: string, description: string, icon?: any }) {
    return (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
            {Icon && <Icon className="w-12 h-12 mx-auto text-slate-300 mb-4" />}
            <h3 className="text-lg font-medium text-slate-900 mb-1">{title}</h3>
            <p className="text-slate-500">{description}</p>
        </div>
    )
}
