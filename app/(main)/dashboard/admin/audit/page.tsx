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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
    Search, 
    Filter, 
    ShieldAlert, 
    User, 
    FileText, 
    Settings, 
    Trash2, 
    PlusCircle, 
    Edit, 
    Activity,
    Clock
} from "lucide-react";

export const dynamic = "force-dynamic";

function getActionIcon(action: string) {
    if (action.includes("create")) return <PlusCircle className="h-4 w-4 text-green-500" />;
    if (action.includes("delete")) return <Trash2 className="h-4 w-4 text-red-500" />;
    if (action.includes("update")) return <Edit className="h-4 w-4 text-blue-500" />;
    if (action.includes("login")) return <User className="h-4 w-4 text-purple-500" />;
    return <Activity className="h-4 w-4 text-slate-500" />;
}

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Audit Logs</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Monitor system activity, security events, and data changes.
          </p>
        </div>
        <div className="flex items-center gap-3">
             <Button variant="outline" className="h-12 rounded-full px-6 border-slate-200 dark:border-slate-800 font-bold">
                <Filter className="mr-2 h-4 w-4" /> Filter
             </Button>
             <Button className="h-12 rounded-full px-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:scale-105 transition-transform">
                Export CSV
             </Button>
        </div>
      </div>

      <Card className="rounded-[3rem] border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <CardHeader className="p-10 pb-6 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div>
                      <CardTitle className="text-2xl font-bold">Recent Activity</CardTitle>
                      <CardDescription className="text-base">Showing the last 100 system events.</CardDescription>
                  </div>
              </div>
              <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input 
                    placeholder="Search logs..." 
                    className="h-12 rounded-2xl pl-12 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800" 
                  />
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent">
                <TableHead className="pl-10 h-14 font-bold text-slate-900 dark:text-slate-100">Time</TableHead>
                <TableHead className="font-bold text-slate-900 dark:text-slate-100">Action</TableHead>
                <TableHead className="font-bold text-slate-900 dark:text-slate-100">Actor</TableHead>
                <TableHead className="font-bold text-slate-900 dark:text-slate-100">Target</TableHead>
                <TableHead className="font-bold text-slate-900 dark:text-slate-100 text-right pr-10">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-48 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <Activity className="h-10 w-10 opacity-20" />
                        <p>No audit logs found matching your criteria.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                safeLogs.map((log: any) => (
                  <TableRow key={log._id} className="border-slate-100 dark:border-slate-800 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
                    <TableCell className="pl-10 whitespace-nowrap font-medium text-slate-500">
                      <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 opacity-50" />
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                {getActionIcon(log.action)}
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{log.action}</span>
                        </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      <Badge variant="outline" className="font-mono bg-slate-50 dark:bg-slate-900">
                        {log.actorAccountId?.slice(0, 8)}...
                      </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-semibold">{log.targetLabel || "-"}</span>
                            <span className="text-xs text-slate-400 uppercase tracking-wider">{log.targetType}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                        <Button variant="ghost" size="sm" className="rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            View JSON
                        </Button>
                    </TableCell>
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
