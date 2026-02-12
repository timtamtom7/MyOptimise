"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { generateBlueGradient } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { UserPlus, Mail, User, Shield, Search, MoreHorizontal, Pencil, Trash2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";

interface TeamTabProps {
  employees: any[];
  capabilities: {
    canInvite: boolean;
  };
  actions: {
    inviteEmployee: (formData: FormData) => Promise<void>;
    updateEmployee?: (formData: FormData) => Promise<void>;
    deleteEmployee?: (formData: FormData) => Promise<void>;
  };
}

export function TeamTab({ employees, capabilities, actions }: TeamTabProps) {
  const { t } = useTranslation();
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredEmployees = employees.filter(e => 
    (e.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
    (e.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  async function onUpdate(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      if (!actions.updateEmployee) return;
      const formData = new FormData(e.currentTarget);
      try {
          await actions.updateEmployee(formData);
          setEditingEmployee(null);
          toast.success("Employee updated successfully");
      } catch (err) {
          toast.error("Failed to update employee");
      }
  }

  async function onDelete(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      if (!actions.deleteEmployee) return;
      const formData = new FormData(e.currentTarget);
      try {
          await actions.deleteEmployee(formData);
          setDeletingEmployee(null);
          toast.success("Employee deleted successfully");
      } catch (err) {
          toast.error("Failed to delete employee");
      }
  }
  
  return (
    <div className="space-y-8">
      {capabilities.canInvite && (
        <Card className="rounded-[3rem] border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden bg-white dark:bg-slate-950">
          <CardHeader className="bg-gradient-to-br from-blue-600 to-indigo-600 p-10 text-white">
            <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                    <UserPlus className="h-8 w-8 text-white" />
                </div>
                <div>
                    <CardTitle className="text-3xl font-black text-white">{t('inviteEmployeeTitle')}</CardTitle>
                    <CardDescription className="text-blue-100 text-lg font-medium mt-2">{t('inviteEmployeeDesc')}</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <form action={async (formData) => {
                try {
                    await actions.inviteEmployee(formData);
                    toast.success("Invitation sent");
                } catch(e) {
                    toast.error("Failed to send invitation");
                }
            }} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
              <div className="md:col-span-4 space-y-3">
                <label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    {t('name')}
                </label>
                <Input
                  name="name"
                  type="text"
                  placeholder={t('employeeNamePlaceholder')}
                  required
                  className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium px-6 text-lg"
                />
              </div>
              <div className="md:col-span-3 space-y-3">
                <label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    {t('emailAddress')}
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  required
                  className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium px-6 text-lg"
                />
              </div>
              <div className="md:col-span-3 space-y-3">
                 <label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Role
                </label>
                <Select name="role" defaultValue="employee">
                    <SelectTrigger className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium px-6 text-lg">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-[2rem] p-2">
                        <SelectItem value="employee" className="rounded-xl p-3 cursor-pointer">Employee</SelectItem>
                        <SelectItem value="manager" className="rounded-xl p-3 cursor-pointer">Manager</SelectItem>
                        <SelectItem value="admin" className="rounded-xl p-3 cursor-pointer">Admin</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="h-16 rounded-[2rem] w-full text-lg font-bold shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    {t('invite')}
                </Button>
              </div>
              <div className="md:col-span-12 space-y-3 pt-4">
                 <label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Password (Optional)
                </label>
                 <Input
                  name="password"
                  type="text"
                  placeholder="Set initial password..."
                  className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium px-6 text-lg"
                />
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-[3rem] border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden bg-white dark:bg-slate-950">
        <CardHeader className="p-10 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <CardTitle className="text-3xl font-black text-slate-900 dark:text-white">{t('teamMembers')}</CardTitle>
                    <CardDescription className="text-lg font-medium text-slate-500 mt-2">{t('manageTeamDesc')}</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <Input 
                        placeholder="Search team..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-14 rounded-[2rem] pl-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium text-base"
                    />
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredEmployees.map((employee) => (
              <div key={employee._id} className="flex items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-16 w-16 rounded-2xl ring-4 ring-white dark:ring-slate-950 shadow-lg group-hover:scale-105 transition-transform duration-300">
                        <AvatarFallback 
                        style={{ background: generateBlueGradient(employee.email) }}
                        className="text-white font-bold text-xl rounded-2xl"
                        >
                        {(employee.name?.[0] || employee.email?.[0] || "?").toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-white dark:border-slate-950 ${employee.status === 'active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                  </div>
                  <div>
                    <div className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{employee.name || t('accounts_unnamed')}</div>
                    <div className="text-base font-medium text-slate-500 flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4" />
                        {employee.email}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <Badge variant={employee.status === "active" ? "default" : "secondary"} className="h-10 rounded-xl px-4 text-sm font-bold capitalize">
                    {employee.status || t('active')}
                    </Badge>

                    {actions.updateEmployee && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-12 w-12 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
                                    <MoreHorizontal className="h-6 w-6 text-slate-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                                <DropdownMenuItem onClick={() => setEditingEmployee(employee)} className="rounded-xl py-3 px-3 font-medium cursor-pointer">
                                    <Pencil className="mr-2 h-4 w-4" /> Edit Details
                                </DropdownMenuItem>
                                {actions.deleteEmployee && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setDeletingEmployee(employee)} className="rounded-xl py-3 px-3 font-medium cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20">
                                            <Trash2 className="mr-2 h-4 w-4" /> Remove User
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
              </div>
            ))}
            {filteredEmployees.length === 0 && (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <div className="h-24 w-24 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mb-6">
                    <User className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('noTeamMembersFound')}</h3>
                <p className="text-slate-500 mt-2 max-w-sm">{t('noTeamMembersDesc')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
        <DialogContent className="rounded-[3rem] p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-950 sm:max-w-[600px]">
            <form onSubmit={onUpdate}>
                <input type="hidden" name="id" value={editingEmployee?._id || ""} />
                <div className="relative bg-slate-50 dark:bg-slate-900/50 px-10 py-10 border-b border-slate-100 dark:border-slate-800/50">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-slate-900 dark:text-slate-100">Edit Employee</DialogTitle>
                        <DialogDescription className="text-lg font-medium mt-2">
                            Update details for {editingEmployee?.name}
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="p-10 space-y-6">
                    <div className="space-y-3">
                        <label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">Name</label>
                        <Input 
                            name="name" 
                            defaultValue={editingEmployee?.name} 
                            className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium px-6 text-lg"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">Email</label>
                        <Input 
                            value={editingEmployee?.email} 
                            disabled 
                            className="h-16 rounded-[2rem] bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500 font-medium px-6 text-lg"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-3">
                            <label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">Role</label>
                            <Select name="role" defaultValue={editingEmployee?.role || "employee"}>
                                <SelectTrigger className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium px-6 text-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-[2rem] p-2">
                                    <SelectItem value="employee" className="rounded-xl p-3 cursor-pointer">Employee</SelectItem>
                                    <SelectItem value="manager" className="rounded-xl p-3 cursor-pointer">Manager</SelectItem>
                                    <SelectItem value="admin" className="rounded-xl p-3 cursor-pointer">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">Status</label>
                            <Select name="status" defaultValue={editingEmployee?.status || "active"}>
                                <SelectTrigger className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium px-6 text-lg">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-[2rem] p-2">
                                    <SelectItem value="active" className="rounded-xl p-3 cursor-pointer text-green-600 font-bold">Active</SelectItem>
                                    <SelectItem value="disabled" className="rounded-xl p-3 cursor-pointer text-slate-500">Disabled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <div className="space-y-3">
                        <div className="flex justify-between items-center pr-2">
                            <label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">New Password</label>
                            <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full">
                                Current password hidden
                            </span>
                        </div>
                        <Input 
                            name="password" 
                            type="text"
                            placeholder="Enter to reset (leave blank to keep current)" 
                            className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium px-6 text-lg"
                        />
                        <p className="text-sm text-slate-500 ml-2">Type a new password here to reset it for the user.</p>
                    </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 px-10 py-8 border-t border-slate-100 dark:border-slate-800/50 flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => setEditingEmployee(null)} className="h-14 px-8 rounded-[2rem] text-lg font-bold">Cancel</Button>
                    <Button type="submit" className="h-14 px-8 rounded-[2rem] text-lg font-bold shadow-xl shadow-blue-500/20">Save Changes</Button>
                </div>
            </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingEmployee} onOpenChange={(open) => !open && setDeletingEmployee(null)}>
        <DialogContent className="rounded-[3rem] p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-950 sm:max-w-[500px]">
            <form onSubmit={onDelete}>
                <input type="hidden" name="id" value={deletingEmployee?._id || ""} />
                <div className="p-10 flex flex-col items-center text-center">
                    <div className="h-24 w-24 bg-red-100 dark:bg-red-900/30 rounded-[2.5rem] flex items-center justify-center mb-6">
                        <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
                    </div>
                    <DialogTitle className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-4">Remove Employee?</DialogTitle>
                    <DialogDescription className="text-lg font-medium text-slate-500">
                        Are you sure you want to remove <span className="text-slate-900 dark:text-white font-bold">{deletingEmployee?.name}</span>? This action cannot be undone.
                    </DialogDescription>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 px-10 py-8 border-t border-slate-100 dark:border-slate-800/50 flex justify-end gap-4">
                    <Button type="button" variant="ghost" onClick={() => setDeletingEmployee(null)} className="h-14 px-8 rounded-[2rem] text-lg font-bold">Cancel</Button>
                    <Button type="submit" variant="destructive" className="h-14 px-8 rounded-[2rem] text-lg font-bold shadow-xl shadow-red-500/20">Yes, Remove</Button>
                </div>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
