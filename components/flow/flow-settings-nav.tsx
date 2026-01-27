"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, LayoutDashboard, User } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface FlowSettingsNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function FlowSettingsNav({ user }: FlowSettingsNavProps) {
  return (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-background/50 backdrop-blur-sm border border-border/40 hover:bg-background/80 shadow-sm transition-all duration-200"
          >
            <Settings className="h-5 w-5 text-muted-foreground/80" />
            <span className="sr-only">Settings</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
          <DropdownMenuLabel className="font-normal p-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-border/50">
                <AvatarImage src={user.image || ""} alt={user.name || ""} />
                <AvatarFallback>{user.name?.slice(0, 2).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-1 overflow-hidden">
                <p className="text-sm font-medium leading-none truncate">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Back to Dashboard</span>
                </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/dashboard/settings">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile Settings</span>
                </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => signOut({ callbackUrl: "/login" })} 
            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
