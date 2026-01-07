"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientHero } from "./hero";
import { RequestsList } from "./requests-list";
import { ServicesGrid } from "./services-grid";
import { ServicesDashboard } from "../services-dashboard";
import { ClientWorkItemsList } from "./work-items-list";
import { MessagesTab } from "../admin/messages-tab";
import { ApprovalsTab } from "./approvals-tab";
import { DeliverablesLibrary } from "./deliverables-library";
import { ClientCalendar, CalendarEvent } from "./client-calendar";
import { 
  FileText,
  CheckSquare,
  Layers,
  MessageSquare,
  Activity,
  Flag,
  Calendar,
  AlertCircle
} from "lucide-react";

interface ClientViewProps {
  data: {
    user: { name: string; email: string };
    myRequests: any[];
    supportStaff: any[];
    myThreads: any[];
    clientWorkItems: any[];
    clientServices: any[];
    myServiceRequests: any[];
    myDeliverables: any[];
    activeCampaign?: any;
    calendarEvents?: CalendarEvent[];
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
  };
}

export function ClientView({ data, actions, capabilities }: ClientViewProps) {
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
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          {capabilities.canViewServices && <TabsTrigger value="services">Services</TabsTrigger>}
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <ClientCalendar events={data.calendarEvents || []} />
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

          <ClientHero canWrite={capabilities.canWrite} submitAction={actions.submitClientRequest} />
          
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
    </div>
  );
}
