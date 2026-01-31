"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import { generateBlueGradient } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  X,
  Calendar as CalendarIcon,
  PenTool,
  DollarSign,
  TrendingUp,
  BarChart3,
  Settings,
  HelpCircle,
  ShieldAlert,
  LogOut,
  Briefcase,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
import { ReportsTab } from "../shared/reports-tab";
import { FinancialsTab } from "./financials-tab";
import { ClientPerformanceRollup } from "./client-performance-rollup";
import { AdminInsights } from "./admin-insights";
import { TeamTab } from "../manager/team-tab";
import { CalendarView } from "../calendar/calendar-view";
import { PipelineTab } from "./pipeline-tab";

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
    clientWorkload: {
      clientName: string;
      clientEmail: string;
      activeTasks: number;
      highPriority: number;
      overdue: number;
    }[];
    editorPayouts: {
      editorId: string;
      editorName: string;
      editorEmail: string;
      totalEarned: number;
      jobsCompleted: number;
      activeJobs: number;
    }[];
    stats: {
      totalUsers: number;
      activeTasks: number;
      pendingRequests: number;
      totalRevenue: number;
    };
    currentUser: {
      name: string;
      email: string;
    };
    calendar: {
      items: any[];
      effectiveAcct: any;
      effectiveType: string;
      isImpersonating: boolean;
      canWrite: boolean;
      canCreate: boolean;
      canUpdateAny: boolean;
      canUpdateTeam: boolean;
      canUpdateOwn: boolean;
      canDeleteAny: boolean;
      canRequestDateChange: boolean;
      allowParticipantIds: boolean;
      allowClientVisibility: boolean;
      isAdmin: boolean;
      isManager: boolean;
      isEmployee: boolean;
      isClient: boolean;
      acctId: string;
    };
    deliverables: any[];
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
    updateDeliverableStatus: (formData: FormData) => Promise<any>;
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
  const { t } = useTranslation();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  interface AdminLayout {
    statsOrder: string[];
    visible: {
      totalUsers: boolean;
      activeTasks: boolean;
      pendingRequests: boolean;
      systemHealth: boolean;
      recentTasksList: boolean;
      teamList: boolean;
    };
  }

  const defaultLayout: AdminLayout = {
    statsOrder: ["totalUsers", "activeTasks", "pendingRequests", "systemHealth"],
    visible: {
      totalUsers: true,
      activeTasks: true,
      pendingRequests: true,
      systemHealth: true,
      recentTasksList: true,
      teamList: true
    }
  };

  const [layout, setLayout] = useState<AdminLayout>(() => {
    if (typeof window === "undefined") return defaultLayout;
    const saved = window.localStorage.getItem("admin-dashboard-layout");
    if (!saved) return defaultLayout;
    try {
      const parsed = JSON.parse(saved);
      return { ...defaultLayout, ...parsed, visible: { ...defaultLayout.visible, ...parsed.visible } };
    } catch (e) {
      console.error("Failed to parse layout", e);
      return defaultLayout;
    }
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [scheduleDeliverable, setScheduleDeliverable] = useState<any | null>(null);

  const deliverableStatusCounts = data.deliverables.reduce((acc: Record<string, number>, d: any) => {
    const key = String(d.status || "drafting");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const approvedDeliverables = data.deliverables.filter((d: any) => String(d.status || "") === "approved");

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const getApprovalTimestamp = (d: any): string | null => {
    const history = Array.isArray(d.statusHistory) ? d.statusHistory : [];
    const approvals = history.filter((h: any) => String(h.toStatus || "") === "approved" && h.changedAt);
    if (approvals.length > 0) {
      const last = approvals[approvals.length - 1];
      return String(last.changedAt || "");
    }
    const fallback = d._updatedAt || d.createdAt;
    return fallback ? String(fallback) : null;
  };

  const recentApprovedDeliverables = approvedDeliverables.filter((d: any) => {
    const timestamp = getApprovalTimestamp(d);
    if (!timestamp) return false;
    const dt = new Date(timestamp);
    if (Number.isNaN(dt.getTime())) return false;
    return dt >= thirtyDaysAgo;
  });

  const totalApprovedPayout = approvedDeliverables.reduce((sum: number, d: any) => {
    const price = typeof d.price === "number" ? d.price : 0;
    return sum + price;
  }, 0);

  const recentApprovedPayout = recentApprovedDeliverables.reduce((sum: number, d: any) => {
    const price = typeof d.price === "number" ? d.price : 0;
    return sum + price;
  }, 0);

  const payoutByEditorMap = recentApprovedDeliverables.reduce((map: Map<string, any>, d: any) => {
    const email = String(d.assigneeEmail || "");
    if (!email) return map;
    const existing = map.get(email) || {
      editorEmail: email,
      editorName: d.assigneeName || email,
      totalEarned: 0,
      jobsCompleted: 0,
    };
    const price = typeof d.price === "number" ? d.price : 0;
    existing.totalEarned += price;
    existing.jobsCompleted += 1;
    map.set(email, existing);
    return map;
  }, new Map<string, any>());

  const topEditorsByPayout = Array.from(payoutByEditorMap.values())
    .sort((a, b) => b.totalEarned - a.totalEarned)
    .slice(0, 3);

  // Save to localStorage
  const saveLayout = () => {
    localStorage.setItem("admin-dashboard-layout", JSON.stringify(layout));
    setIsEditing(false);
  };

  const toggleVisibility = (key: string) => {
    setLayout((prev: AdminLayout) => ({
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
    setLayout((prev: AdminLayout) => ({ ...prev, statsOrder: newOrder }));
  };

  // Stat Card Components Map
  const statCards = {
    totalUsers: (
      <Card className={!layout.visible.totalUsers && isEditing ? "opacity-50 border-dashed" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('totalUsers')}</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            {t('acrossAllRoles')}
          </p>
        </CardContent>
      </Card>
    ),
    activeTasks: (
      <Card className={!layout.visible.activeTasks && isEditing ? "opacity-50 border-dashed" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('activeTasks')}</CardTitle>
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.stats.activeTasks}</div>
          <p className="text-xs text-muted-foreground">
            {data.unassignedWorkItems.length} {t('unassigned')}
          </p>
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
          <p className="text-xs text-muted-foreground">
            {t('requiresAttention')}
          </p>
        </CardContent>
      </Card>
    ),
    systemHealth: (
      <Card className={!layout.visible.systemHealth && isEditing ? "opacity-50 border-dashed" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('systemHealth')}</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">98%</div>
          <p className="text-xs text-muted-foreground">
            {t('operational')}
          </p>
        </CardContent>
      </Card>
    )
  };

  const adminTabs = [
    {
      value: "overview",
      label: t("overview"),
      icon: LayoutDashboard,
      description: "High-level stats and activity"
    },
    {
      value: "tasks",
      label: t("tasks"),
      icon: CheckSquare,
      description: "Work items and queues"
    },
    {
      value: "support",
      label: t("support"),
      icon: CreditCard,
      description: "Client support requests"
    },
    {
      value: "services",
      label: t("services"),
      icon: Briefcase,
      description: "Services and packages"
    },
    {
      value: "messages",
      label: t("messages"),
      icon: MessageSquare,
      description: "Internal messages and DMs"
    },
    {
      value: "accounts",
      label: t("accounts"),
      icon: Users,
      description: "Team and client accounts"
    },
    {
      value: "financials",
      label: t("financials"),
      icon: DollarSign,
      description: "Invoices and billing"
    },
    {
      value: "clients",
      label: t("clients"),
      icon: Briefcase,
      href: "/dashboard/business",
      description: "Client businesses overview"
    },
    {
      value: "calendar",
      label: t("schedule"),
      icon: CalendarIcon,
      description: "Team schedule and events"
    },
    {
      value: "system",
      label: t("system"),
      icon: Cpu,
      condition: capabilities.canManageFeatureFlags,
      description: "Feature flags and system controls"
    },
    {
      value: "audit",
      label: t("auditLogs"),
      icon: ShieldAlert,
      condition: capabilities.canViewLogs,
      description: "Audit logs and history"
    },
    {
      value: "more",
      label: "More",
      icon: ExternalLink,
      description: "More admin tools"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            {t('welcomeMessage')} {data.currentUser.name}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto overflow-y-visible border-b pb-2 px-2">
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
                variant={["tasks", "services", "support", "schedule", "pipeline"].includes(activeTab) ? "secondary" : "ghost"}
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
              <DropdownMenuItem onClick={() => setActiveTab("pipeline")}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Pipeline
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("services")}>
                <Activity className="mr-2 h-4 w-4" />
                Services
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("support")}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Support
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setScheduleDeliverable(null);
                  setActiveTab("schedule");
                }}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Schedule
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={["accounts", "employees"].includes(activeTab) ? "secondary" : "ghost"}
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                People
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setActiveTab("accounts")}>
                <Users className="mr-2 h-4 w-4" />
                Accounts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("employees")}>
                <Shield className="mr-2 h-4 w-4" />
                Team
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={["financials", "reports", "clients"].includes(activeTab) ? "secondary" : "ghost"}
                className="gap-2"
              >
                <DollarSign className="h-4 w-4" />
                Business
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => router.push("/dashboard/business")}>
                <Users className="mr-2 h-4 w-4" />
                Clients
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("financials")}>
                <DollarSign className="mr-2 h-4 w-4" />
                Financials
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("reports")}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Reports
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={["system", "audit"].includes(activeTab) ? "secondary" : "ghost"}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                System
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setActiveTab("system")}>
                <Cpu className="mr-2 h-4 w-4" />
                System Health
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab("audit")}>
                <ShieldAlert className="mr-2 h-4 w-4" />
                Audit Logs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {layout.statsOrder.map((key: string, index: number) => {
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

          <AdminInsights />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">Production Snapshot</CardTitle>
                <CardDescription>Deliverables pipeline and editor payout from approved work</CardDescription>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">Deliverables by status</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center justify-between rounded-md border px-2 py-1.5 bg-muted/40">
                      <span>Drafting</span>
                      <span className="font-semibold">{deliverableStatusCounts["drafting"] || 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-md border px-2 py-1.5 bg-muted/40">
                      <span>Internal review</span>
                      <span className="font-semibold">{deliverableStatusCounts["internal_review"] || 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-md border px-2 py-1.5 bg-muted/40">
                      <span>Client review</span>
                      <span className="font-semibold">{deliverableStatusCounts["client_review"] || 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-md border px-2 py-1.5 bg-muted/40">
                      <span>Approved</span>
                      <span className="font-semibold">{deliverableStatusCounts["approved"] || 0}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-md border px-2 py-1.5 bg-muted/40">
                      <span>Changes requested</span>
                      <span className="font-semibold">{deliverableStatusCounts["changes_requested"] || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-muted-foreground">Editor payout (approved deliverables)</div>
                    <div className="text-base font-semibold">
                      ${recentApprovedPayout.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Last 30 days, all clients. All time: ${totalApprovedPayout.toLocaleString()}
                  </div>
                  <div className="space-y-1.5">
                    {topEditorsByPayout.length === 0 ? (
                      <div className="text-xs text-muted-foreground">
                        No approved deliverables with payout in the last 30 days yet.
                      </div>
                    ) : (
                      topEditorsByPayout.map((editor) => (
                        <div key={editor.editorEmail} className="flex items-center justify-between rounded-md border px-2 py-1.5 bg-muted/40 text-xs">
                          <div>
                            <div className="font-medium">{editor.editorName}</div>
                            <div className="text-[10px] text-muted-foreground">{editor.editorEmail}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              ${editor.totalEarned.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {editor.jobsCompleted} approved
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <ClientPerformanceRollup clients={data.accounts.filter(a => a.type === 'client')} />

          {/* Client Workload */}
          <div className="md:col-span-7">
            <Card>
              <CardHeader>
                <CardTitle>{t('clientWorkload') || "Client Workload"}</CardTitle>
                <CardDescription>{t('clientWorkloadDesc') || "Active tasks and bottlenecks per client"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.clientWorkload.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">{t('noActiveClientTasks') || "No active client tasks"}</div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {data.clientWorkload.map((client) => (
                        <div key={client.clientName} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-medium">{client.clientName}</div>
                            <div className="text-xs text-muted-foreground">{client.clientEmail}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">{client.activeTasks} <span className="text-xs font-normal text-muted-foreground">tasks</span></div>
                            <div className="flex gap-2 text-xs justify-end">
                              {client.highPriority > 0 && (
                                <span className="text-red-600 font-medium">{client.highPriority} High</span>
                              )}
                              {client.overdue > 0 && (
                                <span className="text-orange-600 font-medium">{client.overdue} Overdue</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
                    <CardTitle>{t('recentTasks')}</CardTitle>
                    <CardDescription>{t('latestWorkItems')}</CardDescription>
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
                                {item.assigneeName ? `${t('assignedToMe')} ${item.assigneeName}` : t('unassigned')}
                              </div>
                            </div>
                          </div>
                          <Badge variant={item.status === 'todo' ? 'outline' : 'secondary'}>{item.status}</Badge>
                        </div>
                    ))}
                    {data.openWorkItems.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">{t('noActiveTasks')}</div>
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
                    <CardDescription>{t('recentlyActiveUsers')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.accounts.slice(0, 5).map((user) => (
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

        <TabsContent value="schedule">
          {data.calendar ? (
            <CalendarView {...data.calendar} initialDeliverable={scheduleDeliverable || undefined} />
          ) : (
            <div className="text-center py-10 text-muted-foreground">Loading calendar...</div>
          )}
        </TabsContent>

        <TabsContent value="financials" className="space-y-4">
          <FinancialsTab 
            invoices={data.invoices || []} 
            clients={data.accounts.filter(a => a.type === 'client')}
            editorPayouts={data.editorPayouts || []} 
          />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab 
            deliverables={data.deliverables}
            editorPayouts={data.editorPayouts}
            clients={data.accounts.filter(a => a.type === "client")}
            invoices={data.invoices}
          />
        </TabsContent>

        <TabsContent value="more" className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle>More navigation</CardTitle>
              <CardDescription>Jump to additional admin pages.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href="/dashboard/admin" className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:border-primary hover:bg-primary/5 transition-colors">
                  <>
                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                    <span>Admin dashboard</span>
                  </>
                </Link>
                <Link href="/dashboard/team" className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:border-primary hover:bg-primary/5 transition-colors">
                  <>
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Team</span>
                  </>
                </Link>
                <Link href="/dashboard/documents" className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:border-primary hover:bg-primary/5 transition-colors">
                  <>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Documents</span>
                  </>
                </Link>
                <Link href="/dashboard/content" className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:border-primary hover:bg-primary/5 transition-colors">
                  <>
                    <PenTool className="h-4 w-4 text-muted-foreground" />
                    <span>Content</span>
                  </>
                </Link>
                <Link href="/dashboard/sales" className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:border-primary hover:bg-primary/5 transition-colors">
                  <>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>Sales</span>
                  </>
                </Link>
                <Link href="/dashboard/finance" className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:border-primary hover:bg-primary/5 transition-colors">
                  <>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>Finance</span>
                  </>
                </Link>
                <Link href="/dashboard/analytics" className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:border-primary hover:bg-primary/5 transition-colors">
                  <>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span>Analytics</span>
                  </>
                </Link>
                <Link href="/dashboard/admin/audit" className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:border-primary hover:bg-primary/5 transition-colors">
                  <>
                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    <span>Audit logs</span>
                  </>
                </Link>
                <Link href="/dashboard/admin/permissions" className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:border-primary hover:bg-primary/5 transition-colors">
                  <>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>Permissions</span>
                  </>
                </Link>
                <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:border-primary hover:bg-primary/5 transition-colors">
                  <>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span>Settings</span>
                  </>
                </Link>
                <Link href="/dashboard/help" className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm hover:border-primary hover:bg-primary/5 transition-colors">
                  <>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    <span>Help</span>
                  </>
                </Link>
                <Link href="/logout" className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm text-red-600 hover:border-red-500 hover:bg-red-50 transition-colors">
                  <>
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <PipelineTab 
            deliverables={data.deliverables} 
            capabilities={{ canWrite: capabilities.canManageServices }} 
            actions={actions}
            onScheduleClick={(deliverable) => {
              setScheduleDeliverable(deliverable);
              setActiveTab("schedule");
            }}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
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

        <TabsContent value="employees">
          <TeamTab 
            employees={data.employees}
            capabilities={{
              canInvite: capabilities.canInvite
            }}
            actions={{
              inviteEmployee: actions.inviteGoogleAccount
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
