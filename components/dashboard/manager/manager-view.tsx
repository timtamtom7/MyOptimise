"use client";

import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
import {
  Users,
  CheckSquare,
  Activity,
  CreditCard,
  Sparkles,
  Zap,
  TrendingUp,
  ArrowRight,
  Shield,
  Briefcase
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ClientPerformanceRollup } from "../admin/client-performance-rollup";
import { Brief } from "@/types/briefs";
import { Button } from "@/components/ui/button";

interface ManagerViewProps {
  data: {
    employees: any[];
    clients: any[];
    myWorkItems: any[];
    briefs?: Brief[];
    stats: {
      myActiveTasks: number;
      pendingRequests: number;
      teamSize: number;
    };
    [key: string]: any; 
  };
}

export function ManagerView({ data }: ManagerViewProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-medium tracking-tighter text-foreground">
            Manager<span className="text-blue-500">.</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-2 font-medium">
            Team performance and project oversight.
          </p>
        </div>
        
        <div className="flex gap-3">
            <Button variant="outline" className="rounded-full border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all duration-300 hover:scale-105 active:scale-95">
                <Users className="mr-2 h-4 w-4" />
                Team
            </Button>
            <Button className="rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-105 active:scale-95">
                <Zap className="mr-2 h-4 w-4" />
                New Task
            </Button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Primary Focus: Active Tasks (Hero Card) */}
        <div className="col-span-1 md:col-span-8 relative overflow-hidden rounded-[2rem] p-8 md:p-12 min-h-[300px] bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl transition-all hover:scale-[1.01] duration-500 group">
             {/* Abstract Background Decoration */}
             <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/20 to-sky-500/20 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
             
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-full bg-blue-500/20 text-blue-500 backdrop-blur-md">
                            <Briefcase className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-medium tracking-widest uppercase text-blue-500/80">Active Workload</span>
                    </div>
                    
                    <h2 className="text-3xl md:text-5xl font-light tracking-tight mb-4">
                        {data.stats.myActiveTasks} <span className="text-muted-foreground">Active Tasks</span>
                    </h2>
                    <p className="text-muted-foreground max-w-md text-lg font-light leading-relaxed">
                        You have {data.stats.pendingRequests} requests requiring immediate attention. Team velocity is stable.
                    </p>
                </div>

                <div className="mt-8 flex items-center gap-4">
                    <Button variant="ghost" className="group/btn pl-0 hover:bg-transparent hover:text-blue-500 text-lg font-light">
                        View All Tasks <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                </div>
             </div>
        </div>

        {/* Secondary: Team Stats (Vertical Stack) */}
        <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
            {/* Team Size Card */}
            <div className="flex-1 rounded-[2rem] p-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-colors relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-300 opacity-50" />
                 <div className="flex justify-between items-start mb-4">
                    <Users className="h-6 w-6 text-blue-500" />
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Active</Badge>
                 </div>
                 <div className="text-4xl font-light tracking-tighter mb-1">{data.stats.teamSize}</div>
                 <div className="text-sm text-muted-foreground">Team Members</div>
            </div>

            {/* Pending Requests Card */}
            <div className="flex-1 rounded-[2rem] p-8 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/80 dark:hover:bg-white/10 transition-colors relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-sky-300 opacity-50" />
                 <div className="flex justify-between items-start mb-4">
                    <CreditCard className="h-6 w-6 text-sky-500" />
                    <Badge variant="outline" className="bg-sky-500/10 text-sky-500 border-sky-500/20">Pending</Badge>
                 </div>
                 <div className="text-4xl font-light tracking-tighter mb-1">{data.stats.pendingRequests}</div>
                 <div className="text-sm text-muted-foreground">Approval Requests</div>
            </div>
        </div>

        {/* Row 2: Performance & Activity */}
        <div className="col-span-1 md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left: Client Performance (Reusing the refined component) */}
            <div className="rounded-[2rem] p-8 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/10">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-light flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-500" />
                        Client Performance
                    </h3>
                    <Button variant="ghost" size="sm" className="h-8 text-xs">View Report</Button>
                </div>
                <ClientPerformanceRollup clients={data.clients || []} />
            </div>

            {/* Right: Recent Activity / Placeholder for now */}
            <div className="rounded-[2rem] p-8 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col">
                <h3 className="text-xl font-light mb-8 flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-blue-500" />
                    Recent Activity
                </h3>
                
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                    <Sparkles className="h-8 w-8 mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No recent activity logs available.</p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
