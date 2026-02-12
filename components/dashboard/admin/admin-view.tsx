"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
import {
  Activity,
  CreditCard,
  Users,
  TrendingUp,
  AlertCircle,
  Clock,
  Zap,
  ArrowUpRight,
  Shield,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminInsights } from "./admin-insights";
import { ClientPerformanceRollup } from "./client-performance-rollup";
import { QuickActionDialog } from "../quick-action-dialog";

interface AdminViewProps {
  data: {
    accounts: any[];
    employees: any[];
    openWorkItems: any[];
    unassignedWorkItems: any[];
    openClientRequests: any[];
    currentUser: any;
    stats: {
      totalClients: number;
      activeProjects: number;
      revenue: number;
      teamSize: number;
    };
    [key: string]: any; // Catch-all for other props
  };
  actions: any;
  capabilities: any;
}

export function AdminView({ data, actions, capabilities }: AdminViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* Header Section */}
      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1 pr-12 md:pr-0">
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            {today}
          </div>
          <h1 className="text-2xl md:text-4xl font-medium tracking-tighter text-foreground">
            <span className="font-bold">Good Morning,</span> <span className="font-light">{data.currentUser?.name || "Admin"}</span>.
          </h1>
        </div>
        
        <div className="absolute top-0 right-0 md:static flex items-center gap-3">
            <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <button 
                  onClick={() => setQuickActionOpen(true)}
                  className="relative flex items-center justify-center gap-2 h-10 w-10 md:w-auto md:h-auto md:px-6 md:py-3 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/20 hover:bg-white/60 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
                >
                    <Zap className="w-5 h-5 md:w-4 md:h-4 text-primary" />
                    <span className="hidden md:inline text-sm font-medium">Quick Action</span>
                </button>
            </div>
        </div>
      </div>

      <QuickActionDialog 
        open={quickActionOpen} 
        onOpenChange={setQuickActionOpen} 
        userType="admin" 
      />

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Primary Focus Area - Strategy/Status */}
        <div className="col-span-1 md:col-span-8 relative overflow-hidden rounded-[2rem] p-8 md:p-12 min-h-[400px] flex flex-col justify-between group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-sky-500/10 to-blue-600/10 backdrop-blur-xl" />
            <div className="absolute inset-0 border border-white/20 rounded-[2rem]" />
            
            {/* Ambient decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">System Operational</span>
                </div>
                
                <h2 className="text-3xl md:text-5xl font-light tracking-tight leading-tight max-w-2xl">
                    All systems are running smoothly. <br/>
                    <span className="text-muted-foreground">You have {data.openClientRequests?.length || 0} client requests requiring attention today.</span>
                </h2>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-8 mt-12">
                <div>
                    <div className="text-sm text-muted-foreground mb-1">Active Projects</div>
                    <div className="text-3xl font-light">{data.stats?.activeProjects || 0}</div>
                </div>
                <div>
                    <div className="text-sm text-muted-foreground mb-1">Team Online</div>
                    <div className="text-3xl font-light">{data.stats?.teamSize || 0}</div>
                </div>
                <div>
                    <div className="text-sm text-muted-foreground mb-1">Efficiency</div>
                    <div className="text-3xl font-light">98%</div>
                </div>
            </div>
        </div>

        {/* Secondary Focus - Urgent / Alerts */}
        <div className="col-span-1 md:col-span-4 relative rounded-[2rem] p-8 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-light">Critical Attention</h3>
                <div className="p-2 rounded-full bg-blue-500/10 text-blue-500">
                    <AlertCircle className="w-5 h-5" />
                </div>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-none">
                {data.openClientRequests && data.openClientRequests.length > 0 ? (
                    data.openClientRequests.slice(0, 5).map((req: any, i: number) => (
                        <div key={i} className="group p-4 rounded-xl bg-background/40 hover:bg-background/60 transition-colors border border-transparent hover:border-white/10 cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">Request</span>
                                <span className="text-xs text-muted-foreground">2h ago</span>
                            </div>
                            <p className="text-sm font-medium leading-snug">{req.title || "Untitled Request"}</p>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <Shield className="w-12 h-12 mb-4 opacity-20" />
                        <p>No critical alerts.</p>
                    </div>
                )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/5">
                 <button className="w-full py-3 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity">
                    View All Alerts
                 </button>
            </div>
        </div>

        {/* Stats Strip */}
        <div className="col-span-1 md:col-span-3 rounded-[2rem] p-8 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/10 group hover:bg-white/50 transition-colors">
            <div className="flex flex-col h-full justify-between">
                <div className="p-3 bg-blue-500/10 text-blue-500 w-fit rounded-2xl mb-4">
                    <Users className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-4xl font-light tracking-tight">{data.stats?.totalClients || 0}</div>
                    <div className="text-sm text-muted-foreground mt-1">Total Clients</div>
                </div>
            </div>
        </div>

        <div className="col-span-1 md:col-span-3 rounded-[2rem] p-8 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/10 group hover:bg-white/50 transition-colors">
             <div className="flex flex-col h-full justify-between">
                <div className="p-3 bg-sky-500/10 text-sky-500 w-fit rounded-2xl mb-4">
                    <CreditCard className="w-6 h-6" />
                </div>
                <div>
                    <div className="text-4xl font-light tracking-tight">{formatCurrency(data.stats?.revenue || 0)}</div>
                    <div className="text-sm text-muted-foreground mt-1">Monthly Revenue</div>
                </div>
            </div>
        </div>

        <div className="col-span-1 md:col-span-6 rounded-[2rem] p-8 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col justify-between">
             <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                     <div className="p-3 bg-blue-500/10 text-blue-500 w-fit rounded-2xl">
                        <Activity className="w-6 h-6" />
                     </div>
                     <span className="text-lg font-light">Performance Trends</span>
                 </div>
                 <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
             </div>
             
             {/* Abstract Graph Representation */}
             <div className="flex items-end gap-2 h-24 w-full px-2">
                 {[40, 65, 45, 80, 55, 90, 75, 85, 60, 95].map((h, i) => (
                     <div 
                        key={i} 
                        className="flex-1 bg-foreground/10 rounded-t-sm hover:bg-primary/50 transition-colors"
                        style={{ height: `${h}%` }} 
                     />
                 ))}
             </div>
        </div>

      </div>

      {/* Operations Radar Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-[2rem] p-8 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/10">
               <h3 className="text-xl font-light mb-6">AI Operations Radar</h3>
               <AdminInsights data={data} />
          </div>
          <div className="rounded-[2rem] p-8 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/10">
               <h3 className="text-xl font-light mb-6">Client Performance</h3>
               <ClientPerformanceRollup 
                  clients={data.clientWorkload?.map((c: any) => ({
                    id: c.clientEmail,
                    name: c.clientName,
                    email: c.clientEmail,
                    avatar: "",
                    trend: "stable",
                    status: c.overdue > 0 ? "attention" : "healthy",
                    lastActive: "Today",
                    tasksCompleted: 0,
                    totalTasks: c.activeTasks
                  })) || []} 
               />
          </div>
      </div>

    </div>
  );
}
