"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateBlueGradient } from "@/lib/utils";
import { 
  MoreHorizontal, 
  Shield, 
  UserPlus, 
  Mail, 
  Edit, 
  Trash2,
  Lock,
  CheckSquare,
  FileText,
  Briefcase,
  Users,
  Layers,
  PenTool,
  Calendar,
  MessageSquare,
  TrendingUp,
  DollarSign,
  BarChart3,
  HelpCircle,
  ShieldAlert,
  Activity,
  Check,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  LayoutGrid,
  List,
  Plus,
  Eye,
  Trash,
  Settings,
  Download,
  Upload,
  Zap,
  Globe,
  LifeBuoy
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ALL_CAPABILITIES, ROLE_CAPABILITIES, UserCapabilities } from "@/lib/capabilities";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import { cn } from "@/lib/utils";

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

const CAPABILITY_ICONS: Record<string, any> = {
  tasks: CheckSquare,
  content: PenTool,
  documents: FileText,
  calendar: Calendar,
  message: MessageSquare,
  sales: TrendingUp,
  finance: DollarSign,
  analytics: BarChart3,
  security: ShieldAlert,
  system: Activity,
  users: Users,
  client: Briefcase,
  identity: UserPlus,
  admin: Shield,
  support: LifeBuoy,
  strategy: Globe,
  chat: MessageSquare,
};

const ACTION_ICONS: Record<string, any> = {
  create: Plus,
  read: Eye,
  update: Edit,
  delete: Trash,
  manage: Settings,
  export: Download,
  import: Upload,
  publish: Zap,
};

function getActionIcon(cap: string) {
  const parts = cap.split('.');
  const action = parts[parts.length - 1];
  
  if (action.includes('create') || action.includes('add')) return ACTION_ICONS.create;
  if (action.includes('read') || action.includes('view') || action.includes('list')) return ACTION_ICONS.read;
  if (action.includes('update') || action.includes('edit')) return ACTION_ICONS.update;
  if (action.includes('delete') || action.includes('remove')) return ACTION_ICONS.delete;
  if (action.includes('manage')) return ACTION_ICONS.manage;
  if (action.includes('export')) return ACTION_ICONS.export;
  if (action.includes('import')) return ACTION_ICONS.import;
  if (action.includes('publish')) return ACTION_ICONS.publish;
  
  return null;
}

export function AccountsTab({ accounts, capabilities, actions }: AccountsTabProps) {
  const { t } = useTranslation();
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedRole, setSelectedRole] = useState<string>("employee");
  const [checkedCaps, setCheckedCaps] = useState<Set<string>>(new Set());
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    const role = account.type || "employee";
    setSelectedRole(role);
    setPassword("");
    setConfirmPassword("");
    
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

  const toggleGroup = (group: string, caps: string[]) => {
    const next = new Set(checkedCaps);
    const allInGroupChecked = caps.every(c => next.has(c));
    
    if (allInGroupChecked) {
        // Deselect all
        caps.forEach(c => next.delete(c));
    } else {
        // Select all
        caps.forEach(c => next.add(c));
    }
    setCheckedCaps(next);
  };

  const handleInvite = async (formData: FormData) => {
    startTransition(async () => {
      await actions.inviteGoogleAccount(formData);
    });
  };

  const handleUpdate = async (formData: FormData) => {
    if (password && password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    startTransition(async () => {
      await actions.updateAccount(formData);
      setSelectedAccount(null);
    });
  };

  const getCapabilityLabel = (cap: string) => {
    const parts = cap.split('.');
    if (parts.length > 1) {
        return parts.slice(1).join(' ').replace(/_/g, ' ');
    }
    return cap.replace(/_/g, ' ');
  };

  const filteredCapabilities = ALL_CAPABILITIES.filter(cap => 
    cap.toLowerCase().includes(searchTerm.toLowerCase()) || 
    getCapabilityLabel(cap).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const capabilityGroups = Object.entries(
    filteredCapabilities.reduce((acc, cap) => {
      const [group] = cap.split('.');
      if (!acc[group]) acc[group] = [];
      acc[group].push(cap);
      return acc;
    }, {} as Record<string, string[]>)
  )
  .map(([group, caps]) => [group, caps.sort()] as [string, string[]])
  .sort((a, b) => a[0].localeCompare(b[0]));

  const sortedAccounts = [...accounts].sort((a, b) => {
    const nameA = a.name || a.email || "";
    const nameB = b.name || b.email || "";
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('accounts')}</h2>
          <p className="text-muted-foreground">{t('manageAccountsDesc')}</p>
        </div>
        {capabilities.canInvite && (
           <Button 
            onClick={() => document.getElementById("invite-trigger")?.click()}
            className="rounded-[2rem] h-14 px-8 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all font-bold"
           >
            <UserPlus className="mr-2 h-5 w-5" /> {t('inviteUser')}
           </Button>
        )}
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="h-16 p-1 rounded-[2rem] bg-slate-100 dark:bg-slate-800/50">
          <TabsTrigger value="list" className="h-14 rounded-[1.8rem] px-8 data-[state=active]:shadow-md transition-all font-bold">{t('allAccounts')} ({accounts.length})</TabsTrigger>
          <TabsTrigger value="invite" id="invite-trigger" className="h-14 rounded-[1.8rem] px-8 data-[state=active]:shadow-md transition-all font-bold">{t('invite')}</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden shadow-sm">
            <div className="p-6">
              <div className="grid gap-4">
                {sortedAccounts.map((account) => (
                  <div key={account._id} className="flex items-center justify-between p-5 border border-slate-100 dark:border-slate-800 rounded-[2rem] bg-white dark:bg-slate-900 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 group">
                    <div className="flex items-center gap-6">
                      <Avatar className="h-14 w-14 rounded-2xl ring-4 ring-slate-50 dark:ring-slate-800/50 shadow-sm">
                        <AvatarFallback 
                          style={{ background: generateBlueGradient(account.email) }}
                          className="text-white font-bold text-xl rounded-2xl"
                        >
                          {(account.name?.[0] || account.email?.[0] || "?").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold text-lg flex items-center gap-3 text-slate-900 dark:text-slate-100">
                          {account.name || t('accounts_unnamed')}
                          <Badge variant="outline" className="rounded-xl px-3 py-1 text-xs font-bold capitalize bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                            {account.type}
                          </Badge>
                          {account.status === 'disabled' && (
                            <Badge variant="destructive" className="rounded-xl text-xs font-bold">{t('disabled')}</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5 font-medium">{account.email}</div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 group-hover:text-blue-600 transition-colors">
                          <MoreHorizontal className="h-6 w-6" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-[2rem] w-64 p-3 shadow-2xl border-slate-100 dark:border-slate-800">
                        <DropdownMenuLabel className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('actions')}</DropdownMenuLabel>
                        {capabilities.canImpersonate && account.status !== 'disabled' && (
                          <DropdownMenuItem asChild className="rounded-2xl p-3 cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 text-blue-600 dark:text-blue-400 mb-1">
                            <form action={actions.startImpersonation} className="w-full">
                              <input type="hidden" name="targetId" value={account._id} />
                              <button className="w-full text-left flex items-center font-bold">
                                <Shield className="mr-3 h-5 w-5" /> {t('impersonate')}
                              </button>
                            </form>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleEditAccount(account)} className="rounded-2xl p-3 cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                           <Edit className="mr-3 h-5 w-5 text-slate-500" /> {t('editAccount')}
                        </DropdownMenuItem>
                        {capabilities.canRemove && (
                            <>
                              <DropdownMenuSeparator className="my-2 bg-slate-100 dark:bg-slate-800" />
                              <DropdownMenuItem className="rounded-2xl p-3 cursor-pointer focus:bg-red-50 dark:focus:bg-red-900/20 text-red-600 focus:text-red-700 font-bold">
                                <form action={actions.removeAccount} className="w-full">
                                  <input type="hidden" name="id" value={account._id} />
                                  <button className="w-full text-left flex items-center">
                                    <Trash2 className="mr-3 h-5 w-5" /> {t('removeAccount')}
                                  </button>
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
          <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 pb-10 pt-10 px-10">
              <CardTitle className="text-3xl font-bold">{t('inviteNewUser')}</CardTitle>
              <CardDescription className="text-lg mt-2">{t('inviteNewUserDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="p-10">
              {capabilities.canInvite ? (
                <form action={handleInvite} className="space-y-8 max-w-2xl">
                  <div className="grid gap-3">
                    <Label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">{t('emailAddress')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-6 top-5 h-6 w-6 text-slate-400" />
                      <Input 
                        name="email" 
                        type="email" 
                        placeholder={t('emailPlaceholder')} 
                        className="pl-16 h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-lg" 
                        required 
                      />
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <Label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">{t('role')}</Label>
                    <Select name="type" defaultValue="employee">
                      <SelectTrigger className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all px-6 font-medium text-lg">
                        <SelectValue placeholder={t('accounts_select_role')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-[2rem] p-3 shadow-2xl">
                        <SelectItem value="employee" className="rounded-2xl py-4 px-4 cursor-pointer text-base font-medium mb-1">{t('role_employee')}</SelectItem>
                        <SelectItem value="manager" className="rounded-2xl py-4 px-4 cursor-pointer text-base font-medium mb-1">{t('role_manager')}</SelectItem>
                        <SelectItem value="admin" className="rounded-2xl py-4 px-4 cursor-pointer text-base font-medium mb-1">{t('role_admin')}</SelectItem>
                        <SelectItem value="client" className="rounded-2xl py-4 px-4 cursor-pointer text-base font-medium">{t('role_client')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" loading={isPending} className="h-16 rounded-[2rem] w-full text-lg font-bold shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    {t('sendInvitation')}
                  </Button>
                </form>
              ) : (
                <div className="text-red-500 font-bold p-6 bg-red-50 dark:bg-red-900/20 rounded-[2rem] border border-red-200 dark:border-red-900/50 flex items-center gap-4 text-lg">
                    <ShieldAlert className="h-8 w-8" />
                    {t('noPermissionInvite')}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedAccount} onOpenChange={(open) => !open && setSelectedAccount(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-[3rem] border-0 shadow-2xl bg-white dark:bg-slate-950 ring-1 ring-black/5 dark:ring-white/10">
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            
            {/* Header with gradient */}
            <div className="relative bg-slate-50 dark:bg-slate-900/50 px-10 py-10 pb-12 border-b border-slate-100 dark:border-slate-800/50">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
                <DialogHeader>
                    <DialogTitle className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        {t('editAccount')}
                    </DialogTitle>
                    <DialogDescription className="text-lg text-slate-500 font-medium mt-3 max-w-2xl">
                        {t('editAccountDesc')} <span className="text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/30">{selectedAccount?.email}</span>
                    </DialogDescription>
                </DialogHeader>
            </div>

            {selectedAccount && (
                <form action={handleUpdate} className="p-10 pt-8 space-y-12">
                <input type="hidden" name="id" value={selectedAccount._id} />
                
                {/* Account Details Section */}
                <div className="space-y-8">
                    <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-slate-100">
                        <div className="h-10 w-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                             <UserPlus className="h-5 w-5" />
                        </div>
                        {t('accountDetails')}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">{t('role')}</Label>
                            <Select name="type" defaultValue={selectedAccount.type || "employee"} onValueChange={handleRoleChange}>
                                <SelectTrigger className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all px-6 font-medium text-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-[2rem] p-3 shadow-2xl">
                                    <SelectItem value="employee" className="rounded-2xl py-4 px-4 cursor-pointer text-base font-medium mb-1">{t('role_employee')}</SelectItem>
                                    <SelectItem value="manager" className="rounded-2xl py-4 px-4 cursor-pointer text-base font-medium mb-1">{t('role_manager')}</SelectItem>
                                    <SelectItem value="admin" className="rounded-2xl py-4 px-4 cursor-pointer text-base font-medium mb-1">{t('role_admin')}</SelectItem>
                                    <SelectItem value="client" className="rounded-2xl py-4 px-4 cursor-pointer text-base font-medium">{t('role_client')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">{t('status')}</Label>
                            <Select name="status" defaultValue={selectedAccount.status || "active"}>
                                <SelectTrigger className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all px-6 font-medium text-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-[2rem] p-3 shadow-2xl">
                                    <SelectItem value="active" className="rounded-2xl py-4 px-4 cursor-pointer text-base font-medium mb-1">{t('active')}</SelectItem>
                                    <SelectItem value="disabled" className="rounded-2xl py-4 px-4 cursor-pointer text-base font-medium">{t('disabled')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3 col-span-1 md:col-span-2">
                            <Label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">{t('avatar')}</Label>
                            <Input type="file" name="avatar" accept="image/*" className="h-16 pt-4 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium file:mr-6 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all px-6" />
                        </div>
                        
                        <div className="space-y-3">
                            <Label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">{t('password')} (Optional)</Label>
                            <Input 
                                type="password" 
                                name="password" 
                                placeholder="Set new password" 
                                className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all px-6 font-medium text-lg" 
                            />
                        </div>
                         <div className="space-y-3">
                            <Label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">Confirm Password</Label>
                            <Input 
                                type="password" 
                                name="confirmPassword" 
                                placeholder="Confirm new password" 
                                className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all px-6 font-medium text-lg" 
                            />
                        </div>
                    </div>
                </div>

                {/* Capabilities Section */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-slate-100">
                             <div className="h-10 w-10 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                                <ShieldAlert className="h-5 w-5" />
                            </div>
                            {t('capabilities')}
                        </h3>
                        <Badge variant="outline" className="h-10 rounded-full px-6 text-sm font-bold border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                            {checkedCaps.size} {t('selected')}
                        </Badge>
                    </div>
                    
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div>
                                    <Label className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        {t('capabilities')}
                                    </Label>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 ml-14 font-medium max-w-md">
                                        Manage granular permissions. Select specific actions or entire groups.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:w-64 group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input 
                                            placeholder="Search permissions..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="h-12 pl-11 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 font-medium transition-all"
                                        />
                                    </div>
                                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setViewMode('grid')}
                                            className={cn("h-9 w-9 p-0 rounded-xl transition-all", viewMode === 'grid' ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700")}
                                        >
                                            <LayoutGrid className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setViewMode('list')}
                                            className={cn("h-9 w-9 p-0 rounded-xl transition-all", viewMode === 'list' ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700")}
                                        >
                                            <List className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 min-h-[400px]">
                                {capabilityGroups.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                        <div className="h-20 w-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                            <Search className="h-10 w-10 opacity-20" />
                                        </div>
                                        <p className="font-bold text-lg">No capabilities found</p>
                                        <p className="text-sm">Try searching for something else</p>
                                    </div>
                                ) : (
                                    <div className={cn(
                                        "gap-8",
                                        viewMode === 'grid' ? "columns-1 lg:columns-2 space-y-8" : "space-y-8"
                                    )}>
                                        {capabilityGroups.map(([group, caps]) => {
                                            const GroupIcon = CAPABILITY_ICONS[group] || Activity;
                                            const selectedCount = caps.filter(c => checkedCaps.has(c)).length;
                                            const isAllSelected = selectedCount === caps.length;
                                            
                                            return (
                                                <div key={group} className="break-inside-avoid-column rounded-[2.5rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xl shadow-slate-200/40 dark:shadow-none hover:shadow-2xl transition-all duration-300 overflow-hidden group/card">
                                                    <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-white dark:from-slate-900/80 dark:to-slate-950">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-12 w-12 rounded-[1rem] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner ring-4 ring-white dark:ring-slate-950">
                                                                <GroupIcon className="h-6 w-6" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-900 dark:text-slate-100 capitalize text-lg tracking-tight">{t(`capability_group_${group}`) !== `capability_group_${group}` ? t(`capability_group_${group}`) : group}</h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Badge variant="secondary" className="h-5 px-2 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                                                                        {selectedCount}/{caps.length}
                                                                    </Badge>
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => toggleGroup(group, caps)}
                                                            className={cn(
                                                                "h-9 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                                                                isAllSelected 
                                                                    ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30" 
                                                                    : "bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30"
                                                            )}
                                                        >
                                                            {isAllSelected ? "Deselect" : "Select All"}
                                                        </Button>
                                                    </div>
                                                    
                                                    <div className={cn(
                                                        "p-6 grid gap-4",
                                                        viewMode === 'grid' ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                                                    )}>
                                                        {caps.map(cap => {
                                                            const isChecked = checkedCaps.has(cap);
                                                            const ActionIcon = getActionIcon(cap);
                                                            
                                                            return (
                                                                <div 
                                                                    key={cap} 
                                                                    onClick={() => toggleCapability(cap)}
                                                                    className={cn(
                                                                        "group relative flex items-center gap-4 p-4 rounded-[1.2rem] cursor-pointer border-2 transition-all duration-200 select-none overflow-hidden",
                                                                        isChecked
                                                                            ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]" 
                                                                            : "bg-slate-50 dark:bg-slate-900/50 border-transparent hover:bg-white dark:hover:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md"
                                                                    )}
                                                                >
                                                                    {/* Checkbox Visual */}
                                                                    <div className={cn(
                                                                        "flex-shrink-0 h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 z-10",
                                                                        isChecked
                                                                            ? "border-white bg-white/20 text-white rotate-0"
                                                                            : "border-slate-300 dark:border-slate-600 group-hover:border-blue-400 text-transparent rotate-12 group-hover:rotate-0"
                                                                    )}>
                                                                        <Check className="h-4 w-4" strokeWidth={4} />
                                                                    </div>
                                                                    
                                                                    {/* Content */}
                                                                    <div className="flex-1 min-w-0 z-10">
                                                                        <div className="flex items-center gap-2 mb-0.5">
                                                                            {ActionIcon && (
                                                                                <ActionIcon className={cn("h-3.5 w-3.5", isChecked ? "text-blue-100" : "text-slate-400")} />
                                                                            )}
                                                                            <span className={cn(
                                                                                "text-sm font-bold capitalize truncate",
                                                                                isChecked ? "text-white" : "text-slate-700 dark:text-slate-200"
                                                                            )}>
                                                                                {getCapabilityLabel(cap)}
                                                                            </span>
                                                                        </div>
                                                                        <span className={cn(
                                                                            "block text-[10px] font-mono truncate opacity-70",
                                                                            isChecked ? "text-blue-50" : "text-slate-400"
                                                                        )}>
                                                                            {cap}
                                                                        </span>
                                                                    </div>

                                                                    {/* Decoration */}
                                                                    {isChecked && (
                                                                        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none" />
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                </div>

                {/* Password Section */}
                <div className="space-y-8">
                    <h3 className="text-xl font-bold flex items-center gap-3 text-slate-900 dark:text-slate-100">
                        <div className="h-10 w-10 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center">
                             <Lock className="h-5 w-5" />
                        </div>
                        {t('securityAndPassword')}
                    </h3>
                    <div className="p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-3">
                                <Label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">{t('newPassword')}</Label>
                                <Input 
                                    type="password" 
                                    name="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('leaveBlankToKeepCurrent')} 
                                    className="h-16 rounded-[2rem] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-medium px-6 text-lg" 
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">{t('confirmPassword')}</Label>
                                <Input 
                                    type="password" 
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={t('confirmNewPassword')} 
                                    className="h-16 rounded-[2rem] bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 font-medium px-6 text-lg" 
                                />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-6 ml-2 flex items-center gap-2 font-medium">
                            <Shield className="h-4 w-4" />
                            {t('onlyFillToChangePassword')}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 sticky bottom-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl p-6 -mx-10 -mb-8 mt-6 z-20">
                    <Button type="button" variant="ghost" onClick={() => setSelectedAccount(null)} className="h-16 rounded-[2rem] px-8 font-bold text-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">{t('cancel')}</Button>
                    <Button type="submit" loading={isPending} className="h-16 rounded-[2rem] px-10 font-bold text-lg shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all">{t('saveChanges')}</Button>
                </div>
                </form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
