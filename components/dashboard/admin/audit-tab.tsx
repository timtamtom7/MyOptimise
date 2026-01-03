"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Activity } from "lucide-react";

interface AuditTabProps {
  auditLogs: any[];
}

export function AuditTab({ auditLogs }: AuditTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
        <p className="text-muted-foreground">System activity and security events.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions performed across the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {auditLogs.map((log) => (
              <div key={log._id} className="flex items-start gap-4">
                <div className="mt-1">
                   <div className="p-2 rounded-full bg-muted">
                      <Activity className="h-4 w-4" />
                   </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    <span className="font-bold">{log.actor?.name || log.actor?.email || 'System'}</span>
                    {' '}
                    <span className="text-muted-foreground font-normal">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    {' '}
                    <span className="font-bold">{log.targetLabel || log.targetType}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(log.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                  {log.context && (
                    <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs font-mono">
                      {JSON.stringify(log.context, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && (
               <div className="text-center py-10 text-muted-foreground">No audit logs found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
