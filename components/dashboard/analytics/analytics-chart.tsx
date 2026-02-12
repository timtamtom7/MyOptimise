"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp } from "lucide-react";

interface AnalyticsChartProps {
  data: any[];
  title?: string;
  description?: string;
}

export function AnalyticsChart({ data, title = "Performance Trends", description = "Visualizing key metrics over time" }: AnalyticsChartProps) {
  // Simple transformation: sort by date
  const chartData = [...data].sort((a, b) => new Date(a.metricDate).getTime() - new Date(b.metricDate).getTime());

  return (
    <Card className="rounded-[3rem] border-0 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 bg-white dark:bg-slate-900 overflow-hidden">
      <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-8 pt-8 px-10 border-b border-slate-100 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="flex items-center gap-4 relative z-10">
            <div className="h-14 w-14 rounded-[1.2rem] bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <TrendingUp className="h-7 w-7" />
            </div>
            <div>
                <CardTitle className="text-2xl font-black text-slate-900 dark:text-slate-100">{title}</CardTitle>
                <CardDescription className="text-base font-medium text-slate-500 mt-1">{description}</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="h-[500px] p-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} strokeOpacity={0.5} />
            <XAxis 
              dataKey="metricDate" 
              tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} 
              tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              dy={15}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }} 
              axisLine={false}
              tickLine={false}
              dx={-15}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: "1.5rem", 
                border: "none", 
                boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)",
                padding: "16px 24px",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                color: "#0f172a"
              }}
              cursor={{ stroke: "#3b82f6", strokeWidth: 2, strokeDasharray: "4 4" }}
              labelStyle={{ color: "#64748b", marginBottom: "8px", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}
              formatter={(value: any) => [
                  <span key="val" className="text-lg font-black text-blue-600">{Number(value).toLocaleString()}</span>, 
                  <span key="label" className="text-sm font-bold text-slate-500 ml-2">Impressions</span>
              ]}
              labelFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              strokeWidth={5} 
              fillOpacity={1} 
              fill="url(#colorValue)" 
              dot={{ r: 0, fill: "#3b82f6", strokeWidth: 0 }}
              activeDot={{ r: 8, strokeWidth: 4, stroke: "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
