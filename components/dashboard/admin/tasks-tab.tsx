"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Plus, Filter } from "lucide-react";
import { format } from "date-fns";

interface TasksTabProps {
  openWorkItems: any[];
  unassignedWorkItems: any[];
  workItemTemplates?: any[];
  employees: any[];
  capabilities: {
    canCreate: boolean;
    canAssign: boolean;
    canManageTaskTemplates?: boolean;
  };
  actions: {
    createWorkItem: (formData: FormData) => Promise<void>;
    assignWorkItem: (formData: FormData) => Promise<void>;
    updateStatus: (formData: FormData) => Promise<void>;
    createWorkItemTemplate?: (formData: FormData) => Promise<void>;
    deleteWorkItemTemplate?: (formData: FormData) => Promise<void>;
    createWorkItemFromTemplate?: (formData: FormData) => Promise<void>;
  };
}

export function TasksTab({ 
  openWorkItems, 
  unassignedWorkItems, 
  workItemTemplates = [], 
  employees, 
  capabilities, 
  actions 
}: TasksTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <p className="text-muted-foreground">Manage work items and assignments.</p>
        </div>
        {capabilities.canCreate && (
          <div className="flex gap-2">
             <Button onClick={() => document.getElementById("create-trigger")?.click()}>
              <Plus className="mr-2 h-4 w-4" /> New Task
             </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active ({openWorkItems.length})</TabsTrigger>
          <TabsTrigger value="unassigned">Unassigned ({unassignedWorkItems.length})</TabsTrigger>
          <TabsTrigger value="create" id="create-trigger">Create New</TabsTrigger>
          {capabilities.canManageTaskTemplates && (
            <TabsTrigger value="templates">Templates</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-4">
             {openWorkItems.map((item) => (
               <Card key={item._id}>
                 <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                   <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full mt-1 ${
                        item.priority === 'high' ? 'bg-red-100 text-red-600' : 
                        item.priority === 'medium' ? 'bg-orange-100 text-orange-600' : 
                        'bg-blue-100 text-blue-600'
                      }`}>
                        <CheckSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground flex flex-wrap gap-2 items-center mt-1">
                          <Badge variant="outline" className="capitalize">{item.status}</Badge>
                          <span>•</span>
                          <span>Due {item.dueDate ? format(new Date(item.dueDate), 'MMM d') : 'No date'}</span>
                          <span>•</span>
                          <span>{item.assigneeName || 'Unassigned'}</span>
                        </div>
                         {item.commentsCount > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.commentsCount} comments
                            </div>
                         )}
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2 w-full md:w-auto">
                      <form action={actions.updateStatus} className="flex-1 md:flex-none">
                         <input type="hidden" name="id" value={item._id} />
                         <select 
                           name="status" 
                           defaultValue={item.status} 
                           onChange={(e) => e.target.form?.requestSubmit()}
                           className="h-9 w-full md:w-[120px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                         >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="blocked">Blocked</option>
                            <option value="done">Done</option>
                         </select>
                      </form>
                   </div>
                 </CardContent>
               </Card>
             ))}
             {openWorkItems.length === 0 && (
               <div className="text-center py-10 text-muted-foreground">No active tasks.</div>
             )}
          </div>
        </TabsContent>

        <TabsContent value="unassigned" className="space-y-4">
           {unassignedWorkItems.map((item) => (
             <Card key={item._id}>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                   <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.priority} priority</div>
                   </div>
                   {capabilities.canAssign && (
                      <form action={actions.assignWorkItem} className="flex items-center gap-2">
                         <input type="hidden" name="id" value={item._id} />
                         <select name="assigneeId" className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm">
                            <option value="">Assign to...</option>
                            {employees.map(e => (
                               <option key={e._id} value={e._id}>{e.name || e.email}</option>
                            ))}
                         </select>
                         <Button size="sm" type="submit">Assign</Button>
                      </form>
                   )}
                </CardContent>
             </Card>
           ))}
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Task</CardTitle>
              <CardDescription>Add a new work item to the queue.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <form action={actions.createWorkItem} className="space-y-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input name="title" placeholder="Task title" required />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea 
                        name="description" 
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="Details..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Priority</label>
                        <select name="priority" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Due Date</label>
                        <Input name="dueDate" type="datetime-local" />
                      </div>
                    </div>
                     <div className="grid gap-2">
                        <label className="text-sm font-medium">Assign To</label>
                        <select name="assigneeId" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                          <option value="">Unassigned</option>
                          {employees.map(e => (
                             <option key={e._id} value={e._id}>{e.name || e.email}</option>
                          ))}
                        </select>
                      </div>
                      <div className="pt-4">
                        <Button type="submit">Create Task</Button>
                      </div>
                </form>

                {capabilities.canManageTaskTemplates && workItemTemplates.length > 0 && (
                  <div className="border-l pl-6">
                    <h3 className="text-lg font-medium mb-4">Or use a template</h3>
                    <div className="space-y-3">
                      {workItemTemplates.map(t => (
                        <div key={t._id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="font-medium">{t.title}</div>
                          <div className="text-xs text-muted-foreground mb-2">{t.description || "No description"}</div>
                          <form action={actions.createWorkItemFromTemplate}>
                            <input type="hidden" name="templateId" value={t._id} />
                            <div className="grid gap-2 mb-2">
                              <select name="assigneeId" className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-sm">
                                <option value="">Assign to...</option>
                                {employees.map(e => (
                                   <option key={e._id} value={e._id}>{e.name || e.email}</option>
                                ))}
                              </select>
                            </div>
                            <Button size="sm" variant="outline" className="w-full">Use Template</Button>
                          </form>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {capabilities.canManageTaskTemplates && (
          <TabsContent value="templates">
             <Card>
               <CardHeader>
                 <CardTitle>Task Templates</CardTitle>
                 <CardDescription>Manage reusable task templates.</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-6">
                   <form action={actions.createWorkItemTemplate} className="grid gap-4 p-4 border rounded-lg bg-muted/30">
                     <h3 className="font-medium text-sm">Create New Template</h3>
                     <div className="grid gap-2">
                        <label className="text-sm">Title</label>
                        <Input name="title" placeholder="Template Title" required />
                     </div>
                     <div className="grid gap-2">
                        <label className="text-sm">Description</label>
                        <Input name="description" placeholder="Default description..." />
                     </div>
                     <div className="flex items-center gap-4">
                        <div className="grid gap-2 flex-1">
                          <label className="text-sm">Default Priority</label>
                          <select name="priority" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="low">Low</option>
                          </select>
                        </div>
                        <div className="grid gap-2 flex-1">
                          <label className="text-sm">Visibility</label>
                          <select name="visibility" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                            <option value="internal">Internal</option>
                            <option value="client">Client Visible</option>
                          </select>
                        </div>
                     </div>
                     <Button type="submit" size="sm" className="w-fit">Save Template</Button>
                   </form>

                   <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                     {workItemTemplates.map(t => (
                       <div key={t._id} className="p-4 border rounded-lg flex flex-col justify-between gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                               <div className="font-medium">{t.title}</div>
                               <Badge variant="outline">{t.priority}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">{t.description}</div>
                          </div>
                          {actions.deleteWorkItemTemplate && (
                            <form action={actions.deleteWorkItemTemplate}>
                              <input type="hidden" name="id" value={t._id} />
                              <Button variant="destructive" size="sm" className="w-full">Delete</Button>
                            </form>
                          )}
                       </div>
                     ))}
                     {workItemTemplates.length === 0 && (
                       <div className="col-span-full text-center py-6 text-muted-foreground">No templates found.</div>
                     )}
                   </div>
                 </div>
               </CardContent>
             </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
