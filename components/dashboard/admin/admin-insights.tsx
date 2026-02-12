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
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <span className="font-medium">AI Analysis Active</span>
        </div>
        <Skeleton className="h-20 w-full bg-white/5" />
        <Skeleton className="h-12 w-full bg-white/5" />
      </div>
    );
  }

  if (!data || data.insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Sparkles className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
        <p className="text-muted-foreground">No critical insights detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                {data.insights.length} Active
            </Badge>
         </div>
      </div>

      <div className="space-y-4">
        {data.insights.map((insight) => (
          <div
            key={insight.id}
            className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg mt-1 ${
                  insight.severity === "high" ? "bg-red-500/10 text-red-500" :
                  insight.severity === "medium" ? "bg-orange-500/10 text-orange-500" :
                  "bg-blue-500/10 text-blue-500"
              }`}>
                {insight.severity === "high" ? <AlertTriangle className="h-4 w-4" /> :
                 insight.type === "risk" ? <UserX className="h-4 w-4" /> :
                 <Sparkles className="h-4 w-4" />}
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground">{insight.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insight.description}
                </p>
                
                {insight.actionLabel && (
                    <div className="mt-3 text-sm bg-black/20 rounded-lg p-3 border border-white/5 flex items-center gap-2">
                        <span className="font-semibold text-primary">Action: </span>
                        <span>{insight.actionLabel}</span>
                        <ArrowRight className="h-3 w-3 opacity-50" />
                    </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
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
