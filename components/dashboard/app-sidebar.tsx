import { hasAccountCapability } from "@/lib/auth";
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
} from "lucide-react";

interface AppSidebarProps {
  account: any;
  className?: string;
}

export function AppSidebar({ account, className }: AppSidebarProps) {
  const type = String(account?.type || "");
  const navItems: { title: string; href: string; icon: any }[] = [];

  // Common Dashboard Home
  navItems.push({
    title: "Dashboard",
    href: `/dashboard/${type === "admin" ? "admin" : type === "manager" ? "manager" : type === "employee" ? "employee" : "client"}`,
    icon: "LayoutDashboard",
  });

  if (type === "employee" || type === "manager" || type === "admin") {
    if (hasAccountCapability(account, "tasks.read")) {
      navItems.push({ title: "Tasks", href: `/dashboard/${type}/tasks`, icon: "CheckSquare" }); // Assuming route exists or maps to anchor
    }
    if (hasAccountCapability(account, "calendar.read")) {
      navItems.push({ title: "Schedule", href: `/dashboard/calendar`, icon: "Calendar" });
    }
    if (hasAccountCapability(account, "message.read")) {
      navItems.push({ title: "Chats", href: `/dashboard/${type}/threads`, icon: "MessageSquare" });
    }
    if (type === "employee" || type === "manager" || type === "admin") {
       // "Clients" might be "Business" or "CRM"
       navItems.push({ title: "Clients", href: `/dashboard/business`, icon: "Users" });
    }
    if (type === "manager" || type === "admin") {
        navItems.push({ title: "Team", href: `/dashboard/manager`, icon: "Briefcase" });
    }
    if (hasAccountCapability(account, "documents.view.shared")) {
      navItems.push({ title: "Documents", href: `/dashboard/documents`, icon: "FileText" });
    }
    if (hasAccountCapability(account, "finance.view.all")) {
      navItems.push({ title: "Finance", href: `/dashboard/finance`, icon: "DollarSign" });
    }
  } else if (type === "client") {
    // Client specific items
    navItems.push({ title: "Overview", href: "/dashboard/client", icon: "LayoutDashboard" });
    // navItems.push({ title: "Calendar", href: "/dashboard/client/calendar", icon: "Calendar" }); // If exists
    if (hasAccountCapability(account, "client.services.view")) {
        // navItems.push({ title: "Services", href: "/dashboard/client/services", icon: "Briefcase" });
    }
  }

  // Common Settings
  navItems.push({ title: "Settings", href: "/dashboard/settings", icon: "Settings" });

  if (type === "admin" && hasAccountCapability(account, "security.audit.view")) {
     navItems.push({ title: "Audit Logs", href: "/dashboard/admin/audit", icon: "ShieldAlert" });
  }

  return (
    <div className={`w-64 border-r bg-card flex flex-col ${className}`}>
      <div className="p-6">
        <div className="flex items-center gap-3">
           <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
             {account.name?.charAt(0) || "O"}
           </div>
           <div className="font-semibold truncate max-w-[140px]">{account.name}</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <SidebarNav items={navItems} />
      </div>
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground px-2">
            {type.charAt(0).toUpperCase() + type.slice(1)} Workspace
        </div>
      </div>
    </div>
  );
}
