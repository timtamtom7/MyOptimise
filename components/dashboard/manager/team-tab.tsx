"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { generateBlueGradient } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

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
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      {capabilities.canInvite && (
        <Card>
          <CardHeader>
            <CardTitle>{t('inviteEmployeeTitle')}</CardTitle>
            <CardDescription>{t('inviteEmployeeDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={actions.inviteEmployee} className="flex gap-4">
              <Input
                name="name"
                type="text"
                placeholder={t('employeeNamePlaceholder')}
                required
                className="max-w-sm"
              />
              <Input
                name="email"
                type="email"
                placeholder={t('emailPlaceholder')}
                required
                className="max-w-sm"
              />
              <Button type="submit">{t('invite')}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('teamMembers')}</CardTitle>
          <CardDescription>{t('manageTeamDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees.map((employee) => (
              <div key={employee._id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback 
                      style={{ background: generateBlueGradient(employee.email) }}
                      className="text-white"
                    >
                      {(employee.name?.[0] || employee.email?.[0] || "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{employee.name || t('accounts_unnamed')}</div>
                    <div className="text-sm text-muted-foreground">{employee.email}</div>
                  </div>
                </div>
                <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                  {employee.status || t('active')}
                </Badge>
              </div>
            ))}
            {employees.length === 0 && (
              <div className="text-center text-muted-foreground">{t('noTeamMembersFound')}</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
