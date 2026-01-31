"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Sparkles, ArrowRight, Clock, UserX } from "lucide-react";
import { generateAdminInsights, type InsightsResult, type Insight } from "@/app/actions/generate-admin-insights";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export function AdminInsights() {
  const [data, setData] = useState<InsightsResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const result = await generateAdminInsights();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch insights:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI Operations Radar
          </CardTitle>
          <CardDescription>Scanning for operational risks and opportunities...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            AI Operations Radar
          </CardTitle>
          <CardDescription>All systems normal. No critical risks detected.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-blue-100 bg-blue-50/10 dark:bg-blue-950/10 dark:border-blue-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              AI Operations Radar
            </CardTitle>
            <CardDescription>
              {data.insights.length} active alerts require attention.
            </CardDescription>
          </div>
          {data.aiSummary && (
             <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200">
                AI Analysis Active
             </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.aiSummary && (
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-lg border border-blue-100 dark:border-blue-900 shadow-sm">
            <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Strategic Summary
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.aiSummary}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {data.insights.slice(0, 5).map((insight) => (
            <InsightItem key={insight.id} insight={insight} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InsightItem({ insight }: { insight: Insight }) {
  const Icon = insight.category === "stuck_brief" ? Clock : insight.category === "quiet_client" ? UserX : AlertTriangle;
  const colorClass = insight.severity === "high" ? "text-red-500 bg-red-50 dark:bg-red-950/30" : "text-amber-500 bg-amber-50 dark:bg-amber-950/30";

  return (
    <div className="flex items-start gap-4 p-3 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
      <div className={`mt-0.5 p-2 rounded-full ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
            <p className="text-sm font-medium leading-none">{insight.title}</p>
            {insight.severity === "high" && <Badge variant="destructive" className="h-5 text-[10px] px-1.5">High Priority</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {insight.description}
        </p>
        {insight.actionUrl && (
          <Link
            href={insight.actionUrl}
            className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {insight.actionLabel || "Take Action"} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
