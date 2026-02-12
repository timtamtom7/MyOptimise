"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { generateBlueGradient } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { Plus, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { useRouter } from "next/navigation";

interface MessagesTabProps {
  threads: any[];
  employees: any[];
  basePath?: string;
  actions: {
    createOrOpenDmThread: (formData: FormData) => Promise<void>;
  };
}

export function MessagesTab({ threads, employees, basePath = "/dashboard/admin", actions }: MessagesTabProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t('messages')}</h2>
          <p className="text-muted-foreground">{t('messagesDesc')}</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="h-14 px-8 rounded-[2rem] font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all">
              <Plus className="mr-2 h-5 w-5" /> {t('newMessage')}
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[3rem] p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-950 max-w-lg">
             {/* Header with gradient */}
            <div className="relative bg-slate-50 dark:bg-slate-900/50 px-8 py-8 border-b border-slate-100 dark:border-slate-800/50">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('newMessage')}</DialogTitle>
                    <DialogDescription className="text-base font-medium mt-1">{t('newMessageDesc')}</DialogDescription>
                </DialogHeader>
            </div>
            <div className="p-8 pt-6">
                <form action={actions.createOrOpenDmThread} className="grid gap-6">
                <div className="grid gap-3">
                    <Label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">{t('recipient')}</Label>
                    <Select name="recipientId" required>
                    <SelectTrigger className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all px-6 font-medium text-lg">
                        <SelectValue placeholder={t('selectTeamMember')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-[2rem] p-3 shadow-2xl">
                        {employees.map((e) => (
                        <SelectItem key={e._id} value={e._id} className="rounded-2xl py-4 px-4 cursor-pointer text-base font-medium mb-1">
                            {e.name || e.email}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <Button type="submit" className="h-16 rounded-[2rem] w-full text-lg font-bold shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                    Start Chat
                </Button>
                </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {threads.map((thread) => (
          <Card key={thread._id} className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 cursor-pointer group bg-white dark:bg-slate-900" onClick={() => {
            // Navigate to thread
            router.push(`${basePath}/threads/${thread._id}`);
          }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-8 pt-8">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground group-hover:text-blue-600 transition-colors">
                {thread.type === 'dm' ? 'Direct Message' : 'Task Discussion'}
              </CardTitle>
              <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-all">
                  <MessageSquare className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="font-bold text-xl truncate mb-2 text-slate-900 dark:text-slate-100">{thread.title}</div>
              <div className="text-base text-muted-foreground truncate mb-6 font-medium bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-3">
                 {thread.lastMessage?.message || "No messages yet"}
              </div>
              <div className="flex items-center gap-2 pl-2">
                {thread.participants?.slice(0, 3).map((p: any) => (
                   <Avatar key={p._id} className="h-6 w-6">
                      <AvatarFallback 
                        style={{ background: generateBlueGradient(p.email || p.name) }}
                        className="text-[10px] text-white"
                      >
                        {p.name?.[0] || p.email?.[0]}
                      </AvatarFallback>
                   </Avatar>
                ))}
                {thread.participants?.length > 3 && (
                   <div className="text-xs text-muted-foreground">+{thread.participants.length - 3}</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {threads.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No active conversations.
          </div>
        )}
      </div>
    </div>
  );
}
