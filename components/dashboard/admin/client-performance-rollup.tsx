
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
      <Card>
        <CardHeader>
          <CardTitle>Client Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No analytics data available for active clients.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Followers</TableHead>
                <TableHead className="text-right">Reach</TableHead>
                <TableHead className="text-right">Engagement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientMetrics.map((client) => (
                <TableRow key={client._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {client.avatar ? (
                          <AvatarImage src={client.avatar.asset?.url || client.avatar.url} />
                        ) : (
                          <AvatarFallback>{(client.name || client.email || "?").substring(0, 2).toUpperCase()}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex flex-col">
                        <span>{client.name || "Unnamed"}</span>
                        <span className="text-xs text-muted-foreground">{client.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <MetricCell data={client.followers} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MetricCell data={client.reach} />
                  </TableCell>
                  <TableCell className="text-right">
                    <MetricCell data={client.engagement} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
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
