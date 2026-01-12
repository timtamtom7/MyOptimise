"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

export function AnalyticsChart({ data }: { data: any[] }) {
  // Simple transformation: sort by date
  const chartData = [...data].sort((a, b) => new Date(a.metricDate).getTime() - new Date(b.metricDate).getTime());

  // Group by metric if multiple metrics exist
  // For MVP, assume one metric or just plot "value"
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Trends</CardTitle>
      </CardHeader>
      <CardContent className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
             <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="metricDate" 
              tickFormatter={(val) => new Date(val).toLocaleDateString()} 
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              labelFormatter={(val) => new Date(val).toLocaleDateString()}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#2563eb" 
              strokeWidth={3} 
              dot={{ r: 4, fill: "#2563eb" }}
              activeDot={{ r: 6 }}
              name="Metric Value"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
