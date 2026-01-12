"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Shield, UserPlus, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AccountsTabProps {
  accounts: any[];
  capabilities: {
    canInvite: boolean;
    canRemove: boolean;
    canImpersonate: boolean;
  };
  actions: {
    inviteGoogleAccount: (formData: FormData) => Promise<void>;
    updateAccount: (formData: FormData) => Promise<void>;
    removeAccount: (formData: FormData) => Promise<void>;
    startImpersonation: (formData: FormData) => Promise<void>;
    resetAccountSessions?: (formData: FormData) => Promise<void>;
  };
}

export function AccountsTab({ accounts, capabilities, actions }: AccountsTabProps) {
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const handleEditCapabilities = (account: any) => {
    setSelectedAccount(account);
    // TODO: Open modal for capability editing
  };

  const handleInvite = async (formData: FormData) => {
    startTransition(async () => {
      await actions.inviteGoogleAccount(formData);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Accounts</h2>
          <p className="text-muted-foreground">Manage users, roles, and access.</p>
        </div>
        {capabilities.canInvite && (
           <Button onClick={() => document.getElementById("invite-trigger")?.click()}>
            <UserPlus className="mr-2 h-4 w-4" /> Invite User
           </Button>
        )}
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">All Accounts ({accounts.length})</TabsTrigger>
          <TabsTrigger value="invite" id="invite-trigger">Invite</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="rounded-md border">
            <div className="p-4">
              <div className="grid gap-4">
                {accounts.map((account) => (
                  <div key={account._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={`https://avatar.vercel.sh/${account.email}`} />
                        <AvatarFallback>{account.name?.[0] || account.email[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {account.name || 'Unnamed'}
                          <Badge variant="outline" className="text-xs font-normal capitalize">
                            {account.type}
                          </Badge>
                          {account.status === 'disabled' && (
                            <Badge variant="destructive" className="text-xs font-normal">Disabled</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">{account.email}</div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {capabilities.canImpersonate && account.status !== 'disabled' && (
                          <DropdownMenuItem>
                            <form action={actions.startImpersonation} className="w-full">
                              <input type="hidden" name="targetId" value={account._id} />
                              <button className="w-full text-left flex items-center">
                                <Shield className="mr-2 h-4 w-4" /> Impersonate
                              </button>
                            </form>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleEditCapabilities(account)}>
                           Manage Capabilities
                        </DropdownMenuItem>
                        {capabilities.canRemove && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600 focus:text-red-600">
                                <form action={actions.removeAccount} className="w-full">
                                  <input type="hidden" name="id" value={account._id} />
                                  <button className="w-full text-left">Remove Account</button>
                                </form>
                              </DropdownMenuItem>
                            </>
                         )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="invite">
          <Card>
            <CardHeader>
              <CardTitle>Invite New User</CardTitle>
              <CardDescription>Send an invitation to join the organization via Google Auth.</CardDescription>
            </CardHeader>
            <CardContent>
              {capabilities.canInvite ? (
                <form action={handleInvite} className="space-y-4 max-w-md">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input name="email" type="email" placeholder="user@company.com" className="pl-9" required />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Role</label>
                    <select name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                      <option value="client">Client</option>
                    </select>
                  </div>
                  <Button type="submit" loading={isPending}>Send Invitation</Button>
                </form>
              ) : (
                <div className="text-red-500">You do not have permission to invite users.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
