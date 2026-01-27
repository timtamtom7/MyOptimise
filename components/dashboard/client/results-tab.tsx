"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";

interface AnalyticsRecord {
  _id: string;
  metric: string;
  value: number;
  period?: string;
  metricDate?: string;
  note?: string;
}

interface ResultsTabProps {
  analytics: AnalyticsRecord[];
}

export function ResultsTab({ analytics }: ResultsTabProps) {
  const hasAnalytics = analytics && analytics.length > 0;

  const latestByMetric: Record<string, AnalyticsRecord> = {};
  if (hasAnalytics) {
    for (const record of analytics) {
      const key = record.metric || "Metric";
      const existing = latestByMetric[key];
      const currentDate = record.metricDate ? new Date(record.metricDate).getTime() : 0;
      const existingDate = existing && existing.metricDate ? new Date(existing.metricDate).getTime() : -1;
      if (!existing || currentDate > existingDate) {
        latestByMetric[key] = record;
      }
    }
  }

  const metricEntries = Object.entries(latestByMetric);

  const sortedRecent = hasAnalytics
    ? [...analytics].sort((a, b) => {
        const aDate = a.metricDate ? new Date(a.metricDate).getTime() : 0;
        const bDate = b.metricDate ? new Date(b.metricDate).getTime() : 0;
        return bDate - aDate;
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {hasAnalytics ? (
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {analytics[0].value?.toLocaleString?.() ?? analytics[0].value}
                </div>
                <p className="text-xs text-muted-foreground">
                  Latest metric: {analytics[0].metric || "Activity"}
                </p>
                {analytics[0].metricDate && (
                  <p className="text-xs text-muted-foreground">
                    Last updated on {new Date(analytics[0].metricDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Once your social accounts are connected, a live summary of followers, reach or other agreed metrics will appear here.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Key metrics</CardTitle>
            <CardDescription>
              The latest values for each metric we are tracking for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metricEntries.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No metrics yet. As data comes in, you will see one row per metric with its most recent value.
              </p>
            ) : (
              <div className="space-y-3">
                {metricEntries.map(([metric, record]) => (
                  <div
                    key={metric}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium capitalize">{metric.replace(/_/g, " ")}</span>
                      <span className="text-xs text-muted-foreground">
                        {record.metricDate
                          ? `Last updated ${new Date(record.metricDate).toLocaleDateString()}`
                          : "No date recorded"}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-lg font-semibold">
                          {record.value?.toLocaleString?.() ?? record.value}
                        </span>
                        {record.period && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {record.period}
                          </Badge>
                        )}
                      </div>
                      {record.note && (
                        <div className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                          {record.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-medium">Recent results</CardTitle>
            <CardDescription>Most recent data points across all metrics.</CardDescription>
          </div>
          {hasAnalytics && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {sortedRecent.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              As your campaigns run, this section will show a simple list of recent performance numbers by date.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-4 text-left font-medium">Date</th>
                    <th className="py-2 pr-4 text-left font-medium">Metric</th>
                    <th className="py-2 pr-4 text-left font-medium">Value</th>
                    <th className="py-2 pr-4 text-left font-medium">Period</th>
                    <th className="py-2 text-left font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecent.slice(0, 20).map((record) => (
                    <tr key={record._id} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-xs">
                        {record.metricDate
                          ? new Date(record.metricDate).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="py-2 pr-4 capitalize">
                        {record.metric ? record.metric.replace(/_/g, " ") : "Metric"}
                      </td>
                      <td className="py-2 pr-4">
                        {record.value?.toLocaleString?.() ?? record.value}
                      </td>
                      <td className="py-2 pr-4 text-xs">
                        {record.period ? record.period : "Single"}
                      </td>
                      <td className="py-2 text-xs text-muted-foreground max-w-xs">
                        {record.note || "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

