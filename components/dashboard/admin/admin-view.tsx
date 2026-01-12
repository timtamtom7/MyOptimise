"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  CheckSquare, 
  Activity, 
  Edit, 
  Plus, 
  FileText,
  CreditCard,
  LayoutDashboard,
  Shield,
  MessageSquare,
  Cpu,
  ExternalLink,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Save,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

import { TasksTab } from "./tasks-tab";
import { AccountsTab } from "./accounts-tab";
import { AuditTab } from "./audit-tab";
import { SupportTab } from "./support-tab";
import { ServicesTab } from "./services-tab";
import { SystemTab } from "./system-tab";
import { MessagesTab } from "./messages-tab";
import { FinancialsTab } from "./financials-tab";

interface AdminViewProps {
  data: {
    accounts: any[];
    employees: any[];
    openWorkItems: any[];
    unassignedWorkItems: any[];
    workItemTemplates: any[];
    openClientRequests: any[];
    clientServices: any[];
    openServiceRequests: any[];
    featureFlags: any[];
    myThreads: any[];
    auditLogs: any[];
    invoices: any[];
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
    canDeleteTasks: boolean;
    canManageServices: boolean;
    canManageFeatureFlags: boolean;
  };
  actions: {
    createWorkItem: (formData: FormData) => Promise<void>;
    assignWorkItem: (formData: FormData) => Promise<void>;
    deleteWorkItem: (formData: FormData) => Promise<void>;
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
  // Layout State
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState({
    statsOrder: ['totalUsers', 'activeTasks', 'pendingRequests', 'systemHealth'],
    visible: {
      totalUsers: true,
      activeTasks: true,
      pendingRequests: true,
      systemHealth: true,
      recentTasksList: true,
      teamList: true
    }
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin-dashboard-layout");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setLayout(prev => ({ ...prev, ...parsed, visible: { ...prev.visible, ...parsed.visible } }));
      } catch (e) { console.error("Failed to parse layout", e); }
    }
  }, []);

  // Save to localStorage
  const saveLayout = () => {
    localStorage.setItem("admin-dashboard-layout", JSON.stringify(layout));
    setIsEditing(false);
  };

  const toggleVisibility = (key: string) => {
    setLayout(prev => ({
      ...prev,
      visible: { ...prev.visible, [key]: !prev.visible[key as keyof typeof prev.visible] }
    }));
  };

  const moveStat = (index: number, direction: 'left' | 'right') => {
    const newOrder = [...layout.statsOrder];
    if (direction === 'left' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'right' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setLayout(prev => ({ ...prev, statsOrder: newOrder }));
  };

  // Stat Card Components Map
  const statCards = {
    totalUsers: (
      <Card className={!layout.visible.totalUsers && isEditing ? "opacity-50 border-dashed" : ""}>
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
    ),
    activeTasks: (
      <Card className={!layout.visible.activeTasks && isEditing ? "opacity-50 border-dashed" : ""}>
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
    ),
    pendingRequests: (
      <Card className={!layout.visible.pendingRequests && isEditing ? "opacity-50 border-dashed" : ""}>
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
    ),
    systemHealth: (
      <Card className={!layout.visible.systemHealth && isEditing ? "opacity-50 border-dashed" : ""}>
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
    )
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your organization&apos;s activity and performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={saveLayout} size="sm">
                <Save className="mr-2 h-4 w-4" />
                Save Layout
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
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
            {layout.statsOrder.map((key, index) => {
              const isVisible = layout.visible[key as keyof typeof layout.visible];
              if (!isVisible && !isEditing) return null;
              
              return (
                <div key={key} className="relative group">
                  {statCards[key as keyof typeof statCards]}
                  {isEditing && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/90 p-1 rounded border shadow-sm backdrop-blur-sm z-10">
                      {index > 0 && (
                        <button onClick={() => moveStat(index, 'left')} className="p-1 hover:bg-muted rounded" title="Move Left">
                          <ArrowLeft className="h-3 w-3" />
                        </button>
                      )}
                      {index < layout.statsOrder.length - 1 && (
                        <button onClick={() => moveStat(index, 'right')} className="p-1 hover:bg-muted rounded" title="Move Right">
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                      <button onClick={() => toggleVisibility(key)} className={`p-1 hover:bg-muted rounded ${isVisible ? 'text-primary' : 'text-muted-foreground'}`} title={isVisible ? "Hide" : "Show"}>
                        {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-7">
            {/* Recent Tasks */}
            {(layout.visible.recentTasksList || isEditing) && (
              <div className={`md:col-span-4 relative ${!layout.visible.recentTasksList ? 'opacity-50 border border-dashed rounded-lg p-4' : ''}`}>
                {isEditing && (
                  <div className="absolute top-4 right-4 z-10">
                    <button onClick={() => toggleVisibility('recentTasksList')} className="bg-background/90 p-2 rounded border shadow-sm backdrop-blur-sm hover:bg-muted">
                      {layout.visible.recentTasksList ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>
                )}
                <Card className={!layout.visible.recentTasksList ? "border-0 shadow-none bg-transparent pointer-events-none" : ""}>
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
              </div>
            )}

            {/* Team */}
            {(layout.visible.teamList || isEditing) && (
              <div className={`md:col-span-3 relative ${!layout.visible.teamList ? 'opacity-50 border border-dashed rounded-lg p-4' : ''}`}>
                {isEditing && (
                  <div className="absolute top-4 right-4 z-10">
                    <button onClick={() => toggleVisibility('teamList')} className="bg-background/90 p-2 rounded border shadow-sm backdrop-blur-sm hover:bg-muted">
                      {layout.visible.teamList ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    </button>
                  </div>
                )}
                <Card className={!layout.visible.teamList ? "border-0 shadow-none bg-transparent pointer-events-none" : ""}>
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
            )}
          </div>
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

        <TabsContent value="financials">
          <FinancialsTab invoices={data.invoices || []} />
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
              canManageTaskTemplates: capabilities.canManageTaskTemplates,
              canDelete: capabilities.canDeleteTasks
            }}
            actions={{
              createWorkItem: actions.createWorkItem,
              assignWorkItem: actions.assignWorkItem,
              deleteWorkItem: actions.deleteWorkItem,
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
