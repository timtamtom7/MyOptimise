"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { generateBlueGradient } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface MessageThread {
  _id: string;
  title: string;
  updatedAt: string;
  lastMessage?: {
    message: string;
    createdAt: string;
    author?: { name: string };
  };
}

interface MessagesListProps {
  threads: MessageThread[];
}

export function MessagesList({ threads }: MessagesListProps) {
  const { t } = useTranslation();
  return (
    <Card>
       <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">{t('messages')}</CardTitle>
          <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">
             {threads.length}
          </span>
       </CardHeader>
       <CardContent className="p-0">
         <div className="divide-y">
            {threads.length === 0 && (
               <div className="p-4 text-center text-sm text-muted-foreground">{t('no_recent_messages')}</div>
            )}
            {threads.map(thread => (
               <div key={thread._id} className="p-4 flex gap-3 hover:bg-muted/40 transition-colors cursor-pointer">
                  <Avatar className="h-8 w-8">
                     <AvatarFallback 
                        style={{ background: generateBlueGradient(thread.lastMessage?.author?.name || thread.title) }}
                        className="text-xs text-white"
                     >
                        {thread.lastMessage?.author?.name?.charAt(0) || thread.title.charAt(0)}
                     </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                     <div className="flex items-center justify-between mb-0.5">
                        <div className="text-sm font-medium truncate">{thread.title}</div>
                        <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                           {new Date(thread.lastMessage?.createdAt || thread.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                     </div>
                     <div className="text-xs text-muted-foreground truncate">
                        {thread.lastMessage?.author?.name && <span className="font-medium text-foreground mr-1">{thread.lastMessage.author.name}:</span>}
                        {thread.lastMessage?.message || t('no_messages_yet')}
                     </div>
                  </div>
               </div>
            ))}
         </div>
       </CardContent>
    </Card>
  );
}
