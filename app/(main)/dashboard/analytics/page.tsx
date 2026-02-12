import { fetchAnalytics } from "@/sanity/lib/fetch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportGenerator } from "@/components/dashboard/analytics/report-generator";
import { AnalyticsChart } from "@/components/dashboard/analytics/analytics-chart";
import { SeedButton } from "@/components/dashboard/analytics/seed-button";
import { TrendingUp, Users, DollarSign, Activity, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await fetchAnalytics();

  // Calculate summary stats
  const totalValue = data.reduce((acc: number, curr: any) => acc + (curr.value || 0), 0);
  const avgValue = data.length > 0 ? totalValue / data.length : 0;
  const latestDate = data.length > 0 ? new Date(Math.max(...data.map((d: any) => new Date(d.metricDate).getTime()))).toLocaleDateString() : "N/A";

  const metrics = [
    {
      title: "Total Impressions",
      value: totalValue.toLocaleString(),
      change: "+20.1%",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-900/10"
    },
    {
      title: "Avg. Engagement",
      value: avgValue.toFixed(1),
      change: "+4.2%",
      icon: Activity,
      color: "text-purple-500",
      bg: "bg-purple-50 dark:bg-purple-900/10"
    },
    {
      title: "Return on Ad Spend",
      value: "342%",
      change: "+12.5%",
      icon: DollarSign,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-900/10"
    },
    {
      title: "Latest Update",
      value: latestDate,
      change: "Daily Sync",
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-900/10"
    }
  ];

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground font-medium">Track performance metrics and generate client reports.</p>
              {data.length === 0 && <SeedButton />}
            </div>
         </div>
         <ReportGenerator />
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, i) => (
            <div key={i} className="group relative bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 hover:shadow-2xl transition-all hover:-translate-y-1">
                <div className="flex justify-between items-start mb-6">
                    <div className={cn("p-4 rounded-2xl", metric.bg)}>
                        <metric.icon className={cn("h-7 w-7", metric.color)} />
                    </div>
                    {metric.change && (
                        <div className="flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded-full">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            {metric.change}
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{metric.title}</p>
                    <h3 className="text-4xl font-black text-slate-900 dark:text-slate-100">{metric.value}</h3>
                </div>
            </div>
        ))}
      </div>

      <AnalyticsChart data={data} />
    </div>
  );
}
