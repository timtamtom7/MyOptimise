"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SupportTabProps {
  requests: any[];
  employees: any[];
  actions: {
    assignClientRequest: (formData: FormData) => Promise<void>;
    updateClientRequest: (formData: FormData) => Promise<void>;
    addClientRequestMessage: (formData: FormData) => Promise<void>;
  };
}
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function SupportTab({ requests, employees, actions }: SupportTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Requests</CardTitle>
          <CardDescription>Support tickets and inquiries from clients.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {requests.map((r) => (
            <div key={r._id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{r.subject}</div>
                  <div className="text-sm text-muted-foreground">{r.clientEmail}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {r.assignedTo?.name || r.assignedTo?.email
                      ? `Assigned: ${r.assignedTo?.name || r.assignedTo?.email}`
                      : "Unassigned"}
                    {` • ${r.commentCount || 0} messages`}
                    {r.attachmentCount ? ` • ${r.attachmentCount} attachments` : ""}
                  </div>
                </div>
                <Badge variant={r.status === "closed" ? "secondary" : "default"}>{r.status}</Badge>
              </div>

              {r.statusHistory?.length > 0 && (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {r.statusHistory.slice(-3).map((h: any, idx: number) => (
                    <div key={idx}>
                      {h.fromStatus} → {h.toStatus}
                      {h.changedAt ? ` • ${h.changedAt}` : ""}
                      {h.changedBy?.name ? ` • ${h.changedBy.name}` : ""}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <form action={actions.assignClientRequest} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={r._id} />
                  <Select name="assigneeId" defaultValue={r.assignedTo?._id || employees[0]?._id || ""}>
                    <SelectTrigger className="h-9 w-full">
                      <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((e) => (
                        <SelectItem key={e._id} value={e._id}>
                          {e.name || e.email || e._id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" disabled={!employees.length}>
                    Assign
                  </Button>
                </form>

                <form action={actions.updateClientRequest} className="grid gap-2">
                  <input type="hidden" name="id" value={r._id} />
                  <div className="flex gap-2">
                    <Select name="status" defaultValue={r.status || "submitted"}>
                      <SelectTrigger className="h-9 w-[130px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="responded">Responded</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      name="response"
                      defaultValue={r.response || ""}
                      placeholder="Response (optional)"
                      className="h-9"
                    />
                    <Button size="sm" variant="outline">
                      Save
                    </Button>
                  </div>
                </form>
              </div>

              <form action={actions.addClientRequestMessage} className="mt-4 grid gap-2">
                <input type="hidden" name="id" value={r._id} />
                <div className="flex items-center gap-2">
                  <Select name="visibility" defaultValue="client">
                    <SelectTrigger className="h-9 w-[130px]">
                      <SelectValue placeholder="Visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client Visible</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm">Post message</Button>
                </div>
                <Textarea
                  name="message"
                  className="min-h-[80px]"
                  placeholder="Write a message…"
                  required
                />
              </form>
            </div>
          ))}
          {requests.length === 0 && (
            <div className="text-center text-sm text-muted-foreground">No open client requests.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
