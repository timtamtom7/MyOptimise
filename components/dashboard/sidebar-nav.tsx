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
  }[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
      {items.map((item, index) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon ? Icons[item.icon] : null;
        return (
          <Link
            key={index}
            href={item.href}
            className={cn(
              buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" }),
              isActive && "bg-secondary text-secondary-foreground font-medium",
              "justify-start hover:bg-secondary/50 transition-colors"
            )}
          >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
