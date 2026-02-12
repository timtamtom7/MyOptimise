
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatDate } from "@/lib/date-formatting";

interface AnalyticsRecord {
  _id: string;
  metric: string;
  value: number;
  metricDate: string;
  period?: string;
}

interface ClientWithAnalytics {
  _id: string;
  name?: string;
  email?: string;
  avatar?: any;
  latestAnalytics?: AnalyticsRecord[];
}

interface ClientPerformanceRollupProps {
  clients: ClientWithAnalytics[];
}

export function ClientPerformanceRollup({ clients }: ClientPerformanceRollupProps) {
  // Process data to get latest values and trends for key metrics
  const clientMetrics = clients.map(client => {
    const analytics = client.latestAnalytics || [];
    
    // Sort by date descending just in case
    const sorted = [...analytics].sort((a, b) => 
      new Date(b.metricDate).getTime() - new Date(a.metricDate).getTime()
    );

    const getMetricData = (metricName: string) => {
      const records = sorted.filter(r => r.metric === metricName);
      if (records.length === 0) return null;

      const current = records[0];
      const previous = records[1]; // Simple previous record comparison

      let trend = 0;
      if (previous && previous.value > 0) {
        trend = ((current.value - previous.value) / previous.value) * 100;
      }

      return {
        value: current.value,
        date: current.metricDate,
        trend,
        hasPrevious: !!previous
      };
    };

    return {
      ...client,
      followers: getMetricData("followers"),
      reach: getMetricData("reach"),
      engagement: getMetricData("engagement")
    };
  }).filter(c => c.followers || c.reach || c.engagement); // Only show clients with some data

  if (clientMetrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <Minus className="h-8 w-8 mb-2 opacity-50" />
        <p>No analytics data available.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-white/10">
            <TableHead className="text-muted-foreground/60 font-light">Client</TableHead>
            <TableHead className="text-right text-muted-foreground/60 font-light">Followers</TableHead>
            <TableHead className="text-right text-muted-foreground/60 font-light">Reach</TableHead>
            <TableHead className="text-right text-muted-foreground/60 font-light">Engagement</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientMetrics.map((client) => (
            <TableRow key={client._id} className="hover:bg-white/5 border-white/5 transition-colors">
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 ring-2 ring-white/10">
                    <AvatarImage src={client.avatar?.asset?.url} />
                    <AvatarFallback>{client.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-foreground/90">{client.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {client.followers ? (
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-sm">{client.followers.value.toLocaleString()}</span>
                    {client.followers.trend !== 0 && (
                      <span className={`text-[10px] flex items-center ${client.followers.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {client.followers.trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {Math.abs(client.followers.trend).toFixed(1)}%
                      </span>
                    )}
                  </div>
                ) : <span className="text-muted-foreground">-</span>}
              </TableCell>
              <TableCell className="text-right">
                 {client.reach ? (
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-sm">{client.reach.value.toLocaleString()}</span>
                    {client.reach.trend !== 0 && (
                      <span className={`text-[10px] flex items-center ${client.reach.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {client.reach.trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {Math.abs(client.reach.trend).toFixed(1)}%
                      </span>
                    )}
                  </div>
                ) : <span className="text-muted-foreground">-</span>}
              </TableCell>
              <TableCell className="text-right">
                 {client.engagement ? (
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-sm">{client.engagement.value.toLocaleString()}</span>
                    {client.engagement.trend !== 0 && (
                      <span className={`text-[10px] flex items-center ${client.engagement.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {client.engagement.trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {Math.abs(client.engagement.trend).toFixed(1)}%
                      </span>
                    )}
                  </div>
                ) : <span className="text-muted-foreground">-</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MetricCell({ data }: { data: { value: number; trend: number; hasPrevious: boolean } | null }) {
  if (!data) return <span className="text-muted-foreground">-</span>;

  return (
    <div className="flex flex-col items-end">
      <span className="font-semibold">{data.value.toLocaleString()}</span>
      {data.hasPrevious && (
        <div className={`flex items-center text-xs ${data.trend > 0 ? 'text-green-600' : data.trend < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
          {data.trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : data.trend < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}
          {Math.abs(data.trend).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
