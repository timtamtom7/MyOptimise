"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, ArrowUpRight, DollarSign, CheckCircle, Clock } from "lucide-react";
import { ClientPerformanceRollup } from "@/components/dashboard/admin/client-performance-rollup";

interface ReportsTabProps {
  deliverables?: any[];
  editorPayouts?: any[];
  clients?: any[];
  invoices?: any[];
}

export function ReportsTab({ deliverables = [], editorPayouts = [], clients = [], invoices = [] }: ReportsTabProps) {
  // Calculate Pipeline Analytics
  const totalDeliverables = deliverables.length;
  const completedDeliverables = deliverables.filter(d => d.status === "approved" || d.status === "scheduled").length;
  const completionRate = totalDeliverables > 0 ? Math.round((completedDeliverables / totalDeliverables) * 100) : 0;
  
  const statusCounts = deliverables.reduce((acc: any, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  // Calculate Revenue Analytics
  const totalRevenue = invoices
    .filter(inv => inv.status === "paid")
    .reduce((acc, inv) => acc + (inv.amount || inv.totalAmount || 0), 0);
  
  const lastMonthRevenue = invoices
    .filter(inv => {
      if (inv.status !== "paid") return false;
      const date = new Date(inv.issueDate || inv.issuedDate);
      const now = new Date();
      return date.getMonth() === now.getMonth() - 1 && date.getFullYear() === now.getFullYear();
    })
    .reduce((acc, inv) => acc + (inv.amount || inv.totalAmount || 0), 0);

  // Calculate Editor Analytics
  const totalPayouts = editorPayouts.reduce((acc, row) => acc + row.totalEarned, 0);
  const totalJobs = editorPayouts.reduce((acc, row) => acc + row.jobsCompleted, 0);

  // Calculate Upcoming Schedule
  const upcomingSchedule = deliverables
    .filter(d => d.status === "scheduled" && d.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-emerald-500";
      case "approved": return "bg-green-500";
      case "client_review": return "bg-blue-500";
      case "internal_review": return "bg-blue-500";
      case "changes_requested": return "bg-red-500";
      default: return "bg-slate-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {lastMonthRevenue > 0 ? `Last month: $${lastMonthRevenue.toLocaleString()}` : "No revenue last month"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Volume</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeliverables}</div>
            <p className="text-xs text-muted-foreground">
              {completedDeliverables} completed ({completionRate}%)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Editor Payouts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPayouts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {totalJobs} completed jobs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              {clients.filter(c => c.latestAnalytics?.length > 0).length} with active analytics
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Pipeline Stages</CardTitle>
            <CardDescription>Current distribution of deliverables.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(statusCounts).map(([status, count]: [string, any]) => (
                <div key={status} className="flex items-center">
                  <div className="w-[100px] text-sm font-medium capitalize">
                    {status.replace(/_/g, " ")}
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden mx-2">
                    <div 
                      className={`h-full rounded-full ${getStatusColor(status)}`}
                      style={{ width: `${(count / totalDeliverables) * 100}%` }}
                    />
                  </div>
                  <div className="w-[40px] text-right text-sm text-muted-foreground">
                    {count}
                  </div>
                </div>
              ))}
              {totalDeliverables === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No deliverables in pipeline.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
            <CardDescription>Next scheduled deliverables.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingSchedule.map((item) => (
                <div key={item._id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none truncate max-w-[150px]">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.clientName}</p>
                  </div>
                  <div className="text-xs text-right">
                    <div className="font-medium text-emerald-600">
                      {new Date(item.scheduledAt).toLocaleDateString()}
                    </div>
                    <div className="text-muted-foreground">
                      {new Date(item.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {upcomingSchedule.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No scheduled items.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-7 md:col-span-3 lg:col-span-7">
          <CardHeader>
            <CardTitle>Top Editors</CardTitle>
            <CardDescription>
              Highest earning editors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {editorPayouts
                .sort((a, b) => b.totalEarned - a.totalEarned)
                .slice(0, 5)
                .map((editor) => (
                <div key={editor.editorId} className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{editor.editorName}</p>
                    <p className="text-sm text-muted-foreground">
                      {editor.jobsCompleted} jobs
                    </p>
                  </div>
                  <div className="ml-auto font-medium">${editor.totalEarned.toLocaleString()}</div>
                </div>
              ))}
              {editorPayouts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No editor data available.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ClientPerformanceRollup clients={clients} />
    </div>
  );
}
