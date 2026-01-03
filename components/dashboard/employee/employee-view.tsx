"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeHeader } from "./header";
import { EmployeeHero } from "./hero";
import { WorkItemsTable } from "./work-items-table";
import { ScheduleList } from "./schedule-list";
import { MessagesTab } from "../admin/messages-tab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, MessageSquare, Calendar, Activity } from "lucide-react";

interface EmployeeViewProps {
  data: {
    user: { name: string; email: string };
    myWorkItems: any[];
    staff: any[];
    myThreads: any[];
    mySchedule: any[];
    stats: {
      dueTodayCount: number;
      unreadThreadsCount: number;
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
  };
}

export function EmployeeView({ data, actions }: EmployeeViewProps) {
  return (
    <div className="space-y-6">
      <EmployeeHeader user={data.user} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">My Work</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
               <WorkItemsTable items={data.myWorkItems} onUpdateStatus={actions.updateWorkItemStatus} />
            </div>
            <div className="lg:col-span-1">
               <ScheduleList items={data.mySchedule} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
           <WorkItemsTable items={data.myWorkItems} onUpdateStatus={actions.updateWorkItemStatus} />
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
           <MessagesTab
             threads={data.myThreads}
             employees={data.staff}
             basePath="/dashboard/employee"
             actions={{
               createOrOpenDmThread: actions.createOrOpenDmThread,
             }}
           />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
           <ScheduleList items={data.mySchedule} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
