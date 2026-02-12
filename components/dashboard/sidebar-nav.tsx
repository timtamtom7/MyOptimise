"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  MessageSquare,
  Users,
  FileText,
  DollarSign,
  Settings,
  HelpCircle,
  LogOut,
  Briefcase,
  Bell,
  Search,
  Command,
  CreditCard,
  BarChart3,
  ShieldAlert,
  Layers,
  PenTool,
  TrendingUp,
  Sparkles,
  ShoppingBag,
  Activity,
  BadgeCheck,
  ChevronsUpDown,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Icons = {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  MessageSquare,
  Users,
  FileText,
  DollarSign,
  Settings,
  HelpCircle,
  LogOut,
  Briefcase,
  Bell,
  Search,
  Command,
  CreditCard,
  BarChart3,
  ShieldAlert,
  Layers,
  PenTool,
  TrendingUp,
  Sparkles,
  ShoppingBag,
  Activity,
  BadgeCheck,
  ChevronsUpDown,
};

export type IconKey = keyof typeof Icons;

export interface NavItem {
  title: string;
  href: string;
  icon?: IconKey;
  variant?: "default" | "ghost";
  exact?: boolean;
  badge?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SidebarNavProps {
  items?: NavItem[]; // Legacy flat list support (optional)
  groups?: NavGroup[]; // New grouped structure
}

export function SidebarNav({ items, groups }: SidebarNavProps) {
  const pathname = usePathname();

  // Helper to render a single item
  const renderItem = (item: NavItem) => {
    const isActive = item.exact 
      ? pathname === item.href
      : pathname === item.href || pathname?.startsWith(`${item.href}/`);
      
    const Icon = item.icon ? Icons[item.icon] : null;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          buttonVariants({ variant: "ghost", size: "lg" }),
          isActive 
            ? "text-blue-700 dark:text-blue-400 font-bold bg-blue-500/10 dark:bg-blue-400/10" 
            : "text-slate-900 dark:text-slate-100 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 hover:text-blue-600 dark:hover:text-blue-400",
          "justify-start transition-all duration-200 px-4 py-2 h-10 rounded-md relative group w-full mb-1"
        )}
      >
        <>
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
          )}
          {Icon && <Icon className={cn("mr-3 h-5 w-5 group-[[data-collapsed=true]]:mr-0", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400")} />}
          <span className={cn("text-sm group-[[data-collapsed=true]]:hidden", isActive ? "font-bold" : "font-medium")}>{item.title}</span>
          {item.badge && (
            <span className={cn("ml-auto text-[10px] px-1.5 py-0.5 rounded-md font-bold group-[[data-collapsed=true]]:hidden", isActive ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400")}>
              {item.badge}
            </span>
          )}
        </>
      </Link>
    );
  };

  if (groups) {
    return (
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center">
         <Accordion type="multiple" defaultValue={groups.map(g => g.title)} className="w-full">
            {groups.map((group, index) => (
               <AccordionItem key={index} value={group.title} className="border-b-0 mb-2">
                 {/* Only show trigger/accordion logic if it's NOT the first "Dashboard" group (which usually has no title or we handle differently) */}
                 {/* Actually, let's treat groups with title as collapsible. If title is empty, render items directly. */}
                 
                 {group.title ? (
                   <>
                     <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-md text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400/80 mb-1">
                        {group.title}
                     </AccordionTrigger>
                     <AccordionContent className="pb-0 pt-1">
                        <div className="pl-0 space-y-1">
                          {group.items.map(renderItem)}
                        </div>
                     </AccordionContent>
                   </>
                 ) : (
                    <div className="space-y-1 mb-4">
                       {group.items.map(renderItem)}
                    </div>
                 )}
               </AccordionItem>
            ))}
         </Accordion>
      </nav>
    );
  }

  // Fallback for legacy flat list (if any remain)
  return (
    <nav className="grid gap-1 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
      {items?.map((item, index) => {
        // ... legacy implementation ...
        if (item.href) return renderItem(item as NavItem);
        return null;
      })}
    </nav>
  );
}
