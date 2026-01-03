"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface WorkItem {
  _id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
  createdByName: string;
  blockedReason?: string;
}

interface WorkItemsTableProps {
  items: WorkItem[];
  onUpdateStatus?: (formData: FormData) => Promise<void>;
}

export function WorkItemsTable({ items, onUpdateStatus }: WorkItemsTableProps) {
  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!onUpdateStatus) return;
    const formData = new FormData();
    formData.append("id", id);
    formData.append("status", newStatus);
    await onUpdateStatus(formData);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">My Tasks</CardTitle>
        <div className="flex gap-2">
            {/* Filter chips could go here */}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Task</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Assigned By</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell className="font-medium">
                  <div>{item.title}</div>
                  {item.blockedReason && (
                     <div className="text-xs text-destructive mt-0.5">Blocked: {item.blockedReason}</div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "rounded-full font-normal capitalize",
                      item.status === "todo" && "bg-slate-100 text-slate-700",
                      item.status === "in_progress" && "bg-blue-50 text-blue-700",
                      item.status === "review" && "bg-purple-50 text-purple-700",
                      item.status === "blocked" && "bg-red-50 text-red-700",
                      item.status === "done" && "bg-green-50 text-green-700"
                    )}
                  >
                    {item.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                   <div className={cn(
                      "text-xs font-medium uppercase tracking-wider",
                      item.priority === "high" && "text-red-600",
                      item.priority === "medium" && "text-orange-600",
                      item.priority === "low" && "text-slate-500"
                   )}>
                      {item.priority}
                   </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.dueDate ? format(new Date(item.dueDate), "MMM d, yyyy") : "—"}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {item.createdByName || "System"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Set Status</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          <DropdownMenuItem onClick={() => handleStatusChange(item._id, "todo")}>
                            To Do
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(item._id, "in_progress")}>
                            In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(item._id, "review")}>
                            In Review
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(item._id, "done")}>
                            Done
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
               <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No active tasks found.
                  </TableCell>
               </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="p-4 border-t flex justify-center">
           <button className="text-sm text-muted-foreground hover:text-foreground">View all tasks</button>
        </div>
      </CardContent>
    </Card>
  );
}
