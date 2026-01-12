"use client";

import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { toggleMessageReaction } from "@/app/actions/messages";
import { useFormStatus } from "react-dom";

function ReactionButton({ 
  threadId, 
  messageKey, 
  emoji, 
  canReact, 
  disabled 
}: { 
  threadId: string; 
  messageKey: string; 
  emoji: string; 
  canReact: boolean;
  disabled: boolean;
}) {
  return (
    <button 
      className="rounded-md border px-2 py-1 text-xs hover:bg-muted transition-colors" 
      name="emoji" 
      value={emoji} 
      disabled={!canReact || disabled}
    >
      {emoji}
    </button>
  );
}

export function MessageList({ 
  messages, 
  threadId, 
  currentUserId, 
  canReact, 
  canWrite 
}: { 
  messages: any[]; 
  threadId: string; 
  currentUserId: string;
  canReact: boolean;
  canWrite: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom whenever messages change
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Also scroll on mount (instant)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "auto" });
  }, []);

  if (messages.length === 0) {
    return <div className="text-sm text-muted-foreground">No messages yet.</div>;
  }

  return (
    <div className="space-y-4" ref={scrollRef}>
      {messages.map((m: any, idx: number) => {
        const isPending = m.status === 'pending_approval';
        const isRejected = m.status === 'rejected';
        
        return (
          <div 
            key={m._key || idx} 
            className={`rounded-lg border p-4 ${
              isPending ? "bg-yellow-50/50 border-yellow-200" : 
              isRejected ? "bg-red-50/50 border-red-200" : ""
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs text-muted-foreground">
                {String(m?.author?.name || m?.author?.email || "Unknown")}
                {m?.createdAt ? ` • ${new Date(m.createdAt).toLocaleString()}` : ""}
              </div>
              {isPending && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending Approval</Badge>
              )}
              {isRejected && (
                <Badge variant="destructive">Rejected</Badge>
              )}
            </div>
            
            {m?.message ? <div className="mt-2 whitespace-pre-wrap text-sm">{String(m.message)}</div> : null}
            
            {Array.isArray(m?.reactions) && m.reactions.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(
                  (m.reactions as any[]).reduce<Record<string, number>>((acc, r) => {
                    const e = String((r as any)?.emoji || "");
                    if (!e) return acc;
                    acc[e] = (acc[e] || 0) + 1;
                    return acc;
                  }, {}),
                ).map(([emoji, count]) => (
                  <div key={emoji} className="rounded-full border px-2 py-0.5 text-xs bg-muted/50">
                    {emoji} {count}
                  </div>
                ))}
              </div>
            ) : null}

            {canReact ? (
              <form action={toggleMessageReaction} className="mt-3 flex flex-wrap gap-2 opacity-50 hover:opacity-100 transition-opacity">
                <input type="hidden" name="threadId" value={String(threadId)} />
                <input type="hidden" name="messageKey" value={String(m?._key || "")} />
                {["👍", "✅", "❤️", "🎉", "😂"].map((emoji) => (
                  <ReactionButton
                    key={emoji}
                    threadId={threadId}
                    messageKey={String(m?._key || "")}
                    emoji={emoji}
                    canReact={canReact}
                    disabled={!canWrite || !m?._key}
                  />
                ))}
              </form>
            ) : null}

            {Array.isArray(m?.attachments) && m.attachments.length ? (
              <div className="mt-2 space-y-1">
                {m.attachments.map((a: any, aIdx: number) => (
                  <div key={aIdx} className="text-sm">
                    <a className="underline text-blue-600 hover:text-blue-800" href={String(a.asset?.url || "#")} target="_blank" rel="noreferrer">
                      {String(a.asset?.originalFilename || "Attachment")}
                    </a>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
