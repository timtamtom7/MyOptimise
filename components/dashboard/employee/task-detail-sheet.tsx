"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Flag, User, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TaskDetailSheetProps {
  task: any | null;
  isOpen: boolean;
  onClose: () => void;
  actions: {
    toggleWorkItemChecklist?: (formData: FormData) => Promise<void>;
  };
}

export function TaskDetailSheet({ task, isOpen, onClose, actions }: TaskDetailSheetProps) {
  const [toggling, setToggling] = useState<Record<string, boolean>>({});

  if (!task) return null;

  const handleToggleChecklist = async (itemKey: string, checked: boolean) => {
    if (!actions.toggleWorkItemChecklist) return;

    setToggling(prev => ({ ...prev, [itemKey]: true }));
    const formData = new FormData();
    formData.append("id", task._id);
    formData.append("itemKey", itemKey);
    formData.append("checked", String(checked));

    try {
      await actions.toggleWorkItemChecklist(formData);
    } catch (error) {
      console.error("Failed to toggle checklist item", error);
    } finally {
      setToggling(prev => ({ ...prev, [itemKey]: false }));
    }
  };

  const completedCount = task.checklist?.filter((i: any) => i.completed).length || 0;
  const totalCount = task.checklist?.length || 0;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <SheetTitle className="text-xl font-semibold leading-tight">
                {task.title}
              </SheetTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={task.priority === "high" ? "destructive" : "secondary"} className="capitalize">
                  {task.priority} Priority
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {task.status}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 -mx-6 px-6 my-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Description */}
            {task.description && (
              <div className="prose prose-sm dark:prose-invert">
                <p>{task.description}</p>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Assigned To
                </span>
                <p className="font-medium">
                  {task.assignedTo?.name || "Unassigned"}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Due Date
                </span>
                <p className="font-medium">
                  {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "No due date"}
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-800" />

            {/* Checklist */}
            {task.checklist && task.checklist.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    Checklist
                    <span className="text-xs font-normal text-muted-foreground">
                      ({completedCount}/{totalCount})
                    </span>
                  </h4>
                  <span className="text-xs text-muted-foreground">{progress}%</span>
                </div>
                
                <div className="space-y-2">
                  {task.checklist.map((item: any) => (
                    <div 
                      key={item._key} 
                      className={cn(
                        "flex items-start gap-3 p-2 rounded-md transition-colors",
                        toggling[item._key] ? "opacity-50" : "hover:bg-muted/50"
                      )}
                    >
                      <Checkbox 
                        id={item._key}
                        checked={item.completed}
                        disabled={toggling[item._key]}
                        onCheckedChange={(checked) => handleToggleChecklist(item._key, checked as boolean)}
                        className="mt-0.5"
                      />
                      <label 
                        htmlFor={item._key}
                        className={cn(
                          "text-sm leading-none cursor-pointer select-none flex-1",
                          item.completed && "text-muted-foreground line-through"
                        )}
                      >
                        {item.item}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments Placeholder */}
            {task.attachments && task.attachments.length > 0 && (
              <>
                <div className="h-px bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    Attachments
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {task.attachments.map((file: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 border rounded-md text-xs">
                        <Paperclip className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">Attachment {i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
