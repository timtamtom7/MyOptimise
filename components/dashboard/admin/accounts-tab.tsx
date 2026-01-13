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
  const { t } = useTranslation();
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedRole, setSelectedRole] = useState<string>("employee");
  const [checkedCaps, setCheckedCaps] = useState<Set<string>>(new Set());

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    const role = account.type || "employee";
    setSelectedRole(role);
    
    const base = ROLE_CAPABILITIES[role] || {};
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
    const base = ROLE_CAPABILITIES[newRole] || {};
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('accounts')}</h2>
          <p className="text-muted-foreground">{t('manageAccountsDesc')}</p>
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
          <div className="rounded-md border">
            <div className="p-4">
              <div className="grid gap-4">
                {accounts.map((account) => (
                  <div key={account._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
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
          </div>
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
                const baseForRole = ROLE_CAPABILITIES[selectedRole] || {};
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
                  <Select name="status" defaultValue={selectedAccount.status || "active"}>
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

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{t('capabilities')}</Label>
                  <Badge variant="outline" className="text-xs">
                    {checkedCaps.size} {t('selected')}
                  </Badge>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  {Object.entries(
                    ALL_CAPABILITIES.reduce((acc, cap) => {
                      const [group] = cap.split('.');
                      if (!acc[group]) acc[group] = [];
                      acc[group].push(cap);
                      return acc;
                    }, {} as Record<string, string[]>)
                  ).map(([group, caps]) => (
                    <div key={group} className="p-4 border-b last:border-0 bg-card">
                       <h4 className="mb-3 text-sm font-semibold capitalize text-primary flex items-center gap-2">
                         {t(`capability_group_${group}`) !== `capability_group_${group}` ? t(`capability_group_${group}`) : group}
                         <span className="text-xs font-normal text-muted-foreground ml-auto">{caps.filter(c => checkedCaps.has(c)).length}/{caps.length}</span>
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {caps.map(cap => (
                           <div key={cap} className="flex items-start space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                             <Checkbox 
                               id={`cap-${cap}`} 
                               checked={checkedCaps.has(cap)}
                               onCheckedChange={() => toggleCapability(cap)}
                             />
                             <div className="grid gap-1.5 leading-none pt-0.5">
                               <label 
                                 htmlFor={`cap-${cap}`}
                                 className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer capitalize"
                               >
                                 {t(`capability_${cap.replace(/\./g, '_')}`) !== `capability_${cap.replace(/\./g, '_')}` 
                                   ? t(`capability_${cap.replace(/\./g, '_')}`) 
                                   : cap.split('.').slice(1).join(' ').replace(/_/g, ' ')}
                               </label>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setSelectedAccount(null)}>{t('cancel')}</Button>
                <Button type="submit" loading={isPending}>{t('saveChanges')}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
