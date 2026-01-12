"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ClientHero } from "./hero";
import { RequestsList } from "./requests-list";
import { ServicesGrid } from "./services-grid";
import { ServicesDashboard } from "../services-dashboard";
import { ClientWorkItemsList } from "./work-items-list";
import { MessagesTab } from "../admin/messages-tab";
import { ApprovalsTab } from "./approvals-tab";
import { DeliverablesLibrary } from "./deliverables-library";
import { ContentGrid } from "./content-grid";
import { CreatePostDialog } from "./create-post-dialog";
import { PostPreviewDialog } from "./post-preview-dialog";
import { ClientCalendar, CalendarEvent } from "./client-calendar";
import { SocialConnections } from "./social-connections";
import { BrandTab } from "./brand-tab";
import { BillingTab } from "./billing-tab";
import { 
  FileText,
  CheckSquare,
  Layers,
  MessageSquare,
  Activity,
  Flag,
  Calendar,
  AlertCircle,
  Plus
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
  };
  actions: {
    submitClientRequest: (formData: FormData) => Promise<void>;
    addClientRequestMessage: (formData: FormData) => Promise<void>;
    createOrOpenSupportThread: (formData: FormData) => Promise<void>;
    setClientServiceEnabled: (formData: FormData) => Promise<void>;
    submitServiceRequest: (formData: FormData) => Promise<void>;
    approveDeliverable: (formData: FormData) => Promise<void>;
    rejectDeliverable: (formData: FormData) => Promise<void>;
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

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          {capabilities.canViewServices && <TabsTrigger value="services">Services</TabsTrigger>}
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="brand">Brand</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="space-y-6">
          <BrandTab account={data.account} />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <BillingTab />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <div className="flex items-center justify-between">
             <h2 className="text-lg font-semibold tracking-tight">Content Calendar</h2>
             {capabilities.canWrite && (
               <Button onClick={handleCreatePost} className="gap-2">
                 <Plus className="h-4 w-4" /> Create Post
               </Button>
             )}
          </div>
          <ClientCalendar 
            events={data.calendarEvents || []} 
            onDateClick={handleDateClick} 
            onEventClick={handlePostClick}
            drafts={(data.contentItems || []).filter(c => !c.scheduledAt || String(c.status || "") === "draft")}
          />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
           <div className="flex items-center justify-between">
             <h2 className="text-lg font-semibold tracking-tight">All Posts</h2>
             {capabilities.canWrite && (
               <Button onClick={handleCreatePost} className="gap-2">
                 <Plus className="h-4 w-4" /> Create Post
               </Button>
             )}
           </div>
           <ContentGrid items={data.contentItems || []} onPostClick={handlePostClick} />
        </TabsContent>

        <TabsContent value="connections" className="space-y-6">
          <SocialConnections 
            connections={data.socialConnections || []} 
            clientId={data.user.id || ""} 
            canWrite={capabilities.canManageConnections ?? capabilities.canWrite}
          />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          {/* Trust OS Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            
            {/* 1. Narrative / Focus */}
            <Card className="col-span-2 border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Focus: {activeCampaignTitle}
                </CardTitle>
                <Flag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {activeCampaignFocus}
                </p>
              </CardContent>
            </Card>

            {/* 2. Waiting on Client */}
            <Card className={pendingReviews > 0 ? "border-l-4 border-l-orange-500 bg-orange-50/10" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Waiting on You
                </CardTitle>
                <AlertCircle className={`h-4 w-4 ${pendingReviews > 0 ? "text-orange-500" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingReviews}</div>
                <p className="text-xs text-muted-foreground">
                  Approvals pending
                </p>
              </CardContent>
            </Card>

            {/* 3. Next Milestone */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Next Milestone
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold truncate">{nextMilestone}</div>
                <p className="text-xs text-muted-foreground">
                  Target completion
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Operational Stats (Restored) */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Requests
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeRequests}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Tasks
                </CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingTasks}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Services
                </CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeServices}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Threads
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeThreads}</div>
              </CardContent>
            </Card>
          </div>

          <ClientHero canWrite={capabilities.canWrite} submitAction={actions.submitClientRequest} account={data.account} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RequestsList 
              requests={data.myRequests.slice(0, 5)} 
              canWrite={capabilities.canWrite} 
              addMessageAction={actions.addClientRequestMessage} 
            />
            <div className="space-y-6">
              <ClientWorkItemsList items={data.clientWorkItems.slice(0, 5)} />
              {capabilities.canViewServices && (
                <ServicesGrid 
                  services={data.clientServices.slice(0, 4)} 
                  toggleAction={actions.setClientServiceEnabled} 
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="approvals">
          <ApprovalsTab 
            deliverables={data.myDeliverables} 
            actions={{
              approve: actions.approveDeliverable,
              reject: actions.rejectDeliverable
            }}
          />
        </TabsContent>

        <TabsContent value="library">
           <DeliverablesLibrary deliverables={data.myDeliverables} />
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
           <RequestsList 
              requests={data.myRequests} 
              canWrite={capabilities.canWrite} 
              addMessageAction={actions.addClientRequestMessage} 
              submitRequestAction={actions.submitClientRequest}
            />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
           <ServicesDashboard />
        </TabsContent>

        {capabilities.canViewServices && (
          <TabsContent value="services" className="space-y-6">
             <ServicesGrid 
                services={data.clientServices} 
                toggleAction={actions.setClientServiceEnabled} 
              />
          </TabsContent>
        )}

        <TabsContent value="tasks" className="space-y-6">
           <ClientWorkItemsList items={data.clientWorkItems} />
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <MessagesTab
            threads={data.myThreads}
            employees={data.supportStaff}
            basePath="/dashboard/client"
            actions={{
              createOrOpenDmThread: actions.createOrOpenSupportThread,
            }}
          />
        </TabsContent>
      </Tabs>

      <CreatePostDialog 
        clientId={data.user.id || ""} 
        open={createPostOpen} 
        onOpenChange={setCreatePostOpen}
        defaultDate={createPostDate}
        trigger={null}
        targetTimezone={data.user.timezone}
      />
      
      <PostPreviewDialog
        post={previewPost}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        canWrite={capabilities.canWrite}
        targetTimezone={data.user.timezone}
        authorName={data.user.name}
        authorAvatar={data.user.avatar}
      />
    </div>
  );
}
