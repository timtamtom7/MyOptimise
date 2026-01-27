"use client";

import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClientHero } from "./hero";
import { RequestsList } from "./requests-list";
import { ServicesGrid } from "./services-grid";
import { ClientWorkItemsList } from "./work-items-list";
import { ApprovalsTab } from "./approvals-tab";
import { DeliverablesLibrary } from "./deliverables-library";
import { ContentGrid } from "./content-grid";
import { CreatePostDialog } from "./create-post-dialog";
import { PostPreviewDialog } from "./post-preview-dialog";
import { ClientCalendar, CalendarEvent } from "./client-calendar";
import { SocialConnections } from "./social-connections";
import { BrandTab } from "./brand-tab";
import { BillingTab } from "./billing-tab";
import { ResultsTab } from "./results-tab";
import Link from "next/link";
import {
  FileText,
  CheckSquare,
  Layers,
  MessageSquare,
  Activity,
  Flag,
  Calendar,
  AlertCircle,
  Plus,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  LayoutDashboard,
  CreditCard,
  Briefcase,
  TrendingUp,
} from "lucide-react";

interface ClientViewProps {
  data: {
    user: { name: string; email: string; id?: string; timezone?: string; avatar?: string };
    account?: any; // Full account object
    myRequests: any[];
    supportStaff: any[];
    myThreads: any[];
    clientWorkItems: any[];
    clientServices: any[];
    myServiceRequests: any[];
    myDeliverables: any[];
    activeCampaign?: any;
    calendarEvents?: any[];
    contentItems?: any[];
    socialConnections?: any[];
    analytics?: any[];
  };
  actions: {
    submitClientRequest: (formData: FormData) => Promise<void>;
    addClientRequestMessage: (formData: FormData) => Promise<void>;
    createOrOpenSupportThread: (formData: FormData) => Promise<void>;
    setClientServiceEnabled: (formData: FormData) => Promise<void>;
    submitServiceRequest: (formData: FormData) => Promise<void>;
    approveDeliverable: (formData: FormData) => Promise<void>;
    rejectDeliverable: (formData: FormData) => Promise<void>;
    suggestBrandAssetTags: (formData: FormData) => Promise<void>;
  };
  capabilities: {
    canWrite: boolean;
    canViewServices: boolean;
    canManageConnections?: boolean;
  };
}

export function ClientView({ data, actions, capabilities }: ClientViewProps) {
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [createPostDate, setCreatePostDate] = useState<Date | undefined>(undefined);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const handleDateClick = (date: Date) => {
    if (capabilities.canWrite) {
      setCreatePostDate(date);
      setCreatePostOpen(true);
    }
  };

  const handleCreatePost = () => {
    setCreatePostDate(undefined);
    setCreatePostOpen(true);
  };

  const handlePostClick = (postOrId: any) => {
      const post = typeof postOrId === 'string' 
        ? data.contentItems?.find(c => c._id === postOrId)
        : postOrId;
      
      if (post) {
          setPreviewPost(post);
          setPreviewOpen(true);
      }
  };

  // Calculate stats
  const activeRequests = data.myRequests.filter(r => r.status !== 'completed' && r.status !== 'closed').length;
  const pendingTasks = data.clientWorkItems.filter(i => i.status !== 'completed' && i.status !== 'done').length;
  const activeServices = data.clientServices.filter(s => s.status === 'active').length;
  const activeThreads = data.myThreads.length;
  
  // Trust OS Metrics
  const pendingReviews = data.myDeliverables.filter(d => d.status === 'client_review').length;
  const activeCampaignTitle = data.activeCampaign?.title || "No Active Campaign";
  const activeCampaignFocus = data.activeCampaign?.description || "We are currently setting up your next campaign strategy.";
  const nextMilestone = data.activeCampaign?.endDate ? new Date(data.activeCampaign.endDate).toLocaleDateString() : "TBD";

  const analytics = data.analytics || [];
  const hasAnalytics = analytics.length > 0;
  const totalAnalyticsValue = hasAnalytics
    ? analytics.reduce((sum: number, record: any) => sum + (record.value || 0), 0)
    : 0;
  const latestAnalyticsRecord = hasAnalytics ? analytics[0] : null;
  const latestAnalyticsDate = latestAnalyticsRecord?.metricDate
    ? new Date(latestAnalyticsRecord.metricDate).toLocaleDateString()
    : "N/A";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {data.user.name}. Here&apos;s what&apos;s happening with your account.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto border-b pb-2">
          <Button
            variant={activeTab === "overview" ? "secondary" : "ghost"}
            onClick={() => setActiveTab("overview")}
            className="gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Button>

          <Button
            variant={activeTab === "results" ? "secondary" : "ghost"}
            onClick={() => setActiveTab("results")}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Results
          </Button>

          <Button
            variant={activeTab === "approvals" ? "secondary" : "ghost"}
            onClick={() => setActiveTab("approvals")}
            className="gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            Approvals
            {pendingReviews > 0 && (
              <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                {pendingReviews}
              </span>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={["calendar", "content", "brand"].includes(activeTab) ? "secondary" : "ghost"}
                className="gap-2"
              >
                <Layers className="h-4 w-4" />
                Campaign
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setActiveTab("calendar")}>
                <Calendar className="mr-2 h-4 w-4" />
                Calendar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("content")}>
                <FileText className="mr-2 h-4 w-4" />
                Content
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("brand")}>
                <Flag className="mr-2 h-4 w-4" />
                Brand Assets
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={["services", "requests"].includes(activeTab) ? "secondary" : "ghost"}
                className="gap-2"
              >
                <Briefcase className="h-4 w-4" />
                Services
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setActiveTab("services")}>
                <Activity className="mr-2 h-4 w-4" />
                Active Services
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("requests")}>
                <AlertCircle className="mr-2 h-4 w-4" />
                Support Requests
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant={activeTab === "billing" ? "secondary" : "ghost"}
            onClick={() => setActiveTab("billing")}
            className="gap-2"
          >
            <CreditCard className="h-4 w-4" />
            Billing
          </Button>

          <Button
            variant={activeTab === "messages" ? "secondary" : "ghost"}
            onClick={() => setActiveTab("messages")}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Inbox
          </Button>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingTasks}</div>
                <p className="text-xs text-muted-foreground">Action items for you</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeServices}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeRequests}</div>
                <p className="text-xs text-muted-foreground">Support tickets</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingReviews}</div>
                <p className="text-xs text-muted-foreground">
                  {pendingReviews > 0 ? "Content waiting for your review" : "You’re all caught up"}
                </p>
                {pendingReviews > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setActiveTab("approvals")}
                  >
                    Review now
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Results snapshot</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {hasAnalytics ? (
                <div className="space-y-3">
                  <div className="text-2xl font-bold">
                    {latestAnalyticsRecord?.value?.toLocaleString?.() ?? latestAnalyticsRecord?.value ?? totalAnalyticsValue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Latest metric: {latestAnalyticsRecord?.metric || "Activity"} on {latestAnalyticsDate}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Based on {analytics.length} data points across your connected channels.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1"
                    onClick={() => setActiveTab("results")}
                  >
                    View full results
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Once your accounts are connected and data flows in, a simple summary of followers, reach, or other agreed metrics will appear here.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <ClientHero 
                userName={data.user.name}
                activeCampaignTitle={activeCampaignTitle}
                activeCampaignFocus={activeCampaignFocus}
                nextMilestone={nextMilestone}
                pendingReviews={pendingReviews}
                onReviewClick={() => setActiveTab("approvals")}
                canWrite={capabilities.canWrite}
                submitAction={actions.submitClientRequest}
                account={data.account}
              />
            </div>
            <div className="col-span-3">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Upcoming & Recent Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.contentItems && data.contentItems.length > 0 ? (
                      data.contentItems
                        .slice()
                        .sort((a, b) => {
                          const aDate = a.scheduledAt || a.createdAt;
                          const bDate = b.scheduledAt || b.createdAt;
                          return new Date(aDate).getTime() - new Date(bDate).getTime();
                        })
                        .slice(0, 3)
                        .map((item, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">{item.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.scheduledAt
                                  ? `Scheduled for ${new Date(item.scheduledAt).toLocaleString()}`
                                  : "Draft – not yet scheduled"}
                              </p>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No content yet. Once posts are drafted or scheduled, they will appear here.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <ResultsTab analytics={analytics} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <ClientCalendar 
            events={data.calendarEvents || []} 
            onDateClick={handleDateClick}
            canWrite={capabilities.canWrite}
          />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Content Library</h2>
            {capabilities.canWrite && (
              <Button onClick={handleCreatePost} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Post
              </Button>
            )}
          </div>
          <ContentGrid 
            items={data.contentItems || []} 
            onPostClick={handlePostClick}
            capabilities={capabilities}
          />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-6">
          <ApprovalsTab 
            deliverables={data.myDeliverables}
            onApprove={actions.approveDeliverable}
            onReject={actions.rejectDeliverable}
          />
        </TabsContent>

        <TabsContent value="brand" className="space-y-6">
          <BrandTab
            account={data.account}
            actions={{ suggestBrandAssetTags: actions.suggestBrandAssetTags }}
            canWrite={capabilities.canWrite}
          />
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <ServicesGrid 
            services={data.clientServices}
            toggleAction={actions.setClientServiceEnabled}
          />
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          <RequestsList 
            requests={data.myRequests}
            canWrite={capabilities.canWrite}
            addMessageAction={actions.addClientRequestMessage}
            submitRequestAction={actions.submitClientRequest}
          />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <BillingTab />
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Inbox</h2>
                <p className="text-muted-foreground">
                  Conversations with your Optimise team.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.myThreads.map((thread) => (
                <Link
                  key={thread._id}
                  href={`/dashboard/client/threads/${thread._id}`}
                  className="block rounded-lg border bg-card p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium truncate">
                      {thread.title || "Conversation"}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {thread.lastMessage?.message || "No messages yet"}
                  </p>
                </Link>
              ))}
              {data.myThreads.length === 0 && (
                <div className="col-span-full text-center py-10 text-muted-foreground border rounded-lg bg-muted/20">
                  No conversations yet. Use support requests to get in touch.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <CreatePostDialog 
        clientId={String(data.user.id || "")}
        open={createPostOpen} 
        onOpenChange={setCreatePostOpen}
        defaultDate={createPostDate}
      />

      <PostPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        post={previewPost}
        canWrite={capabilities.canWrite}
      />
    </div>
  );
}
