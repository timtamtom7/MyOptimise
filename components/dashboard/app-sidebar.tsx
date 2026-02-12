"use client";

import Link from "next/link";
import Image from "next/image";
import { SidebarNav, IconKey, NavGroup } from "./sidebar-nav";
import {
  Menu,
  ChevronsUpDown,
  BadgeCheck,
  Bell,
  CreditCard,
  LogOut,
  X,
  Settings,
  HelpCircle,
} from "lucide-react";

import { hasAccountCapability } from "@/lib/capabilities";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";

interface AppSidebarProps {
  account: any;
  className?: string;
}

export function AppSidebar({ account, className }: AppSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const type = String(account?.type || "").toLowerCase();
  
  const navGroups: NavGroup[] = [];

  // --- DASHBOARD (Main Group) ---
  navGroups.push({
    title: "", // No title means render items directly
    items: [{
        title: "Dashboard",
        href: `/dashboard/${type === "admin" ? "admin" : type === "manager" ? "manager" : type === "employee" ? "employee" : "client"}`,
        icon: "LayoutDashboard",
        exact: true,
    }]
  });

  if (type === "employee" || type === "manager" || type === "admin") {
    
    // --- MANAGEMENT ---
    const managementItems = [];
    if (hasAccountCapability(account, "tasks.read")) {
      const tasksHref = type === "manager" ? `/dashboard/manager/tasks` : `/dashboard/${type}/tasks`;
      managementItems.push({ title: "Tasks", href: tasksHref, icon: "CheckSquare" as IconKey, badge: "12+" });
    }
    if (type === "manager" || type === "admin") {
        managementItems.push({ title: "Briefs", href: `/dashboard/manager/briefs`, icon: "FileText" as IconKey });
    }
    if (type === "employee" || type === "manager") {
      managementItems.push({ title: "Clients", href: `/dashboard/business`, icon: "Briefcase" as IconKey });
    }
    if (type === "admin") {
      managementItems.push({ title: "Accounts", href: `/dashboard/admin/accounts`, icon: "Users" as IconKey });
    }
    if (type === "manager" || type === "admin") {
        managementItems.push({ title: "Team", href: "/dashboard/team", icon: "Users" as IconKey });
    }
    if (managementItems.length > 0) {
        navGroups.push({ title: "Management", items: managementItems });
    }

    // --- STRATEGY & CONTENT ---
    const strategyItems = [];
    if (type === "manager" || type === "admin") {
        strategyItems.push({ title: "Strategy", href: `/dashboard/manager/strategy`, icon: "Layers" as IconKey });
    }
    if (hasAccountCapability(account, "content.view_drafts")) {
      strategyItems.push({ title: "Content", href: `/dashboard/content`, icon: "PenTool" as IconKey });
    }
    if (hasAccountCapability(account, "documents.view.shared")) {
      strategyItems.push({ title: "Documents", href: `/dashboard/documents`, icon: "FileText" as IconKey });
    }
    if (strategyItems.length > 0) {
        navGroups.push({ title: "Strategy & Content", items: strategyItems });
    }

    // --- OPERATIONS ---
    const operationsItems = [];
    if (hasAccountCapability(account, "calendar.read")) {
      operationsItems.push({ title: "Schedule", href: `/dashboard/calendar`, icon: "Calendar" as IconKey });
    }
    if (hasAccountCapability(account, "message.read")) {
      const chatsHref = type === "employee" 
        ? `/dashboard/employee/messages` 
        : `/dashboard/${type}/threads`;
      operationsItems.push({ title: "Chats", href: chatsHref, icon: "MessageSquare" as IconKey });
    }
    if (hasAccountCapability(account, "sales.access")) {
      operationsItems.push({ title: "Sales", href: `/dashboard/sales`, icon: "TrendingUp" as IconKey });
    }
    if (hasAccountCapability(account, "finance.view.all")) {
      operationsItems.push({ title: "Finance", href: `/dashboard/finance`, icon: "DollarSign" as IconKey });
    }
    if (hasAccountCapability(account, "analytics.view.all")) {
        operationsItems.push({ title: "Analytics", href: `/dashboard/analytics`, icon: "BarChart3" as IconKey });
    }
    if (operationsItems.length > 0) {
        navGroups.push({ title: "Operations", items: operationsItems });
    }

    // --- SYSTEM ---
    const systemItems = [];
    systemItems.push({ title: "Help Center", href: "/dashboard/help", icon: "HelpCircle" as IconKey });

    if (type === "admin") {
        if (hasAccountCapability(account, "security.audit.view")) {
             systemItems.push({ title: "Audit Logs", href: "/dashboard/admin/audit", icon: "ShieldAlert" as IconKey });
        }
        systemItems.push({ title: "System Health", href: `/dashboard/admin/system`, icon: "Activity" as IconKey });
        systemItems.push({ title: "Permissions", href: "/dashboard/admin/permissions", icon: "ShieldAlert" as IconKey });
    }
    if (systemItems.length > 0) {
        navGroups.push({ title: "System", items: systemItems });
    }

  } else if (type === "client") {
    // --- CLIENT NAVIGATION ---
    const campaignItems = [];
    campaignItems.push({ title: "Results", href: "/dashboard/client/results", icon: "BarChart3" as IconKey });
    campaignItems.push({ title: "Calendar", href: "/dashboard/client/calendar", icon: "Calendar" as IconKey });
    campaignItems.push({ title: "Content", href: "/dashboard/client/content", icon: "Layers" as IconKey });
    campaignItems.push({ title: "Approvals", href: "/dashboard/client/approvals", icon: "CheckSquare" as IconKey });
    navGroups.push({ title: "Campaign", items: campaignItems });

    const servicesItems = [];
    servicesItems.push({ title: "Brand", href: "/dashboard/client/brand", icon: "Sparkles" as IconKey });
    servicesItems.push({ title: "Active Services", href: "/dashboard/client/services", icon: "ShoppingBag" as IconKey });
    servicesItems.push({ title: "Requests", href: "/dashboard/client/requests", icon: "Activity" as IconKey });
    navGroups.push({ title: "Services", items: servicesItems });

    const accountItems = [];
    accountItems.push({ title: "Chats", href: "/dashboard/client/threads", icon: "MessageSquare" as IconKey });
    accountItems.push({ title: "Billing", href: "/dashboard/client/billing", icon: "CreditCard" as IconKey });
    navGroups.push({ title: "Account", items: accountItems });

  } else if (type === "editor") {
    const myWorkItems = [];
    myWorkItems.push({ title: "My Tasks", href: "/dashboard/editor", icon: "CheckSquare" as IconKey });
    myWorkItems.push({ title: "Chats", href: "/dashboard/editor/messages", icon: "MessageSquare" as IconKey });
    navGroups.push({ title: "My Work", items: myWorkItems });
  }

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-white/10 bg-white/80 dark:bg-black/80 backdrop-blur-md z-[50] flex items-center px-4 gap-4 transition-all duration-300">
        <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(!isMobileOpen)} className="hover:bg-white/10">
          <Menu className="h-8 w-8 text-foreground" />
        </Button>
        <Image 
          src="https://cdn.sanity.io/images/n07npbm4/production/ff4686b2ed177cc41ab63faedf92835f22c35c4d-1844x340.png?w=400&fm=webp&fit=crop"
          alt="myOptimise"
          width={160}
          height={32}
          className="h-6 w-auto object-contain dark:brightness-0 dark:invert"
        />
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[44] md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

    <div className={cn(
        "flex flex-col transition-all duration-300 ease-in-out",
        // Base width
        "w-64",
        
        // Mobile: Fixed, Floating, Detached
        "fixed top-20 bottom-4 left-4 z-[45]", 
        "rounded-2xl border border-white/20 shadow-2xl",
        
        // Desktop: Relative, Floating look (override mobile fixed)
        "md:relative md:top-auto md:bottom-auto md:left-auto md:h-[calc(100vh-2rem)] md:z-10",
        "md:border md:border-white/20 md:dark:border-white/10",
        "md:shadow-2xl md:rounded-2xl md:my-4 md:ml-4",

        // Shared Background
        "bg-white/95 dark:bg-black/90 backdrop-blur-xl",
        
        // Visibility State
        isMobileOpen ? "translate-x-0" : "-translate-x-[150%] md:translate-x-0",
        
        className
    )}>
      
      {/* Mobile Sidebar Header (Logo + Close) */}
      <div className="md:hidden flex items-center justify-between px-6 py-5 border-b border-white/10">
        <Image 
          src="https://cdn.sanity.io/images/n07npbm4/production/ff4686b2ed177cc41ab63faedf92835f22c35c4d-1844x340.png?w=400&fm=webp&fit=crop"
          alt="myOptimise"
          width={120}
          height={28}
          className="h-5 w-auto object-contain dark:brightness-0 dark:invert"
        />
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMobileOpen(false)}
            className="h-8 w-8 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
        >
             <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Desktop Logo Area - HIDDEN per user request (double logo fix) */}
      <div className="hidden items-center px-6 py-6 pb-2">
        <Image 
          src="https://cdn.sanity.io/images/n07npbm4/production/ff4686b2ed177cc41ab63faedf92835f22c35c4d-1844x340.png?w=400&fm=webp&fit=crop"
          alt="myOptimise"
          width={150}
          height={32}
          className="h-8 w-auto object-contain dark:brightness-0 dark:invert"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 pb-24 min-h-0">
        <SidebarNav groups={navGroups} />
      </div>

      {/* Footer / Profile minimal */}
      <div className="p-4 border-t border-white/10 bg-transparent relative z-30">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start px-2 h-auto py-2 group relative overflow-hidden bg-gradient-to-r from-blue-500/5 to-sky-500/5 border border-white/10 hover:border-blue-500/30 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-sky-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative flex items-center w-full">
                <div className="relative">
                  <Avatar className="h-10 w-10 rounded-xl ring-2 ring-white/20 transition-all duration-300 group-hover:scale-105 group-hover:ring-blue-500/40 shadow-sm">
                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold text-xs">
                      {account.name?.charAt(0) || "O"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white dark:bg-black ring-2 ring-white dark:ring-black">
                    <span className="block h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                  </span>
                </div>
                
                <div className="grid flex-1 text-left text-sm leading-tight ml-3 z-10">
                  <span className="truncate font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{account.name}</span>
                  <span className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">{type}</span>
                </div>
                
                <ChevronsUpDown className="ml-auto size-4 text-slate-400 group-hover:text-blue-600 transition-colors z-10" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-80 rounded-[2rem] p-0 overflow-hidden shadow-2xl border border-white/20 bg-white/80 dark:bg-black/80 backdrop-blur-3xl ring-1 ring-black/5 dark:ring-white/10 mb-4 z-[9999] animate-in slide-in-from-bottom-5 zoom-in-95 duration-200"
            side="top"
            align="start"
            sideOffset={16}
          >
            <div className="p-6 pb-4 relative overflow-hidden">
                {/* Subtle blue glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex items-center gap-5 relative z-10">
                    <Avatar className="h-16 w-16 rounded-2xl ring-4 ring-white dark:ring-black/50 shadow-xl">
                        <AvatarFallback className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white font-bold text-2xl">
                        {account.name?.charAt(0) || "O"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-foreground truncate tracking-tight">{account.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider border border-blue-200 dark:border-blue-800/50">
                                {type}
                            </span>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800/50">
                                <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                <span className="text-[10px] font-bold text-green-700 dark:text-green-300 uppercase tracking-wider">Online</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-3 pb-2 space-y-1">
               <DropdownMenuItem asChild className="rounded-2xl py-3 px-3 cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 group transition-all duration-200 outline-none">
                  <Link href="/dashboard/settings" className="flex items-center gap-4 w-full">
                     <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                        <Settings className="h-5 w-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                     </div>
                     <div className="flex flex-col flex-1">
                        <span className="font-semibold text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Settings</span>
                        <span className="text-xs text-muted-foreground">Preferences & Security</span>
                     </div>
                  </Link>
               </DropdownMenuItem>

               <DropdownMenuItem asChild className="rounded-2xl py-3 px-3 cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 group transition-all duration-200 outline-none">
                  <Link href="/dashboard/billing" className="flex items-center gap-4 w-full">
                     <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                        <CreditCard className="h-5 w-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                     </div>
                     <div className="flex flex-col flex-1">
                        <span className="font-semibold text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Billing</span>
                        <span className="text-xs text-muted-foreground">Invoices & Plans</span>
                     </div>
                  </Link>
               </DropdownMenuItem>

               <DropdownMenuItem asChild className="rounded-2xl py-3 px-3 cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-900/20 group transition-all duration-200 outline-none">
                  <Link href="/dashboard/help" className="flex items-center gap-4 w-full">
                     <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                        <HelpCircle className="h-5 w-5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                     </div>
                     <div className="flex flex-col flex-1">
                        <span className="font-semibold text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Help Center</span>
                        <span className="text-xs text-muted-foreground">Support & Guides</span>
                     </div>
                  </Link>
               </DropdownMenuItem>
            </div>
               
            <div className="p-3 mt-1 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
               <DropdownMenuItem 
                  className="rounded-2xl py-3 px-3 cursor-pointer text-slate-500 hover:text-red-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group outline-none"
                  onClick={() => signOut()}
               >
                  <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800 group-hover:bg-red-100 dark:group-hover:bg-red-900/40 flex items-center justify-center mr-3 transition-colors">
                    <LogOut className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                  </div>
                  <span className="font-bold text-sm">Sign Out</span>
               </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    </>
  );
}
