"use client";

import { EmployeeHeader } from "./header";
import { WorkItemsTable } from "./work-items-table";
import { ScheduleList } from "./schedule-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, MessageSquare, Calendar, Activity } from "lucide-react";

interface EmployeeViewProps {
  data: {
    user: { name: string; email: string };
    myWorkItems: any[];
    staff: any[];
    myThreads: any[];
    mySchedule: any[];
    workItemTemplates?: any[];
    stats: {
      dueTodayCount: number;
      unreadThreadsCount: number;
      blockedCount: number;
    };
  };
  actions: {
    updateWorkItemStatus: (formData: FormData) => Promise<void>;
    addWorkItemComment: (formData: FormData) => Promise<void>;
    requestReassignment: (formData: FormData) => Promise<void>;
    updateWorkItemDescription: (formData: FormData) => Promise<void>;
    markWorkItemBlocked: (formData: FormData) => Promise<void>;
    uploadWorkItemAttachment: (formData: FormData) => Promise<void>;
    createOrOpenDmThread: (formData: FormData) => Promise<void>;
    createOrOpenTaskThread: (formData: FormData) => Promise<void>;
    createWorkItem?: (formData: FormData) => Promise<void>;
    createWorkItemFromTemplate?: (formData: FormData) => Promise<void>;
    bulkUpdateWorkItems?: (formData: FormData) => Promise<void>;
  };
}

export function EmployeeView({ data, actions }: EmployeeViewProps) {
  return (
    <div className="space-y-6">
      <EmployeeHeader user={data.user} />

      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due Today</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.dueTodayCount}</div>
              <p className="text-xs text-muted-foreground">
                Tasks expiring soon
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.unreadThreadsCount}</div>
              <p className="text-xs text-muted-foreground">
                New communications
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.mySchedule.length}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled items
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Active</div>
              <p className="text-xs text-muted-foreground">
                You are online
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
             <h2 className="text-lg font-semibold">My Tasks</h2>
             <WorkItemsTable 
               items={data.myWorkItems} 
               onUpdateStatus={actions.updateWorkItemStatus} 
               onMarkBlocked={actions.markWorkItemBlocked}
               onBulkUpdate={actions.bulkUpdateWorkItems}
               templates={data.workItemTemplates}
               employees={data.staff}
               onCreateWorkItem={actions.createWorkItem}
               onCreateFromTemplate={actions.createWorkItemFromTemplate}
             />
          </div>
          <div className="lg:col-span-1 space-y-6">
             <h2 className="text-lg font-semibold">Schedule</h2>
             <ScheduleList items={data.mySchedule} />
          </div>
        </div>
      </div>
    </div>
  );
}
