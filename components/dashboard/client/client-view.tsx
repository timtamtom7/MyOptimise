"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientHero } from "./hero";
import { RequestsList } from "./requests-list";
import { ServicesGrid } from "./services-grid";
import { ClientWorkItemsList } from "./work-items-list";
import { MessagesTab } from "../admin/messages-tab";
import { 
  FileText, 
  CheckSquare, 
  Layers, 
  MessageSquare,
  Activity
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
  };
  actions: {
    submitClientRequest: (formData: FormData) => Promise<void>;
    addClientRequestMessage: (formData: FormData) => Promise<void>;
    createOrOpenSupportThread: (formData: FormData) => Promise<void>;
    setClientServiceEnabled: (formData: FormData) => Promise<void>;
    submitServiceRequest: (formData: FormData) => Promise<void>;
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {data.user.name}. Here's what's happening with your account.
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          {capabilities.canViewServices && <TabsTrigger value="services">Services</TabsTrigger>}
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
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
                <p className="text-xs text-muted-foreground">
                  In progress or pending
                </p>
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
                <p className="text-xs text-muted-foreground">
                  Requiring your attention
                </p>
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
                <p className="text-xs text-muted-foreground">
                  Currently enabled
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Conversations
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeThreads}</div>
                <p className="text-xs text-muted-foreground">
                  Direct support channels
                </p>
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

        <TabsContent value="requests" className="space-y-6">
           <RequestsList 
              requests={data.myRequests} 
              canWrite={capabilities.canWrite} 
              addMessageAction={actions.addClientRequestMessage} 
              submitRequestAction={actions.submitClientRequest}
            />
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
