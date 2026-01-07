import { sanityFetch } from "@/sanity/lib/live";
import { safeGetServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function EmployeeClientsPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  const { data: clients } = await sanityFetch({
    query: `*[_type == "account" && type == "client" && status != "disabled"] | order(name asc){
      _id, name, email, businessName, onboardingStatus, riskScore,
      "activeProjectCount": count(*[_type == "campaign" && client._ref == ^._id && status == "active"]),
      "ticketCount": count(*[_type == "clientRequest" && clientAccount._ref == ^._id && status in ["open", "in_progress", "new"]])
    }`,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Active Projects</TableHead>
                <TableHead>Open Tickets</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(clients as any[]).map((client) => (
                <TableRow key={client._id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{client.businessName || client.name}</span>
                      <span className="text-xs text-muted-foreground">{client.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {client.onboardingStatus || "live"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {client.riskScore === "high" ? (
                      <Badge variant="destructive">High</Badge>
                    ) : client.riskScore === "medium" ? (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100">Medium</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Low</Badge>
                    )}
                  </TableCell>
                  <TableCell>{client.activeProjectCount || 0}</TableCell>
                  <TableCell>{client.ticketCount || 0}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/employee/clients/${client._id}`}>
                      <Button variant="ghost" size="sm">View HQ</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {(clients as any[]).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
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
