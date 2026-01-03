"use client";

import { Bell, Settings, Search, Command } from "lucide-react";

interface EmployeeHeaderProps {
  user: {
    name: string;
    email: string;
  };
}

export function EmployeeHeader({ user }: EmployeeHeaderProps) {
  return (
    <div className="rounded-2xl bg-card border border-input px-4 py-3 flex items-center justify-between mb-6">
      <div className="flex items-center gap-3 w-full max-w-xl">
        <div className="relative flex-1">
          <input
            className="w-full h-10 pl-10 pr-16 rounded-full border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Search & Command"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded border border-input bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="h-9 w-9 rounded-full border border-input flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
          <Bell className="h-4 w-4" />
        </button>
        <button className="h-9 w-9 rounded-full border border-input flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
          <Settings className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 rounded-full border border-input pl-1 pr-3 py-1 bg-background">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-xs font-medium truncate max-w-[100px]">{user.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
