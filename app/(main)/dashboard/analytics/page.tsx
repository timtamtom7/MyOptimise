import { safeGetServerSession } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { redirect } from "next/navigation";
import { defineQuery } from "next-sanity";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) redirect("/login");

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct) redirect("/login");
  if (acct.status === "disabled") redirect("/login");

  // Determine capabilities
  const isAdmin = acct.type === "admin";
  const canViewAll = hasAccountCapability(acct, "analytics.view.all");
  const canViewClientAssigned = hasAccountCapability(acct, "analytics.view.client_assigned");
  const canViewReadOnly = hasAccountCapability(acct, "analytics.view.read_only");

  if (!canViewAll && !canViewClientAssigned && !canViewReadOnly) {
    redirect("/dashboard");
  }

  // Fetch Logic
  let records: any[] = [];
  const isClient = acct.type === "client";
  
  if (canViewAll) {
    const query = defineQuery(`
      *[_type == "analyticsRecord"] | order(metricDate desc) {
        _id,
        metric,
        value,
        period,
        metricDate,
        visibility,
        "clientName": client->email,
        "serviceName": service->title
      }
    `);
    const result = await sanityFetch({ query });
    records = result.data || [];
  } else if (isClient) {
    // Client -> See OWN
    const query = defineQuery(`
      *[_type == "analyticsRecord" && client._ref == $id && visibility == "client"] | order(metricDate desc) {
        _id,
        metric,
        value,
        period,
        metricDate,
        visibility,
        "clientName": client->email,
        "serviceName": service->title
      }
    `);
    const result = await sanityFetch({ query, params: { id: acct._id } });
    records = result.data || [];
  } else if (canViewClientAssigned) {
    // Staff -> Assigned Clients
    const query = defineQuery(`
      *[_type == "analyticsRecord" && $id in client->teamMembers[]._ref] | order(metricDate desc) {
        _id,
        metric,
        value,
        period,
        metricDate,
        visibility,
        "clientName": client->email,
        "serviceName": service->title
      }
    `);
    const result = await sanityFetch({ query, params: { id: acct._id } });
    records = result.data || [];
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Performance metrics and insights for your projects.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
          </CardContent>
        </Card>
        {/* Add more summary cards here if needed */}
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="charts" disabled>Charts (Coming Soon)</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Metrics History</CardTitle>
              <CardDescription>
                Recent performance data records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Visibility</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                        No analytics records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record: any) => (
                      <TableRow key={record._id}>
                        <TableCell>{new Date(record.metricDate).toLocaleDateString()}</TableCell>
                        <TableCell>{record.clientName || "-"}</TableCell>
                        <TableCell className="font-medium">{record.metric}</TableCell>
                        <TableCell>{record.value}</TableCell>
                        <TableCell className="capitalize">{record.period}</TableCell>
                        <TableCell>{record.serviceName || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={record.visibility === "client" ? "default" : "secondary"}>
                            {record.visibility}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
