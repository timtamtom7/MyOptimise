"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, ExternalLink, Play, Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
        <div className="container max-w-5xl mx-auto py-16 px-6">
            <header className="mb-16">
                <h1 className="text-5xl font-display font-medium text-foreground mb-3 tracking-tight">
                    The Stream
                </h1>
                <p className="text-muted-foreground text-lg font-sans max-w-md leading-relaxed font-normal">
                    Review your upcoming content deliverables and provide feedback or approval.
                </p>
            </header>

            {strategies && strategies.length > 0 && (
                <StrategyReviewSection strategies={strategies} />
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 dark:border-slate-900 pb-0">
                    <TabsList className="bg-transparent w-full md:w-auto justify-start rounded-none h-auto p-0 gap-8">
                        <TabTrigger value="review" label="Review" count={reviewItems.length} highlight={reviewItems.length > 0} />
                        <TabTrigger value="approved" label="Approved" count={approvedItems.length} />
                        <TabTrigger value="progress" label="In Transit" count={inProgressItems.length} />
                    </TabsList>

                    {activeTab !== "progress" && (
                        <div className="relative w-full md:w-64 mb-4 md:mb-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm bg-transparent border-none rounded-none focus:outline-none focus:ring-0 placeholder:text-slate-400"
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
                "rounded-none border-b-2 border-transparent px-0 py-4 font-medium text-muted-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground text-sm uppercase tracking-[0.15em] shadow-none transition-all",
                highlight && "text-foreground font-bold"
            )}
        >
            {label}
            {count !== undefined && count > 0 && (
                <span className="ml-2 font-sans tabular-nums opacity-50">
                    [{count}]
                </span>
            )}
        </TabsTrigger>
    )
}

function ReviewCard({ item, actions }: { item: Deliverable, actions: ApprovalStreamProps['actions'] }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const latestVersion = item.versionHistory?.[item.versionHistory.length - 1];

    const handleApprove = async () => {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append("deliverableId", item._id);
        try {
            await actions.approve(formData);
            setShowApproveDialog(false);
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
        <Card className="overflow-hidden border-border bg-card shadow-sm group">
            <div className="grid md:grid-cols-5 gap-0">
                {/* Media Preview (Left) */}
                <div className="md:col-span-3 bg-slate-50 dark:bg-slate-900/50 relative min-h-[400px] flex items-center justify-center border-r border-slate-100 dark:border-slate-800">
                    {latestVersion ? (
                        <div className="text-center p-8">
                            <Button asChild variant="outline" className="rounded-full bg-white dark:bg-slate-900 shadow-sm px-8 py-6 h-auto text-lg font-display">
                                <a href={latestVersion.url} target="_blank" rel="noopener noreferrer">
                                    <Play className="w-5 h-5 mr-3" /> View Deliverable
                                </a>
                            </Button>
                            {latestVersion.notes && (
                                <div className="mt-8 text-center">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Notes from Production</p>
                                    <p className="text-sm text-foreground max-w-xs mx-auto italic font-serif leading-relaxed">
                                        &quot;{latestVersion.notes}&quot;
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-muted-foreground font-display italic">Awaiting asset upload...</p>
                    )}
                </div>

                {/* Details & Actions (Right) */}
                <div className="md:col-span-2 p-10 flex flex-col justify-between">
                    <div>
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground mb-4 block">
                            {item.campaign.title}
                        </span>
                        <h3 className="text-3xl font-display font-medium text-foreground leading-tight tracking-tight mb-8">
                            {item.title}
                        </h3>

                        <div className="space-y-6 text-[11px] uppercase tracking-widest font-medium text-muted-foreground">
                            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900/50">
                                <span>Platform</span>
                                <span className="text-foreground">{item.platform}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900/50">
                                <span>Type</span>
                                <span className="text-foreground">{item.type}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-900/50">
                                <span>Status</span>
                                <span className="text-foreground">v{latestVersion?.versionNumber || 1} • Ready for Review</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 space-y-4">
                        <Button
                            className="w-full bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 py-6 h-auto rounded-full font-medium transition-all"
                            onClick={() => setShowApproveDialog(true)}
                            disabled={isSubmitting}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" /> Approve for Production
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 py-6 h-auto rounded-full text-muted-foreground hover:text-foreground transition-all"
                            onClick={() => setShowRejectDialog(true)}
                            disabled={isSubmitting}
                        >
                            <XCircle className="w-4 h-4 mr-2" /> Request Refinements
                        </Button>
                    </div>
                </div>
            </div>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Request Changes</DialogTitle>
                        <DialogDescription>
                            Let the team know what needs to be improved. Be specific to help us get it right.
                        </DialogDescription>
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
                            {isSubmitting ? "Submitting..." : "Submit Request"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Approve Dialog */}
            <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Approval</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve this deliverable? This will signal the team to proceed with final production and publishing.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
                        <Button
                            className="bg-slate-900 text-white hover:bg-slate-800"
                            onClick={handleApprove}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Approving..." : "Yes, Approve"}
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
