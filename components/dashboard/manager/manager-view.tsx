"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  CheckSquare,
  Activity,
  Settings,
  FileText,
  CreditCard,
  MessageSquare,
  Edit,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Save,
  X,
  Calendar,
  BarChart3,
  Briefcase,
  LayoutDashboard,
  ExternalLink,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateBlueGradient } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Import shared tabs from admin since they are identical for now
import { TasksTab } from "../admin/tasks-tab";
import { SupportTab } from "../admin/support-tab";
import { ServicesTab } from "../admin/services-tab";
import { MessagesTab } from "../admin/messages-tab";
import { ReportsTab } from "../shared/reports-tab";
import { TeamTab } from "./team-tab";
import { BriefsTab } from "./briefs-tab";
import { Brief } from "@/types/briefs";
import { ClientPerformanceRollup } from "../admin/client-performance-rollup";

interface ManagerViewProps {
  data: {
    employees: any[];
    clients: any[];
    unassignedWorkItems: any[];
    myWorkItems: any[];
    teamWorkItems?: any[];
    openClientRequests: any[];
    clientServices: any[];
    openServiceRequests: any[];
    staff: any[];
    myThreads: any[];
    briefs?: Brief[]; // Added briefs
    stats: {
      myActiveTasks: number;
      pendingRequests: number;
      teamSize: number;
    };
    currentUser: {
      name: string;
      email: string;
    };
    isImpersonating?: boolean;
  };
  capabilities: {
    canInvite: boolean;
    canCreateTasks: boolean;
    canManageServices: boolean;
    canAssign: boolean;
  };
  actions: {
    inviteEmployee: (formData: FormData) => Promise<void>;
    createWorkItem: (formData: FormData) => Promise<void>;
    updateStatus: (formData: FormData) => Promise<void>;
    updateClientRequest: (formData: FormData) => Promise<void>;
    assignClientRequest: (formData: FormData) => Promise<void>;
    addClientRequestMessage: (formData: FormData) => Promise<void>;
    createClientService: (formData: FormData) => Promise<void>;
    updateClientService: (formData: FormData) => Promise<void>;
    updateServiceRequestStatus: (formData: FormData) => Promise<void>;
    assignWorkItem: (formData: FormData) => Promise<void>;
    createOrOpenDmThread: (formData: FormData) => Promise<void>;
    createBrief: (formData: FormData) => Promise<void>;
    approveBrief: (formData: FormData) => Promise<void>;
    rejectBrief: (formData: FormData) => Promise<void>;
    stopImpersonation?: () => Promise<void>;
    [key: string]: any;
  };
  defaultTab?: string;
}

export function ManagerView({ data, capabilities, actions, defaultTab = "overview" }: ManagerViewProps) {
  const { t } = useTranslation();
  const isTeamPage = defaultTab === "team";
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);

  interface ManagerLayout {
    statsOrder: string[];
    visible: {
      myTasks: boolean;
      pendingRequests: boolean;
      teamMembers: boolean;
      systemStatus: boolean;
      recentTasksList: boolean;
      teamList: boolean;
    };
  }

  const defaultLayout: ManagerLayout = {
    statsOrder: ["myTasks", "pendingRequests", "teamMembers", "systemStatus"],
    visible: {
      myTasks: true,
      pendingRequests: true,
      teamMembers: true,
      systemStatus: true,
      recentTasksList: true,
      teamList: true
    }
  };

  const [layout, setLayout] = useState<ManagerLayout>(() => {
    if (typeof window === "undefined") return defaultLayout;
    const saved = window.localStorage.getItem("manager-dashboard-layout");
    if (!saved) return defaultLayout;
    try {
      const parsed = JSON.parse(saved);
      return { ...defaultLayout, ...parsed, visible: { ...defaultLayout.visible, ...parsed.visible } };
    } catch (e) {
      console.error("Failed to parse layout", e);
      return defaultLayout;
    }
  });

  // Save to localStorage
  const saveLayout = () => {
    localStorage.setItem("manager-dashboard-layout", JSON.stringify(layout));
    setIsEditing(false);
  };

  const toggleVisibility = (key: string) => {
    setLayout((prev: ManagerLayout) => ({
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
    setLayout((prev: ManagerLayout) => ({ ...prev, statsOrder: newOrder }));
  };

  const [activeTab, setActiveTab] = useState(defaultTab);

  // Stat Card Components Map
  const statCards = {
    myTasks: (
      <Card className={!layout.visible.myTasks && isEditing ? "opacity-50 border-dashed" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('myTasks')}</CardTitle>
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.stats.myActiveTasks}</div>
          <p className="text-xs text-muted-foreground">{t('assignedToMe')}</p>
        </CardContent>
      </Card>
    ),
    pendingRequests: (
      <Card className={!layout.visible.pendingRequests && isEditing ? "opacity-50 border-dashed" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('pendingRequests')}</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.stats.pendingRequests}</div>
          <p className="text-xs text-muted-foreground">{t('requiresAttention')}</p>
        </CardContent>
      </Card>
    ),
    teamMembers: (
      <Card className={!layout.visible.teamMembers && isEditing ? "opacity-50 border-dashed" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('teamMembers')}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.stats.teamSize}</div>
          <p className="text-xs text-muted-foreground">{t('activeEmployees')}</p>
        </CardContent>
      </Card>
    ),
    systemStatus: (
      <Card className={!layout.visible.systemStatus && isEditing ? "opacity-50 border-dashed" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('systemStatus')}</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{t('online')}</div>
          <p className="text-xs text-muted-foreground">{t('allSystemsOperational')}</p>
        </CardContent>
      </Card>
    )
  };

  const allBriefs: Brief[] = data.briefs || [];
  const deliverablesByClientMap = allBriefs.reduce(
    (
      map: Map<
        string,
        {
          client: string;
          campaign: string | null;
          total: number;
          inProgress: number;
          approved: number;
        }
      >,
      brief,
    ) => {
      const meta: any = (brief as any).metadata || {};
      const clientName = String(meta.client || "Unassigned client");
      const campaignTitle = meta.campaign ? String(meta.campaign) : null;
      const key = `${clientName}__${campaignTitle || ""}`;
      let row = map.get(key);
      if (!row) {
        row = {
          client: clientName,
          campaign: campaignTitle,
          total: 0,
          inProgress: 0,
          approved: 0,
        };
        map.set(key, row);
      }
      row.total += 1;
      if (brief.status === "approved" || brief.status === "scheduled") {
        row.approved += 1;
      } else {
        row.inProgress += 1;
      }
      return map;
    },
    new Map<
      string,
      {
        client: string;
        campaign: string | null;
        total: number;
        inProgress: number;
        approved: number;
      }
    >(),
  );

  const deliverablesByClient = Array.from(deliverablesByClientMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const managerTabs = [
    {
      value: "overview",
      label: t("overview"),
      icon: LayoutDashboard,
      description: "Your team dashboard overview"
    },
    {
      value: "tasks",
      label: t("tasks"),
      icon: CheckSquare,
      description: "Tasks for you and your team"
    },
    {
      value: "support",
      label: t("support"),
      icon: CreditCard,
      description: "Client support tickets"
    },
    {
      value: "services",
      label: t("services"),
      icon: Briefcase,
      description: "Service delivery and requests"
    },
    {
      value: "messages",
      label: t("messages"),
      icon: MessageSquare,
      description: "Team messages and DMs"
    },
    {
      value: "team",
      label: t("team"),
      icon: Users,
      description: "Manage your team"
    },
    {
      value: "clients",
      label: t("clients"),
      icon: Briefcase,
      href: "/dashboard/business",
      description: "Client accounts you manage"
    },
    {
      value: "schedule",
      label: t("schedule"),
      icon: Calendar,
      href: "/dashboard/calendar",
      description: "Schedule and calendar"
    },
    {
      value: "more",
      label: "More",
      icon: ExternalLink,
      description: "Additional manager tools"
    }
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isTeamPage ? t('team') : t('dashboard')}</h1>
          <p className="text-muted-foreground">
            {isTeamPage ? t('manageTeamRoles') : t('manageTeamTasks')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X className="mr-2 h-4 w-4" />
                {t('cancel')}
              </Button>
              <Button onClick={saveLayout} size="sm">
                <Save className="mr-2 h-4 w-4" />
                {t('saveChanges')}
              </Button>
            </div>
          ) : (
            !isTeamPage && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                {t('editAccount')}
              </Button>
            )
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto overflow-y-visible border-b pb-2">
          <Button
            variant={activeTab === "overview" ? "secondary" : "ghost"}
            onClick={() => setActiveTab("overview")}
            className="gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={["tasks", "briefs", "services", "support"].includes(activeTab) ? "secondary" : "ghost"}
                className="gap-2"
              >
                <Briefcase className="h-4 w-4" />
                Work
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setActiveTab("tasks")}>
                <CheckSquare className="mr-2 h-4 w-4" />
                Tasks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("briefs")}>
                <FileText className="mr-2 h-4 w-4" />
                Briefs
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("services")}>
                <Activity className="mr-2 h-4 w-4" />
                Services
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("support")}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Support
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/calendar">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={["team"].includes(activeTab) ? "secondary" : "ghost"}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                People
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setActiveTab("team")}>
                <Users className="mr-2 h-4 w-4" />
                Team
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/business">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Accounts
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
          {/* Stats Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {layout.statsOrder.map((key: string, index: number) => {
              const isVisible = layout.visible[key as keyof typeof layout.visible];
              
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

          <ClientPerformanceRollup clients={data.clients} />

          <div className="grid gap-6 md:grid-cols-7">
            {/* My Recent Tasks */}
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
                    <CardTitle>{t('myTasks')}</CardTitle>
                    <CardDescription>{t('yourRecentWorkItems')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                     {data.myWorkItems.slice(0, 5).map((item) => (
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
                                 Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No date'}
                               </div>
                            </div>
                          </div>
                          <Badge variant={item.status === 'todo' ? 'outline' : 'secondary'}>{item.status}</Badge>
                        </div>
                     ))}
                     {data.myWorkItems.length === 0 && (
                       <div className="text-center py-6 text-muted-foreground">{t('noTasksAssigned')}</div>
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
                    <CardTitle>{t('teamMembers')}</CardTitle>
                    <CardDescription>{t('recentlyActive')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-4">
                       {data.employees.slice(0, 5).map((user) => (
                         <div key={user._id} className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <Avatar className="h-8 w-8">
                             <AvatarFallback 
                               style={{ background: generateBlueGradient(user.email) }}
                               className="text-white"
                             >
                               {(user.name?.[0] || user.email?.[0] || "?").toUpperCase()}
                             </AvatarFallback>
                           </Avatar>
                             <div>
                               <div className="font-medium text-sm">{user.name || 'Unnamed'}</div>
                               <div className="text-xs text-muted-foreground">{user.email}</div>
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          
          {deliverablesByClient.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Deliverables by client</CardTitle>
                <CardDescription>Snapshot of briefs and deliverables per account.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {deliverablesByClient.map((row, index) => (
                    <div
                      key={`${row.client}-${row.campaign || "none"}-${index}`}
                      className="flex items-center justify-between border-b last:border-0 py-2 text-sm"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {row.client}
                          {row.campaign ? ` • ${row.campaign}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          <span>Total {row.total}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          <span>In progress {row.inProgress}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span>Approved {row.approved}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>

        <TabsContent value="briefs">
          <BriefsTab
            briefs={data.briefs || []}
            editors={data.employees.map((e: any) => ({
              id: String(e._id || e.id || ""),
              name: String(e.name || e.email || "Unnamed"),
            }))}
            createBriefAction={actions.createBrief}
            approveBriefAction={actions.approveBrief}
            rejectBriefAction={actions.rejectBrief}
          />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksTab 
            openWorkItems={data.teamWorkItems || [...data.unassignedWorkItems, ...data.myWorkItems]}
            unassignedWorkItems={data.unassignedWorkItems}
            employees={data.employees}
            capabilities={{
              canCreate: capabilities.canCreateTasks,
              canAssign: capabilities.canAssign
            }}
            actions={{
              createWorkItem: actions.createWorkItem,
              assignWorkItem: actions.assignWorkItem,
              updateStatus: actions.updateStatus
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
            clients={data.clients}
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
            basePath="/dashboard/manager"
            actions={{
              createOrOpenDmThread: actions.createOrOpenDmThread,
            }}
          />
        </TabsContent>

        <TabsContent value="team">
          <TeamTab 
            employees={data.employees}
            capabilities={{
              canInvite: capabilities.canInvite
            }}
            actions={{
              inviteEmployee: actions.inviteEmployee
            }}
          />
        </TabsContent>

        <TabsContent value="more" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>More navigation</CardTitle>
              <CardDescription>Additional manager pages.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href="/dashboard/documents" className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:border-primary hover:bg-primary/5 transition-colors">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Documents</span>
                </Link>
                <Link href="/dashboard/analytics" className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:border-primary hover:bg-primary/5 transition-colors">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span>Analytics</span>
                </Link>
                <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:border-primary hover:bg-primary/5 transition-colors">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
