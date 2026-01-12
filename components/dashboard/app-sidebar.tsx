import { hasAccountCapability } from "@/lib/capabilities";
import { SidebarNav } from "./sidebar-nav";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  MessageSquare,
  Users,
  FileText,
  DollarSign,
  Settings,
  CreditCard,
  BarChart3,
  ShieldAlert,
  Briefcase,
  HelpCircle,
  LogOut,
  PenTool,
  TrendingUp,
} from "lucide-react";

interface AppSidebarProps {
  account: any;
  className?: string;
}

export function AppSidebar({ account, className }: AppSidebarProps) {
  const type = String(account?.type || "").toLowerCase();
  const menuItems: { title: string; href: string; icon: any; exact?: boolean; badge?: string }[] = [];
  const generalItems: { title: string; href: string; icon: any; exact?: boolean; badge?: string }[] = [];

  // --- MENU SECTION ---
  
  // Dashboard
  menuItems.push({
    title: "Dashboard",
    href: `/dashboard/${type === "admin" ? "admin" : type === "manager" ? "manager" : type === "employee" ? "employee" : "client"}`,
    icon: "LayoutDashboard",
    exact: true,
  });

  if (type === "employee" || type === "manager" || type === "admin") {
    if (hasAccountCapability(account, "tasks.read")) {
      const tasksHref = type === "manager" ? `/dashboard/manager` : `/dashboard/${type}/tasks`;
      // TODO: Fetch real task count
      menuItems.push({ title: "Tasks", href: tasksHref, icon: "CheckSquare", badge: "12+" });
    }
    if (hasAccountCapability(account, "calendar.read")) {
      menuItems.push({ title: "Schedule", href: `/dashboard/calendar`, icon: "Calendar" });
    }
    if (hasAccountCapability(account, "message.read")) {
      const chatsHref = type === "employee" 
        ? `/dashboard/employee/messages` 
        : `/dashboard/${type}/threads`;
      menuItems.push({ title: "Chats", href: chatsHref, icon: "MessageSquare" });
    }
    if (type === "employee" || type === "manager" || type === "admin") {
     menuItems.push({ title: "Clients", href: `/dashboard/business`, icon: "Users" });
    }
    if (type === "manager" || type === "admin") {
        menuItems.push({ title: "Team", href: `/dashboard/team`, icon: "Briefcase" });
    }
    if (hasAccountCapability(account, "documents.view.shared")) {
      menuItems.push({ title: "Documents", href: `/dashboard/documents`, icon: "FileText" });
    }
    if (hasAccountCapability(account, "content.view_drafts")) {
      menuItems.push({ title: "Content", href: `/dashboard/content`, icon: "PenTool" });
    }
    if (hasAccountCapability(account, "sales.access")) {
      menuItems.push({ title: "Sales", href: `/dashboard/sales`, icon: "TrendingUp" });
    }
    if (hasAccountCapability(account, "finance.view.all")) {
      menuItems.push({ title: "Finance", href: `/dashboard/finance`, icon: "DollarSign" });
    }
    if (hasAccountCapability(account, "analytics.view.all")) {
        menuItems.push({ title: "Analytics", href: `/dashboard/analytics`, icon: "BarChart3" });
    }
  } else if (type === "client") {
    menuItems.push({ title: "Overview", href: "/dashboard/client", icon: "LayoutDashboard" });
    menuItems.push({ title: "Chats", href: "/dashboard/client/threads", icon: "MessageSquare" });
    menuItems.push({ title: "Approvals", href: "/dashboard/client?tab=approvals", icon: "CheckSquare" });
  }

  // --- GENERAL SECTION ---
  generalItems.push({ title: "Settings", href: "/dashboard/settings", icon: "Settings" });
  
  generalItems.push({ title: "Help", href: "/dashboard/help", icon: "HelpCircle" }); 

  if (type === "admin" && hasAccountCapability(account, "security.audit.view")) {
     generalItems.push({ title: "Audit Logs", href: "/dashboard/admin/audit", icon: "ShieldAlert" });
  }

  if (type === "admin") {
    generalItems.push({ title: "Permissions", href: "/dashboard/admin/permissions", icon: "ShieldAlert" });
  }
  
  generalItems.push({ title: "Logout", href: "/logout", icon: "LogOut" });


  return (
    <div className={`w-64 border-r border-border bg-background flex flex-col h-screen sticky top-0 ${className}`}>
      
      {/* Spacer / Logo Area */}
      <div className="p-6 pb-2">
         {/* Minimal spacer as requested */}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        
        {/* MENU Group */}
        <div>
            <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Menu
            </h3>
            <SidebarNav items={menuItems} />
        </div>

        {/* GENERAL Group */}
        <div>
            <h3 className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                General
            </h3>
            <SidebarNav items={generalItems} />
        </div>

      </div>

      {/* Footer / Profile minimal */}
      <div className="p-4 border-t border-border bg-muted/10">
         <div className="flex items-center gap-3 px-2">
           <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0 text-xs">
             {account.name?.charAt(0) || "O"}
           </div>
           <div className="flex flex-col overflow-hidden min-w-0">
             <div className="font-medium truncate text-sm">{account.name}</div>
             <div className="text-[10px] text-muted-foreground truncate capitalize">{type}</div>
           </div>
        </div>
      </div>
    </div>
  );
}
