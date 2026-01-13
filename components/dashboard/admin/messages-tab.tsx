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
          <h2 className="text-2xl font-bold tracking-tight">{t('messages')}</h2>
          <p className="text-muted-foreground">{t('messagesDesc')}</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> {t('newMessage')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('newMessage')}</DialogTitle>
              <DialogDescription>{t('newMessageDesc')}</DialogDescription>
            </DialogHeader>
            <form action={actions.createOrOpenDmThread} className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t('recipient')}</Label>
                <Select name="recipientId" required>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectTeamMember')} />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e._id} value={e._id}>
                        {e.name || e.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit">Start Chat</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {threads.map((thread) => (
          <Card key={thread._id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => {
            // Navigate to thread
            router.push(`${basePath}/threads/${thread._id}`);
          }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {thread.type === 'dm' ? 'Direct Message' : 'Task Discussion'}
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold truncate mb-1">{thread.title}</div>
              <div className="text-xs text-muted-foreground truncate mb-4">
                 {thread.lastMessage?.message || "No messages yet"}
              </div>
              <div className="flex items-center gap-2">
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
