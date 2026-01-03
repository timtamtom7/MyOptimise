"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  CheckSquare, 
  Activity, 
  Settings, 
  Plus, 
  FileText,
  CreditCard,
  LayoutDashboard,
  Shield,
  MessageSquare,
  Cpu
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

import { TasksTab } from "./tasks-tab";
import { AccountsTab } from "./accounts-tab";
import { AuditTab } from "./audit-tab";
import { IntakeTab } from "./intake-tab";
import { SupportTab } from "./support-tab";
import { ServicesTab } from "./services-tab";
import { SystemTab } from "./system-tab";
import { MessagesTab } from "./messages-tab";

interface AdminViewProps {
  data: {
    accounts: any[];
    employees: any[];
    receivedSignups: any[];
    submittedSponsorships: any[];
    openWorkItems: any[];
    unassignedWorkItems: any[];
    workItemTemplates: any[];
    openClientRequests: any[];
    clientServices: any[];
    openServiceRequests: any[];
    featureFlags: any[];
    myThreads: any[];
    auditLogs: any[];
    impersonatedAccount: any;
    stats: {
      totalUsers: number;
      activeTasks: number;
      pendingRequests: number;
    };
    currentUser: {
      name: string;
      email: string;
    };
  };
  capabilities: {
    canCreateTasks: boolean;
    canInvite: boolean;
    canViewLogs: boolean;
    canAssign: boolean;
    canRemove: boolean;
    canImpersonate: boolean;
    canSetTaskVisibility: boolean;
    canManageTaskTemplates: boolean;
    canManageServices: boolean;
    canManageFeatureFlags: boolean;
  };
  actions: {
    createWorkItem: (formData: FormData) => Promise<void>;
    assignWorkItem: (formData: FormData) => Promise<void>;
    updateStatus: (formData: FormData) => Promise<void>;
    inviteGoogleAccount: (formData: FormData) => Promise<void>;
    updateAccount: (formData: FormData) => Promise<void>;
    removeAccount: (formData: FormData) => Promise<void>;
    startImpersonation: (formData: FormData) => Promise<void>;
    stopImpersonation: () => Promise<void>;
    // Add other actions here
    [key: string]: any;
  };
}

export function AdminView({ data, capabilities, actions }: AdminViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your organization's activity and performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button size="sm">
            <FileText className="mr-2 h-4 w-4" />
            Reports
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="intake">Intake</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          {capabilities.canManageFeatureFlags && <TabsTrigger value="system">System</TabsTrigger>}
          {capabilities.canViewLogs && <TabsTrigger value="audit">Audit Logs</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Across all roles
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.activeTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {data.unassignedWorkItems.length} unassigned
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.pendingRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Requires attention
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">98%</div>
                <p className="text-xs text-muted-foreground">
                  Operational
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-7">
            {/* Recent Tasks */}
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>Latest work items in the system.</CardDescription>
              </CardHeader>
              <CardContent>
                 {data.openWorkItems.slice(0, 5).map((item) => (
                    <div key={item._id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                           item.priority === 'high' ? 'bg-red-100 text-red-600' : 
                           item.priority === 'medium' ? 'bg-orange-100 text-orange-600' : 
                           'bg-blue-100 text-blue-600'
                        }`}>
                          <CheckSquare className="h-4 w-4" />
                        </div>
                        <div>
                           <div className="font-medium">{item.title}</div>
                           <div className="text-xs text-muted-foreground">
                             {item.assigneeName ? `Assigned to ${item.assigneeName}` : 'Unassigned'}
                           </div>
                        </div>
                      </div>
                      <Badge variant={item.status === 'todo' ? 'outline' : 'secondary'}>{item.status}</Badge>
                    </div>
                 ))}
                 {data.openWorkItems.length === 0 && (
                   <div className="text-center py-6 text-muted-foreground">No active tasks.</div>
                 )}
              </CardContent>
            </Card>

            {/* Team */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Recently active users.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                   {data.accounts.slice(0, 5).map((user) => (
                     <div key={user._id} className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <Avatar className="h-8 w-8">
                           <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
                           <AvatarFallback>{user.name?.[0] || user.email[0]}</AvatarFallback>
                         </Avatar>
                         <div>
                           <div className="font-medium text-sm">{user.name || 'Unnamed'}</div>
                           <div className="text-xs text-muted-foreground">{user.email}</div>
                         </div>
                       </div>
                       <Badge variant="outline" className="text-xs">{user.type}</Badge>
                     </div>
                   ))}
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="intake">
          <IntakeTab
            receivedSignups={data.receivedSignups}
            submittedSponsorships={data.submittedSponsorships}
            employees={data.employees}
            actions={{
              assignSignup: actions.assignSignup,
              assignSponsorship: actions.assignSponsorship,
            }}
          />
        </TabsContent>

        <TabsContent value="support">
          <SupportTab
            requests={data.openClientRequests}
            employees={data.employees}
            actions={{
              assignClientRequest: actions.assignClientRequest,
              updateClientRequest: actions.updateClientRequest,
              addClientRequestMessage: actions.addClientRequestMessage,
            }}
          />
        </TabsContent>

        <TabsContent value="services">
          <ServicesTab
            clientServices={data.clientServices}
            openServiceRequests={data.openServiceRequests}
            clients={data.accounts.filter((a: any) => a.type === "client")}
            capabilities={{
              canManageServices: capabilities.canManageServices,
            }}
            actions={{
              createClientService: actions.createClientService,
              updateClientService: actions.updateClientService,
              updateServiceRequestStatus: actions.updateServiceRequestStatus,
            }}
          />
        </TabsContent>

        <TabsContent value="messages">
          <MessagesTab
            threads={data.myThreads}
            employees={data.employees}
            basePath="/dashboard/admin"
            actions={{
              createOrOpenDmThread: actions.createOrOpenDmThread,
            }}
          />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksTab 
            openWorkItems={data.openWorkItems}
            unassignedWorkItems={data.unassignedWorkItems}
            workItemTemplates={data.workItemTemplates}
            employees={data.employees}
            capabilities={{
              canCreate: capabilities.canCreateTasks,
              canAssign: capabilities.canAssign,
              canManageTaskTemplates: capabilities.canManageTaskTemplates
            }}
            actions={{
              createWorkItem: actions.createWorkItem,
              assignWorkItem: actions.assignWorkItem,
              updateStatus: actions.updateStatus,
              createWorkItemTemplate: actions.createWorkItemTemplate,
              deleteWorkItemTemplate: actions.deleteWorkItemTemplate,
              createWorkItemFromTemplate: actions.createWorkItemFromTemplate
            }}
          />
        </TabsContent>

        <TabsContent value="accounts">
          <AccountsTab 
            accounts={data.accounts}
            capabilities={{
              canInvite: capabilities.canInvite,
              canRemove: capabilities.canRemove,
              canImpersonate: capabilities.canImpersonate
            }}
            actions={{
              inviteGoogleAccount: actions.inviteGoogleAccount,
              updateAccount: actions.updateAccount,
              removeAccount: actions.removeAccount,
              startImpersonation: actions.startImpersonation,
              resetAccountSessions: actions.resetAccountSessions
            }}
          />
        </TabsContent>

        {capabilities.canManageFeatureFlags && (
          <TabsContent value="system">
            <SystemTab
              featureFlags={data.featureFlags}
              capabilities={{
                canManageFeatureFlags: capabilities.canManageFeatureFlags,
              }}
              actions={{
                upsertFeatureFlag: actions.upsertFeatureFlag,
                deleteFeatureFlag: actions.deleteFeatureFlag,
              }}
            />
          </TabsContent>
        )}

        {capabilities.canViewLogs && (
          <TabsContent value="audit">
            <AuditTab auditLogs={data.auditLogs} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
