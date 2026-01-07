"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, CheckCircle2, Clock, FileText, ExternalLink, Mail, Phone, Shield, Flag } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ScheduleView } from "./schedule-view";

interface ClientHQProps {
  data: {
    client: any;
    activeCampaigns: any[];
    recentDeliverables: any[];
    openTickets: any[];
    services: any[];
    calendarSchedule?: any[];
    calendarDeliverables?: any[];
    calendarCampaigns?: any[];
  };
}

export function ClientHQView({ data }: ClientHQProps) {
  const { client, activeCampaigns, recentDeliverables, openTickets, services } = data;

  const calendarItems = [
    ...(data.calendarSchedule || []).map((item: any) => ({
      ...item,
      type: item.type || "event",
      visibility: "client",
    })),
    ...(data.calendarDeliverables || []).map((item: any) => ({
      _id: item._id,
      title: item.title,
      startsAt: item.dueDate,
      type: "deliverable",
      visibility: "client",
    })),
    ...(data.calendarCampaigns || []).map((item: any) => ({
      _id: item._id,
      title: item.title,
      startsAt: item.startDate || new Date().toISOString(), // Fallback if missing
      endsAt: item.endDate,
      type: "campaign",
      visibility: "client",
    })),
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{client.businessName || client.name}</h1>
            <Badge variant="outline" className="capitalize">{client.onboardingStatus || "Live"}</Badge>
            {client.riskScore === "high" && <Badge variant="destructive">High Risk</Badge>}
          </div>
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
            </div>
            {/* Add more contact info if available */}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/employee/tickets/new?clientId=${client._id}`}>Create Ticket</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/employee/campaigns/new?clientId=${client._id}`}>New Campaign</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="brand">Brand & Info</TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Calendar</CardTitle>
              <CardDescription>
                View campaigns, deliverables, and scheduled items visible to the client.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduleView items={calendarItems} currentUserId="" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
                <Flag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeCampaigns.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{openTickets.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{client.riskScore || "Low"}</div>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Services</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{services.length}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Deliverables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentDeliverables.length === 0 && <p className="text-muted-foreground">No recent deliverables.</p>}
                  {recentDeliverables.map((d) => (
                    <div key={d._id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{d.title}</p>
                        <p className="text-xs text-muted-foreground">{d.campaignTitle} • {d.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">{d.status.replace("_", " ")}</Badge>
                        {d.dueDate && (
                           <span className="text-xs text-muted-foreground">{format(new Date(d.dueDate), "MMM d")}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Service Scope</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {client.serviceScope || "No service scope defined."}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Active Campaigns</CardTitle>
              <CardDescription>Currently running projects.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activeCampaigns.length === 0 && <p className="text-muted-foreground">No active campaigns.</p>}
                {activeCampaigns.map((c) => (
                  <div key={c._id} className="flex flex-col md:flex-row md:items-center justify-between border p-4 rounded-lg">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{c.title}</h3>
                      <p className="text-sm text-muted-foreground">{c.description}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground mt-2">
                        {c.endDate && <span>Ends: {format(new Date(c.endDate), "MMM d, yyyy")}</span>}
                        <span>•</span>
                        <span>{c.deliverableCount} Deliverables</span>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                       <Button variant="outline" size="sm" asChild>
                         <Link href={`/dashboard/employee/campaigns/${c._id}`}>View Details</Link>
                       </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>Open Tickets</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                 {openTickets.length === 0 && <p className="text-muted-foreground">No open tickets.</p>}
                 {openTickets.map((t) => (
                    <div key={t._id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div>
                        <p className="font-medium">{t.subject}</p>
                        <p className="text-xs text-muted-foreground capitalize">{t.category} • Created {format(new Date(t._createdAt), "MMM d")}</p>
                      </div>
                      <Badge className={t.priority === 'urgent' ? 'bg-red-500' : ''}>{t.status}</Badge>
                    </div>
                 ))}
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brand & Info Tab */}
        <TabsContent value="brand">
          <div className="grid gap-4 md:grid-cols-2">
             <Card>
              <CardHeader>
                <CardTitle>Brand Assets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">Brand Guidelines</h4>
                  {client.brandGuidelines ? (
                     <Button variant="link" className="p-0 h-auto" asChild>
                       <a href={client.brandGuidelines.asset?.url} target="_blank" rel="noopener noreferrer">
                         Download PDF <ExternalLink className="ml-2 h-3 w-3" />
                       </a>
                     </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not uploaded.</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                 <p className="text-sm whitespace-pre-wrap">{client.notes || "No internal notes."}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
