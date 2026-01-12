"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/date-formatting";

interface ServicesTabProps {
  clientServices: any[];
  openServiceRequests: any[];
  clients: any[];
  capabilities: {
    canManageServices: boolean;
  };
  actions: {
    createClientService: (formData: FormData) => Promise<void>;
    updateClientService: (formData: FormData) => Promise<void>;
    updateServiceRequestStatus: (formData: FormData) => Promise<void>;
  };
}

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function ServicesTab({
  clientServices,
  openServiceRequests,
  clients,
  capabilities,
  actions,
}: ServicesTabProps) {
  if (!capabilities.canManageServices) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">You do not have permission to manage services.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Service */}
      <Card>
        <CardHeader>
          <CardTitle>Create Service</CardTitle>
          <CardDescription>Add a new service for a client.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={actions.createClientService} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select name="clientId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name || c.email || c._id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input name="title" placeholder="Service Title" required />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select name="serviceType" defaultValue="other">
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="ads">Ads</SelectItem>
                  <SelectItem value="seo">SEO</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue="active">
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-full flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox name="clientCanToggle" id="new-clientCanToggle" />
                <Label htmlFor="new-clientCanToggle" className="cursor-pointer">Client can toggle</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox name="clientEnabled" id="new-clientEnabled" defaultChecked />
                <Label htmlFor="new-clientEnabled" className="cursor-pointer">Client enabled</Label>
              </div>
              <Button size="sm">Create Service</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing Services */}
      <Card>
        <CardHeader>
          <CardTitle>Client Services</CardTitle>
          <CardDescription>Manage existing services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {clientServices.map((s) => (
            <div key={s._id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{s.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {s.client?.name || s.client?.email}
                    {s.serviceType ? ` • ${s.serviceType}` : ""}
                  </div>
                </div>
                <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
              </div>

              <form action={actions.updateClientService} className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <input type="hidden" name="id" value={s._id} />
                <div className="space-y-2">
                  <Select name="status" defaultValue={s.status || "active"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Input
                    name="statusNote"
                    defaultValue={s.statusNote || ""}
                    placeholder="Status note…"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox name="clientCanToggle" id={`toggle-${s._id}`} defaultChecked={Boolean(s.clientCanToggle)} />
                    <Label htmlFor={`toggle-${s._id}`} className="cursor-pointer text-sm">Can toggle</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox name="clientEnabled" id={`enabled-${s._id}`} defaultChecked={Boolean(s.clientEnabled)} />
                    <Label htmlFor={`enabled-${s._id}`} className="cursor-pointer text-sm">Enabled</Label>
                  </div>
                  <Button size="sm" variant="outline">
                    Update
                  </Button>
                </div>
              </form>
            </div>
          ))}
          {clientServices.length === 0 && (
            <div className="text-center text-sm text-muted-foreground">No services found.</div>
          )}
        </CardContent>
      </Card>

      {/* Service Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Service Requests</CardTitle>
          <CardDescription>Requests from clients for new services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {openServiceRequests.map((r) => (
            <div key={r._id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">
                    {r.clientAccount?.name || r.clientAccount?.email || "Client"} • {r.requestedServiceType}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {r.status} • {formatDate(r.createdAt)}
                  </div>
                  {r.details && <div className="mt-2 text-sm text-muted-foreground">{r.details}</div>}
                  {r.attachments?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {r.attachments.map((a: any, i: number) => (
                        <div key={i} className="text-sm">
                          <a
                            className="underline"
                            href={a.asset?.url || "#"}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {a.asset?.originalFilename || "Attachment"}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Badge variant="outline">{r.status}</Badge>
              </div>

              <form action={actions.updateServiceRequestStatus} className="mt-4 flex gap-4">
                <input type="hidden" name="id" value={r._id} />
                <Select name="status" defaultValue={r.status || "submitted"}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submitted" disabled>Submitted</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  name="resolutionNote"
                  defaultValue={r.resolutionNote || ""}
                  placeholder="Resolution note…"
                  className="max-w-xs"
                />
                <Button size="sm">Update Status</Button>
              </form>
            </div>
          ))}
          {openServiceRequests.length === 0 && (
            <div className="text-center text-sm text-muted-foreground">No open service requests.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
