"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface TaskCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates?: any[];
  onCreateWorkItem?: (formData: FormData) => Promise<void>;
  onCreateFromTemplate?: (formData: FormData) => Promise<void>;
  employees?: any[];
}

export function TaskCreationDialog({ 
  open, 
  onOpenChange, 
  templates = [], 
  onCreateWorkItem, 
  onCreateFromTemplate,
  employees = []
}: TaskCreationDialogProps) {
  const [mode, setMode] = useState<"template" | "manual">("template");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Manual form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "template" && onCreateFromTemplate && templates.length > 0) {
        if (!selectedTemplateId) return;
        const formData = new FormData();
        formData.append("templateId", selectedTemplateId);
        if (assigneeId && assigneeId !== "unassigned") {
           formData.append("assigneeId", assigneeId);
        }
        await onCreateFromTemplate(formData);
      } else if (mode === "manual" && onCreateWorkItem) {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("priority", priority);
        if (assigneeId && assigneeId !== "unassigned") {
           formData.append("assigneeId", assigneeId);
        }
        await onCreateWorkItem(formData);
      }
      onOpenChange(false);
      // Reset state
      setTitle("");
      setDescription("");
      setPriority("medium");
      setSelectedTemplateId("");
      setAssigneeId("unassigned");
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setLoading(false);
    }
  };

  // If no templates, force manual mode
  if (templates.length === 0 && mode === "template") {
    setMode("manual");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Create a new task for yourself.
          </DialogDescription>
        </DialogHeader>

        {templates.length > 0 && (
           <div className="flex gap-2 mb-4">
             <Button 
               variant={mode === "template" ? "secondary" : "ghost"} 
               onClick={() => setMode("template")}
               size="sm"
               className="flex-1"
             >
               From Template
             </Button>
             <Button 
               variant={mode === "manual" ? "secondary" : "ghost"} 
               onClick={() => setMode("manual")}
               size="sm"
               className="flex-1"
             >
               Manual Entry
             </Button>
           </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "template" && templates.length > 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t._id} value={t._id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTemplateId && (
                   <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-md">
                      <p className="font-medium mb-1">
                        {templates.find(t => t._id === selectedTemplateId)?.title}
                      </p>
                      <p className="mb-2">
                        {templates.find(t => t._id === selectedTemplateId)?.description || "No description."}
                      </p>
                      <div className="text-xs flex gap-4">
                         <span>Checklist items: {templates.find(t => t._id === selectedTemplateId)?.checklist?.length || 0}</span>
                         <span>Default Due: +{templates.find(t => t._id === selectedTemplateId)?.defaultDueOffset || 0} days</span>
                      </div>
                   </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  placeholder="Task title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Task details..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {employees.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assign To (Optional)</Label>
                  <Select value={assigneeId} onValueChange={setAssigneeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned (Self)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned (Self)</SelectItem>
                      {employees.map((emp) => (
                        <SelectItem key={emp._id} value={emp._id}>
                          {emp.name || emp.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || (mode === "template" && !selectedTemplateId)}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
