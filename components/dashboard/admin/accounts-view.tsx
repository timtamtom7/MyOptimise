"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateBlueGradient } from "@/lib/utils";
import { MoreHorizontal, Shield, UserPlus, Mail, Edit } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ALL_CAPABILITIES, ROLE_CAPABILITIES, UserCapabilities } from "@/lib/capabilities";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";

interface AccountsViewProps {
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
  };
}

export function AccountsView({ accounts, capabilities, actions }: AccountsViewProps) {
  const { t } = useTranslation();
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedRole, setSelectedRole] = useState<string>("employee");
  const [checkedCaps, setCheckedCaps] = useState<Set<string>>(new Set());

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    const role = account.type || "employee";
    setSelectedRole(role);
    
    const base = ROLE_CAPABILITIES[role as keyof typeof ROLE_CAPABILITIES] || {};
    const caps = new Set<string>();
    
    // Add base
    Object.entries(base).forEach(([k, v]) => {
      if (v) caps.add(k);
    });
    
    // Add extra
    if (Array.isArray(account.capabilities)) {
      account.capabilities.forEach((c: string) => caps.add(c));
    }
    
    // Remove revoked
    if (Array.isArray(account.revokedCapabilities)) {
      account.revokedCapabilities.forEach((c: string) => caps.delete(c));
    }
    
    setCheckedCaps(caps);
  };

  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole);
    // Reset to new role defaults
    const base = ROLE_CAPABILITIES[newRole as keyof typeof ROLE_CAPABILITIES] || {};
    const caps = new Set<string>();
    Object.entries(base).forEach(([k, v]) => {
      if (v) caps.add(k);
    });
    setCheckedCaps(caps);
  };

  const toggleCapability = (cap: string) => {
    const next = new Set(checkedCaps);
    if (next.has(cap)) next.delete(cap);
    else next.add(cap);
    setCheckedCaps(next);
  };

  const handleInvite = async (formData: FormData) => {
    startTransition(async () => {
      await actions.inviteGoogleAccount(formData);
    });
  };

  const handleUpdate = async (formData: FormData) => {
    startTransition(async () => {
      await actions.updateAccount(formData);
      setSelectedAccount(null);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('accounts')}</h1>
          <p className="text-muted-foreground mt-2">{t('manageAccountsDesc')}</p>
        </div>
        {capabilities.canInvite && (
           <Button onClick={() => document.getElementById("invite-trigger")?.click()}>
            <UserPlus className="mr-2 h-4 w-4" /> {t('inviteUser')}
           </Button>
        )}
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">{t('allAccounts')} ({accounts.length})</TabsTrigger>
          <TabsTrigger value="invite" id="invite-trigger">{t('invite')}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border-0">
                  <div className="grid gap-0 divide-y">
                    {accounts.map((account) => (
                      <div key={account._id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback 
                              style={{ background: generateBlueGradient(account.email) }}
                              className="text-white"
                            >
                              {(account.name?.[0] || account.email?.[0] || "?").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {account.name || t('accounts_unnamed')}
                              <Badge variant="outline" className="text-xs font-normal capitalize">
                                {account.type}
                              </Badge>
                              {account.status === 'disabled' && (
                                <Badge variant="destructive" className="text-xs font-normal">{t('disabled')}</Badge>
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
                            <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                            {capabilities.canImpersonate && account.status !== 'disabled' && (
                              <DropdownMenuItem>
                                <form action={actions.startImpersonation} className="w-full">
                                  <input type="hidden" name="targetId" value={account._id} />
                                  <button className="w-full text-left flex items-center">
                                    <Shield className="mr-2 h-4 w-4" /> {t('impersonate')}
                                  </button>
                                </form>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleEditAccount(account)}>
                               <Edit className="mr-2 h-4 w-4" /> {t('editAccount')}
                            </DropdownMenuItem>
                            {capabilities.canRemove && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600 focus:text-red-600">
                                    <form action={actions.removeAccount} className="w-full">
                                      <input type="hidden" name="id" value={account._id} />
                                      <button className="w-full text-left">{t('removeAccount')}</button>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invite">
          <Card>
            <CardHeader>
              <CardTitle>{t('inviteNewUser')}</CardTitle>
              <CardDescription>{t('inviteNewUserDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {capabilities.canInvite ? (
                <form action={handleInvite} className="space-y-4 max-w-md">
                  <div className="grid gap-2">
                    <Label>{t('emailAddress')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input name="email" type="email" placeholder={t('emailPlaceholder')} className="pl-9" required />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('role')}</Label>
                    <Select name="type" defaultValue="employee">
                      <SelectTrigger>
                        <SelectValue placeholder={t('accounts_select_role')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">{t('role_employee')}</SelectItem>
                        <SelectItem value="manager">{t('role_manager')}</SelectItem>
                        <SelectItem value="admin">{t('role_admin')}</SelectItem>
                        <SelectItem value="client">{t('role_client')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" loading={isPending}>{t('sendInvitation')}</Button>
                </form>
              ) : (
                <div className="text-red-500">{t('noPermissionInvite')}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedAccount} onOpenChange={(open) => !open && setSelectedAccount(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editAccount')}</DialogTitle>
            <DialogDescription>
              {t('editAccountDesc')} {selectedAccount?.email}
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <form action={handleUpdate} className="space-y-6">
              <input type="hidden" name="id" value={selectedAccount._id} />
              
              {(() => {
                const baseForRole = ROLE_CAPABILITIES[selectedRole as keyof typeof ROLE_CAPABILITIES] || {};
                const added = Array.from(checkedCaps).filter(c => !baseForRole[c as keyof UserCapabilities]);
                const revoked = Object.keys(baseForRole).filter(c => baseForRole[c as keyof UserCapabilities] && !checkedCaps.has(c));
                return (
                  <>
                    <input type="hidden" name="capabilities" value={added.join('\n')} />
                    <input type="hidden" name="revokedCapabilities" value={revoked.join('\n')} />
                  </>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('name')}</Label>
                  <Input name="name" defaultValue={selectedAccount.name} placeholder={t('fullName')} />
                </div>
                <div className="space-y-2">
                  <Label>{t('emailAddress')}</Label>
                  <Input name="email" defaultValue={selectedAccount.email} readOnly className="bg-muted" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('avatar')}</Label>
                <Input type="file" name="avatar" accept="image/*" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('role')}</Label>
                  <Select name="type" value={selectedRole} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">{t('role_employee')}</SelectItem>
                      <SelectItem value="manager">{t('role_manager')}</SelectItem>
                      <SelectItem value="admin">{t('role_admin')}</SelectItem>
                      <SelectItem value="client">{t('role_client')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('status')}</Label>
                  <Select name="status" defaultValue={selectedAccount.status || 'active'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="active">{t('active')}</SelectItem>
                        <SelectItem value="disabled">{t('disabled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Capabilities Toggles */}
              <div className="space-y-2">
                <Label>{t('capabilities')}</Label>
                <div className="grid grid-cols-2 gap-2 text-sm max-h-48 overflow-y-auto border p-2 rounded">
                  {ALL_CAPABILITIES.map(cap => (
                    <div key={cap} className="flex items-center space-x-2">
                      <Checkbox 
                        id={cap} 
                        checked={checkedCaps.has(cap)}
                        onCheckedChange={() => toggleCapability(cap)}
                      />
                      <label htmlFor={cap} className="cursor-pointer">{cap}</label>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" loading={isPending}>{t('saveChanges')}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
