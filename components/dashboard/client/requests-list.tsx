"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";

interface Request {
  _id: string;
  subject: string;
  status: string;
  createdAt: string;
  statusHistory?: any[];
  messages?: any[];
  response?: string;
}

interface RequestsListProps {
  requests: Request[];
  canWrite: boolean;
  addMessageAction: (formData: FormData) => Promise<void>;
}

export function RequestsList({ requests, canWrite, addMessageAction }: RequestsListProps) {
  return (
    <Card className="h-full border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl">Recent Requests</CardTitle>
        <CardDescription>Status of your support tickets.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {requests.length === 0 && (
            <div className="text-sm text-muted-foreground py-8 text-center border rounded-lg bg-muted/20">No requests found.</div>
        )}
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r._id} className="group rounded-lg border bg-card p-5 transition-all hover:shadow-md">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{r.subject}</span>
                    <Badge variant={
                      r.status === 'resolved' ? 'secondary' : 
                      r.status === 'in_progress' ? 'default' : 
                      'outline'
                    } className="capitalize shadow-sm">
                      {r.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>Opened {format(new Date(r.createdAt), "MMM d, yyyy")}</span>
                    <span>•</span>
                    <span>{format(new Date(r.createdAt), "h:mm a")}</span>
                  </div>
                </div>
                
                {/* Quick Reply Form */}
                <form action={addMessageAction} className="flex w-full sm:w-auto items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <input type="hidden" name="id" value={r._id} />
                  <Input 
                    name="message" 
                    className="h-9 w-full sm:w-[200px]"
                    placeholder="Reply..."
                    required
                  />
                  <Button disabled={!canWrite} size="sm" className="h-9">
                    Send
                  </Button>
                </form>
              </div>

              {/* Latest Interaction Preview */}
              {(r.messages && r.messages.length > 0) || r.response ? (
                 <div className="mt-4 pl-4 border-l-2 border-muted">
                    {r.messages && r.messages.length > 0 ? (
                       <div className="text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">
                              {r.messages[r.messages.length-1].author?.name || "Support Team"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(r.messages[r.messages.length-1].createdAt), "MMM d, h:mm a")}
                            </span>
                          </div>
                          <p className="text-muted-foreground line-clamp-2">
                            {r.messages[r.messages.length-1].message}
                          </p>
                       </div>
                    ) : r.response ? (
                        <div className="text-sm">
                           <div className="font-medium text-foreground mb-1">Latest Response</div>
                           <p className="text-muted-foreground line-clamp-2">{r.response}</p>
                        </div>
                    ) : null}
                 </div>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
