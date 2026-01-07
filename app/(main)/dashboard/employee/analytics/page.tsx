import { sanityFetch } from "@/sanity/lib/live";
import { safeGetServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, Clock, TrendingUp, Activity } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  const email = String((session as any)?.user?.email || "");
  const { data: currentUser } = await sanityFetch({
    query: `*[_type == "account" && email == $email][0]{_id}`,
    params: { email },
  });

  if (!currentUser) redirect("/login");

  const { data: stats } = await sanityFetch({
    query: `{
      "tasks": {
        "total": count(*[_type == "workItem" && assignedTo._ref == $userId]),
        "completed": count(*[_type == "workItem" && assignedTo._ref == $userId && status == "done"]),
        "blocked": count(*[_type == "workItem" && assignedTo._ref == $userId && status == "blocked"]),
        "overdue": count(*[_type == "workItem" && assignedTo._ref == $userId && dueDate < now() && status != "done"])
      },
      "deliverables": {
        "completed": count(*[_type == "deliverable" && assignedTo._ref == $userId && status == "approved"])
      },
      "activity": *[_type == "auditLog" && actor._ref == $userId] | order(timestamp desc)[0...10] {
        _id,
        action,
        timestamp,
        targetType,
        targetLabel,
        context
      }
    }`,
    params: { userId: currentUser._id },
  });

  const completionRate = stats?.tasks?.total ? Math.round((stats.tasks.completed / stats.tasks.total) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.tasks?.completed} of {stats?.tasks?.total} tasks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tasks?.blocked || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently blocked
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tasks?.overdue || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tasks past due date
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deliverables</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.deliverables?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Approved deliverables
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.activity && stats.activity.length > 0 ? (
            <div className="space-y-4">
              {stats.activity.map((log: any) => (
                <div key={log._id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {log.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {log.targetLabel || log.targetType}
                      {log.context?.status && ` - ${log.context.status}`}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(log.timestamp), "MMM d, h:mm a")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
