"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoreHorizontal, CheckCircle2, Circle, Clock, AlertCircle, Plus, CheckSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { TaskCreationDialog } from "./task-creation-dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface WorkItem {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate: string;
  createdByName: string;
  blockedReason?: string;
  checklist?: Array<{ item: string; completed: boolean }>;
}

interface WorkItemsTableProps {
  items: WorkItem[];
  onUpdateStatus?: (formData: FormData) => Promise<void>;
  onMarkBlocked?: (formData: FormData) => Promise<void>;
  onBulkUpdate?: (formData: FormData) => Promise<void>;
  templates?: any[];
  onCreateWorkItem?: (formData: FormData) => Promise<void>;
  onCreateFromTemplate?: (formData: FormData) => Promise<void>;
  employees?: any[];
}

export function WorkItemsTable({ 
  items, 
  onUpdateStatus, 
  onMarkBlocked,
  onBulkUpdate,
  templates,
  onCreateWorkItem,
  onCreateFromTemplate,
  employees
}: WorkItemsTableProps) {
  const [blockedDialogOpen, setBlockedDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (newStatus === "blocked") {
      setSelectedItemId(id);
      setBlockedDialogOpen(true);
      return;
    }

    if (!onUpdateStatus) return;
    const formData = new FormData();
    formData.append("id", id);
    formData.append("status", newStatus);
    await onUpdateStatus(formData);
  };

  const submitBlocked = async () => {
    if (!selectedItemId || !onMarkBlocked || !blockedReason.trim()) return;
    
    const formData = new FormData();
    formData.append("id", selectedItemId);
    formData.append("blockedReason", blockedReason);
    await onMarkBlocked(formData);
    
    setBlockedDialogOpen(false);
    setBlockedReason("");
    setSelectedItemId(null);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(items.map(i => i._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkAction = async (status: string) => {
    if (!onBulkUpdate || selectedIds.length === 0) return;
    const formData = new FormData();
    formData.append("ids", selectedIds.join(","));
    formData.append("status", status);
    await onBulkUpdate(formData);
    setSelectedIds([]);
  };

  return (
    <>
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-4">
            <CardTitle className="text-base font-medium">My Tasks</CardTitle>
            {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md">
                    <span className="text-sm font-medium">{selectedIds.length} selected</span>
                    <div className="h-4 w-px bg-border mx-1" />
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleBulkAction("todo")}>To Do</Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleBulkAction("in_progress")}>In Progress</Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => handleBulkAction("done")}>Done</Button>
                    <div className="h-4 w-px bg-border mx-1" />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedIds([])}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
        {(onCreateWorkItem || onCreateFromTemplate) && (
          <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]">
                <Checkbox 
                    checked={selectedIds.length === items.length && items.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                />
              </TableHead>
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
                <TableCell>
                    <Checkbox 
                        checked={selectedIds.includes(item._id)}
                        onCheckedChange={(checked) => handleSelectOne(item._id, checked as boolean)}
                    />
                </TableCell>
                <TableCell className="font-medium">
                  <div>{item.title}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</div>
                  )}
                  {item.checklist && item.checklist.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <CheckSquare className="h-3 w-3" />
                      <span>
                        {item.checklist.filter(i => i.completed).length}/{item.checklist.length}
                      </span>
                    </div>
                  )}
                  {item.blockedReason && (
                     <div className="text-xs text-destructive mt-0.5">Blocked: {item.blockedReason}</div>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "rounded-full font-normal capitalize cursor-pointer hover:opacity-80 transition-opacity",
                            item.status === "todo" && "bg-slate-100 text-slate-700",
                            item.status === "in_progress" && "bg-blue-50 text-blue-700",
                            item.status === "review" && "bg-purple-50 text-purple-700",
                            item.status === "blocked" && "bg-red-50 text-red-700",
                            item.status === "done" && "bg-green-50 text-green-700"
                          )}
                        >
                          {item.status.replace("_", " ")}
                        </Badge>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleStatusChange(item._id, "todo")}>
                        <Circle className="mr-2 h-4 w-4 text-slate-500" /> To Do
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(item._id, "in_progress")}>
                        <Clock className="mr-2 h-4 w-4 text-blue-500" /> In Progress
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(item._id, "blocked")}>
                        <AlertCircle className="mr-2 h-4 w-4 text-red-500" /> Blocked
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(item._id, "done")}>
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Done
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

    <Dialog open={blockedDialogOpen} onOpenChange={setBlockedDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mark Task as Blocked</DialogTitle>
          <DialogDescription>
            Please explain why this task is blocked. This will notify the team.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason</Label>
            <Input
              id="reason"
              placeholder="e.g. Waiting on client assets..."
              value={blockedReason}
              onChange={(e) => setBlockedReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setBlockedDialogOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={submitBlocked} disabled={!blockedReason.trim()}>
            Mark Blocked
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <TaskCreationDialog 
      open={createDialogOpen} 
      onOpenChange={setCreateDialogOpen}
      templates={templates}
      onCreateWorkItem={onCreateWorkItem}
      onCreateFromTemplate={onCreateFromTemplate}
      employees={employees}
    />
    </>
  );
}
