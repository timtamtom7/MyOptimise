"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Zap, 
  UserPlus, 
  FileText, 
  Shield, 
  Settings, 
  LogOut, 
  Search,
  Users,
  CreditCard,
  MessageSquare,
  ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface QuickActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userType?: "admin" | "manager" | "client" | "employee";
}

interface ActionItem {
  icon: any;
  label: string;
  action: () => void;
  group: string;
}

export function QuickActionDialog({ open, onOpenChange, userType = "admin" }: QuickActionDialogProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  const getActions = (): ActionItem[] => {
    const actions: ActionItem[] = [];

    // Common
    actions.push({
      icon: MessageSquare,
      label: "Send Message",
      action: () => router.push("/dashboard/messages/new"),
      group: "Communication"
    });

    if (userType === "admin") {
      actions.push({
        icon: UserPlus,
        label: "Create New User",
        action: () => router.push("/dashboard/admin/users/new"),
        group: "Admin"
      });
      actions.push({
        icon: Shield,
        label: "System Health Check",
        action: () => router.push("/dashboard/admin/system"),
        group: "Admin"
      });
      actions.push({
        icon: Shield,
        label: "Audit Logs",
        action: () => router.push("/dashboard/admin/audit"),
        group: "Admin"
      });
    }

    if (userType === "manager" || userType === "admin") {
      actions.push({
        icon: FileText,
        label: "Create New Task",
        action: () => router.push("/dashboard/manager/tasks/new"),
        group: "Management"
      });
      actions.push({
        icon: Users,
        label: "View Team",
        action: () => router.push("/dashboard/manager/team"),
        group: "Management"
      });
    }

    if (userType === "client") {
      actions.push({
        icon: FileText,
        label: "New Service Request",
        action: () => router.push("/dashboard/client/requests/new"),
        group: "Services"
      });
      actions.push({
        icon: CreditCard,
        label: "Billing & Invoices",
        action: () => router.push("/dashboard/client/billing"),
        group: "Billing"
      });
    }

    // Navigation
    actions.push({
      icon: Settings,
      label: "Profile Settings",
      action: () => router.push("/dashboard/profile"),
      group: "General"
    });

    return actions;
  };

  const allActions = getActions();
  const filteredActions = allActions.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden shadow-2xl bg-white/90 dark:bg-black/90 backdrop-blur-xl border-white/20 gap-0 max-w-xl">
        <DialogHeader className="sr-only">
            <DialogTitle>Quick Actions</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center px-4 py-4 border-b border-white/10">
            <Search className="w-5 h-5 text-muted-foreground mr-3" />
            <input 
                className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-muted-foreground/50"
                placeholder="What would you like to do?"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
            />
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
            {filteredActions.length > 0 ? (
                <div className="space-y-1">
                    {filteredActions.map((item, i) => (
                        <button
                            key={i}
                            onClick={() => runCommand(item.action)}
                            className="w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 transition-colors group text-left"
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 transition-colors" />
                                <span className="font-medium">{item.label}</span>
                            </div>
                            <span className="text-xs text-muted-foreground/50 uppercase tracking-wider group-hover:text-blue-500/50">{item.group}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="py-8 text-center text-muted-foreground">
                    No actions found.
                </div>
            )}
        </div>
        
        <div className="px-4 py-2 bg-muted/20 border-t border-white/5 text-xs text-muted-foreground flex justify-between">
            <span>Protip: Type to search actions</span>
            <span>ESC to close</span>
        </div>

      </DialogContent>
    </Dialog>
  );
}
