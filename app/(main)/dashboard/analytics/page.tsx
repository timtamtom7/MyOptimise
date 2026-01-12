import { fetchAnalytics } from "@/sanity/lib/fetch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportGenerator } from "@/components/dashboard/analytics/report-generator";
import { AnalyticsChart } from "@/components/dashboard/analytics/analytics-chart";
import { SeedButton } from "@/components/dashboard/analytics/seed-button";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await fetchAnalytics();

  // Calculate summary stats
  const totalValue = data.reduce((acc: number, curr: any) => acc + (curr.value || 0), 0);
  const avgValue = data.length > 0 ? totalValue / data.length : 0;
  const latestDate = data.length > 0 ? new Date(Math.max(...data.map((d: any) => new Date(d.metricDate).getTime()))).toLocaleDateString() : "N/A";

  return (
    <div className="flex flex-col gap-8 p-8 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics & Reporting</h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">Track performance metrics and generate client reports.</p>
              {data.length === 0 && <SeedButton />}
            </div>
         </div>
         <ReportGenerator />
      </div>
      
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Engagement</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgValue.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">+4% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">342%</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Update</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestDate}</div>
            <p className="text-xs text-muted-foreground">Daily sync active</p>
          </CardContent>
        </Card>
      </div>

      <AnalyticsChart data={data} />
    </div>
  );
}
