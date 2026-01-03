"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  CheckSquare, 
  Activity, 
  Settings, 
  FileText,
  CreditCard,
  MessageSquare
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Import shared tabs from admin since they are identical for now
import { TasksTab } from "../admin/tasks-tab";
import { IntakeTab } from "../admin/intake-tab";
import { SupportTab } from "../admin/support-tab";
import { ServicesTab } from "../admin/services-tab";
import { MessagesTab } from "../admin/messages-tab";
import { TeamTab } from "./team-tab";

interface ManagerViewProps {
  data: {
    employees: any[];
    clients: any[];
    unassignedWorkItems: any[];
    myWorkItems: any[];
    receivedSignups: any[];
    submittedSponsorships: any[];
    openClientRequests: any[];
    clientServices: any[];
    openServiceRequests: any[];
    staff: any[];
    myThreads: any[];
    stats: {
      myActiveTasks: number;
      pendingRequests: number;
      teamSize: number;
    };
    currentUser: {
      name: string;
      email: string;
    };
  };
  capabilities: {
    canInvite: boolean;
    canCreateTasks: boolean;
    canManageServices: boolean;
    canAssign: boolean;
  };
  actions: {
    inviteEmployee: (formData: FormData) => Promise<void>;
    createWorkItem: (formData: FormData) => Promise<void>;
    assignSignup: (formData: FormData) => Promise<void>;
    assignSponsorship: (formData: FormData) => Promise<void>;
    updateStatus: (formData: FormData) => Promise<void>;
    updateClientRequest: (formData: FormData) => Promise<void>;
    assignClientRequest: (formData: FormData) => Promise<void>;
    addClientRequestMessage: (formData: FormData) => Promise<void>;
    createClientService: (formData: FormData) => Promise<void>;
    updateClientService: (formData: FormData) => Promise<void>;
    updateServiceRequestStatus: (formData: FormData) => Promise<void>;
    assignWorkItem: (formData: FormData) => Promise<void>; // Added this as it might be needed for TasksTab
    createOrOpenDmThread: (formData: FormData) => Promise<void>;
    [key: string]: any;
  };
}

export function ManagerView({ data, capabilities, actions }: ManagerViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your team, tasks, and client services.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="intake">Intake</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Tasks</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.myActiveTasks}</div>
                <p className="text-xs text-muted-foreground">
                  Assigned to me
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.pendingRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Requires attention
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.stats.teamSize}</div>
                <p className="text-xs text-muted-foreground">
                  Active employees
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Online</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-7">
            {/* My Recent Tasks */}
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>My Tasks</CardTitle>
                <CardDescription>Your recent assigned work items.</CardDescription>
              </CardHeader>
              <CardContent>
                 {data.myWorkItems.slice(0, 5).map((item) => (
                    <div key={item._id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                           item.priority === 'high' ? 'bg-red-100 text-red-600' : 
                           item.priority === 'medium' ? 'bg-orange-100 text-orange-600' : 
                           'bg-blue-100 text-blue-600'
                        }`}>
                          <CheckSquare className="h-4 w-4" />
                        </div>
                        <div>
                           <div className="font-medium">{item.title}</div>
                           <div className="text-xs text-muted-foreground">
                             Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'No date'}
                           </div>
                        </div>
                      </div>
                      <Badge variant={item.status === 'todo' ? 'outline' : 'secondary'}>{item.status}</Badge>
                    </div>
                 ))}
                 {data.myWorkItems.length === 0 && (
                   <div className="text-center py-6 text-muted-foreground">No tasks assigned to you.</div>
                 )}
              </CardContent>
            </Card>

            {/* Team */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Recently active.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                   {data.employees.slice(0, 5).map((user) => (
                     <div key={user._id} className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <Avatar className="h-8 w-8">
                           <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} />
                           <AvatarFallback>{user.name?.[0] || user.email[0]}</AvatarFallback>
                         </Avatar>
                         <div>
                           <div className="font-medium text-sm">{user.name || 'Unnamed'}</div>
                           <div className="text-xs text-muted-foreground">{user.email}</div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <TasksTab 
            openWorkItems={[...data.unassignedWorkItems, ...data.myWorkItems]} // Show both or just unassigned? Manager should see all relevant tasks.
            unassignedWorkItems={data.unassignedWorkItems}
            employees={data.employees}
            capabilities={{
              canCreate: capabilities.canCreateTasks,
              canAssign: capabilities.canAssign
            }}
            actions={{
              createWorkItem: actions.createWorkItem,
              assignWorkItem: actions.assignWorkItem,
              updateStatus: actions.updateStatus
            }}
          />
        </TabsContent>

        <TabsContent value="intake">
          <IntakeTab
            receivedSignups={data.receivedSignups}
            submittedSponsorships={data.submittedSponsorships}
            employees={data.employees}
            actions={{
              assignSignup: actions.assignSignup,
              assignSponsorship: actions.assignSponsorship,
            }}
          />
        </TabsContent>

        <TabsContent value="support">
          <SupportTab
            requests={data.openClientRequests}
            employees={data.employees}
            actions={{
              assignClientRequest: actions.assignClientRequest,
              updateClientRequest: actions.updateClientRequest,
              addClientRequestMessage: actions.addClientRequestMessage,
            }}
          />
        </TabsContent>

        <TabsContent value="services">
          <ServicesTab
            clientServices={data.clientServices}
            openServiceRequests={data.openServiceRequests}
            clients={data.clients}
            capabilities={{
              canManageServices: capabilities.canManageServices,
            }}
            actions={{
              createClientService: actions.createClientService,
              updateClientService: actions.updateClientService,
              updateServiceRequestStatus: actions.updateServiceRequestStatus,
            }}
          />
        </TabsContent>

        <TabsContent value="messages">
          <MessagesTab
            threads={data.myThreads}
            employees={data.employees}
            basePath="/dashboard/manager"
            actions={{
              createOrOpenDmThread: actions.createOrOpenDmThread,
            }}
          />
        </TabsContent>

        <TabsContent value="team">
          <TeamTab 
            employees={data.employees}
            capabilities={{
              canInvite: capabilities.canInvite
            }}
            actions={{
              inviteEmployee: actions.inviteEmployee
            }}
          />
        </TabsContent>

      </Tabs>
    </div>
  );
}
