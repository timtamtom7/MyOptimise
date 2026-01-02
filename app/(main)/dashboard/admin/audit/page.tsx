import { hasAccountCapability, safeGetServerSession } from "@/lib/auth";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) redirect("/login");

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct) redirect("/login");
  if (acct.status === "disabled") redirect("/login");

  if (!hasAccountCapability(acct, "security.audit.view")) {
    redirect("/dashboard");
  }

  const query = defineQuery(`
    *[_type == "auditLog"] | order(timestamp desc)[0...100] {
      _id,
      timestamp,
      action,
      actorAccountId,
      targetType,
      targetLabel,
      context
    }
  `);
  const { data: logs } = await sanityFetch({ query });
  const safeLogs = logs || [];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          View system activity and security events.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Showing the last 100 audit log entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor ID</TableHead>
                <TableHead>Target Type</TableHead>
                <TableHead>Target Label</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                safeLogs.map((log: any) => (
                  <TableRow key={log._id}>
                    <TableCell className="whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.action}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {log.actorAccountId}
                    </TableCell>
                    <TableCell>{log.targetType}</TableCell>
                    <TableCell>{log.targetLabel}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
