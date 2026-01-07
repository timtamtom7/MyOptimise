import { safeGetServerSession } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, AlertTriangle, CheckCircle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function BusinessDashboardPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login?next=/dashboard/business");

  const email = String((session as any)?.user?.email || "");
  const acct = email ? await fetchSanityAccountByEmail({ email }) : null;
  if (!acct) redirect("/login?error=no_account&next=/dashboard/business");
  if (String(acct.status || "") === "disabled") redirect("/login?error=disabled&next=/dashboard/business");

  // Allow admins, managers, and employees to view
  const type = String(acct.type || "").toLowerCase();
  if (!["admin", "manager", "employee"].includes(type)) {
    redirect("/dashboard");
  }

  // Fetch Clients with "HQ" metrics
  // We need: Client Name, Active Services, Open Tickets, Last Shipped Deliverable, Risk Flags (e.g. overdue tasks)
  const clientsRes = await sanityFetch({
    query: `*[_type == "account" && type == "client" && status != "disabled"] | order(name asc) {
      _id, name, email,
      "activeServices": count(*[_type == "clientService" && client._ref == ^._id && clientEnabled == true]),
      "openTickets": count(*[_type == "clientRequest" && clientAccount._ref == ^._id && status in ["submitted", "in_progress"]]),
      "lastShipped": *[_type == "deliverable" && campaign->client._ref == ^._id && status == "approved"] | order(updatedAt desc)[0].updatedAt,
      "overdueTasks": count(*[_type == "workItem" && clientAccount._ref == ^._id && status != "done" && dueDate < now()]),
      "blockedTasks": count(*[_type == "workItem" && clientAccount._ref == ^._id && status == "blocked"])
    }`
  });

  const clients = ((clientsRes as any)?.data ?? []) as any[];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client HQ</h1>
          <p className="text-muted-foreground mt-2">
            Operational status and risk monitoring across all clients.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients with Risks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.filter((c: any) => c.overdueTasks > 0 || c.blockedTasks > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Overdue or blocked items
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Services</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {clients.reduce((acc: number, c: any) => acc + (c.activeServices || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Active Services</TableHead>
                <TableHead>Open Tickets</TableHead>
                <TableHead>Risk Signals</TableHead>
                <TableHead className="text-right">Last Shipped</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client: any) => {
                const hasRisk = client.overdueTasks > 0 || client.blockedTasks > 0;
                
                return (
                  <TableRow key={client._id} className="group cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/business/${client._id}`} className="block">
                        <div className="font-semibold text-primary group-hover:underline">{client.name}</div>
                        <div className="text-xs text-muted-foreground">{client.email}</div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/business/${client._id}`} className="block">
                        <Badge variant="outline">{client.activeServices} Active</Badge>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/business/${client._id}`} className="block">
                        {client.openTickets > 0 ? (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                            {client.openTickets} Open
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/business/${client._id}`} className="block">
                        {hasRisk ? (
                          <div className="flex gap-2">
                            {client.overdueTasks > 0 && (
                              <Badge variant="destructive" className="text-[10px]">
                                {client.overdueTasks} Overdue
                              </Badge>
                            )}
                            {client.blockedTasks > 0 && (
                              <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200 text-[10px]">
                                {client.blockedTasks} Blocked
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Healthy</Badge>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      <Link href={`/dashboard/business/${client._id}`} className="flex items-center justify-end gap-1 h-full">
                        {client.lastShipped ? (
                          <>
                            <Clock className="h-3 w-3" />
                            {new Date(client.lastShipped).toLocaleDateString()}
                          </>
                        ) : "—"}
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {clients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No clients found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
