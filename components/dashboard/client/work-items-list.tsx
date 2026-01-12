"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-formatting";
import { MessageSquare } from "lucide-react";

interface WorkItem {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  commentsCount?: number;
}

interface ClientWorkItemsListProps {
  items: WorkItem[];
}

export function ClientWorkItemsList({ items }: ClientWorkItemsListProps) {
  return (
    <Card className="h-full border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl">Pending Actions</CardTitle>
        <CardDescription>Tasks requiring your attention.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {items.length === 0 && (
            <div className="text-sm text-muted-foreground py-8 text-center border rounded-lg bg-muted/20">
              All caught up! No pending tasks right now.
            </div>
        )}
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item._id} className="rounded-lg border bg-card p-5 transition-all hover:shadow-md">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="font-semibold text-lg">{item.title}</div>
                <Badge 
                  variant={
                    item.priority === 'high' ? 'destructive' :
                    item.priority === 'medium' ? 'default' :
                    'secondary'
                  } 
                  className="capitalize"
                >
                  {item.status.replace("_", " ")}
                </Badge>
              </div>
              
              {item.description && (
                  <div className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {item.description}
                  </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3 mt-3">
                  <div className="flex items-center gap-4">
                    {item.dueDate && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Due:</span>
                          <span className={new Date(item.dueDate) < new Date() ? "text-red-500 font-medium" : ""}>
                            {formatDate(item.dueDate, "MMM d, yyyy")}
                          </span>
                        </div>
                    )}
                    <div className="capitalize flex items-center gap-1">
                      <span className="font-medium">Priority:</span>
                      {item.priority}
                    </div>
                  </div>

                  {item.commentsCount ? (
                      <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full">
                          <MessageSquare className="h-3 w-3" />
                          <span className="font-medium">{item.commentsCount}</span>
                      </div>
                  ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
