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
                ? "text-primary font-bold bg-primary/10" 
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              "justify-start transition-all duration-200 px-4 py-2 h-10 rounded-md relative group"
            )}
          >
            <>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
              {Icon && <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />}
              <span className={cn("text-sm", isActive ? "font-bold" : "font-normal")}>{item.title}</span>
              {item.badge && (
                <span className={cn("ml-auto text-[10px] px-1.5 py-0.5 rounded-md font-bold", isActive ? "bg-primary text-primary-foreground" : "bg-primary text-primary-foreground")}>
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
