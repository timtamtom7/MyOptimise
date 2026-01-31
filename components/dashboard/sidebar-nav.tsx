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
} from "lucide-react";

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
};

interface SidebarNavProps {
  items: {
    title: string;
    href: string;
    icon?: keyof typeof Icons;
    variant?: "default" | "ghost";
    exact?: boolean;
    badge?: string;
  }[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
      {items.map((item, index) => {
        const isActive = item.exact 
          ? pathname === item.href
          : pathname === item.href || pathname?.startsWith(`${item.href}/`);
          
        const Icon = item.icon ? Icons[item.icon] : null;
        return (
          <Link
            key={index}
            href={item.href}
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              isActive 
                ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20" 
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200",
              "justify-start transition-all duration-200 px-4 py-2 h-10 rounded-md relative group"
            )}
          >
            <>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 dark:bg-blue-400 rounded-r-full" />
              )}
              {Icon && <Icon className={cn("mr-3 h-5 w-5 group-[[data-collapsed=true]]:mr-0", isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />}
              <span className={cn("text-sm group-[[data-collapsed=true]]:hidden", isActive ? "font-bold" : "font-medium")}>{item.title}</span>
              {item.badge && (
                <span className={cn("ml-auto text-[10px] px-1.5 py-0.5 rounded-md font-bold group-[[data-collapsed=true]]:hidden", isActive ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400")}>
                  {item.badge}
                </span>
              )}
            </>
          </Link>
        );
      })}
    </nav>
  );
}
