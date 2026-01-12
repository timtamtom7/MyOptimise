"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

interface Request {
  _id: string;
  subject: string;
  status: string;
  createdAt: string;
  statusHistory?: any[];
  messages?: any[];
  response?: string;
  category?: string;
  priority?: string;
}

import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RequestsListProps {
  requests: Request[];
  canWrite: boolean;
  addMessageAction: (formData: FormData) => Promise<void>;
  submitRequestAction?: (formData: FormData) => Promise<void>;
}

export function RequestsList({ requests, canWrite, addMessageAction, submitRequestAction }: RequestsListProps) {
  return (
    <Card className="h-full border-none shadow-none">
      <CardHeader className="px-0 pt-0 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Recent Requests</CardTitle>
          <CardDescription>Status of your support tickets.</CardDescription>
        </div>
        {canWrite && submitRequestAction && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Support Request</DialogTitle>
                <DialogDescription>
                  Describe your issue or request and we&apos;ll get back to you shortly.
                </DialogDescription>
              </DialogHeader>
              <form action={async (formData) => {
                await submitRequestAction(formData);
                // Close dialog logic would ideally go here, but with server actions we rely on revalidation
                // A toast would be good too.
              }} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" name="subject" placeholder="Brief summary of the issue" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select name="type" defaultValue="support">
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="support">General Support</SelectItem>
                      <SelectItem value="bug">Report a Bug</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="billing">Billing Question</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    name="message" 
                    placeholder="Detailed description..." 
                    required 
                    className="min-h-[100px]"
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">Submit Request</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="px-0">
        {requests.length === 0 && (
            <div className="text-sm text-muted-foreground py-8 text-center border rounded-lg bg-muted/20">
              No requests found. Click &quot;New Request&quot; to get started.
            </div>
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
                    {r.priority && (
                        <Badge variant="outline" className={`capitalize text-xs ${
                            r.priority === 'urgent' ? 'text-red-600 border-red-200 bg-red-50' :
                            r.priority === 'high' ? 'text-orange-600 border-orange-200 bg-orange-50' :
                            'text-muted-foreground'
                        }`}>
                            {r.priority}
                        </Badge>
                    )}
                     {r.category && (
                        <Badge variant="secondary" className="capitalize text-xs">
                            {r.category === 'bug' ? 'Bug Report' : r.category === 'feature' ? 'Feature Request' : r.category}
                        </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>Opened {formatDate(r.createdAt)}</span>
                    <span>•</span>
                    <span>{formatDateTime(r.createdAt, "h:mm a")}</span>
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
                              {formatDateTime(r.messages[r.messages.length-1].createdAt, "MMM d, h:mm a")}
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
