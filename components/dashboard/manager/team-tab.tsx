"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface TeamTabProps {
  employees: any[];
  capabilities: {
    canInvite: boolean;
  };
  actions: {
    inviteEmployee: (formData: FormData) => Promise<void>;
  };
}

export function TeamTab({ employees, capabilities, actions }: TeamTabProps) {
  return (
    <div className="space-y-6">
      {capabilities.canInvite && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Employee</CardTitle>
            <CardDescription>Invite a new team member via Google email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={actions.inviteEmployee} className="flex gap-4">
              <Input
                name="name"
                type="text"
                placeholder="Employee Name"
                required
                className="max-w-sm"
              />
              <Input
                name="email"
                type="email"
                placeholder="employee@company.com"
                required
                className="max-w-sm"
              />
              <Button type="submit">Invite</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage your team.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees.map((employee) => (
              <div key={employee._id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={`https://avatar.vercel.sh/${employee.email}`} />
                    <AvatarFallback>{employee.name?.[0] || employee.email[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{employee.name || "Unnamed"}</div>
                    <div className="text-sm text-muted-foreground">{employee.email}</div>
                  </div>
                </div>
                <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                  {employee.status || "active"}
                </Badge>
              </div>
            ))}
            {employees.length === 0 && (
              <div className="text-center text-muted-foreground">No team members found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
