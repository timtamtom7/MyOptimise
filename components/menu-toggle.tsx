"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <select
      aria-label="Theme"
      value={theme || "system"}
      onChange={(e) => setTheme(e.target.value)}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "h-9 w-[110px] border-0 bg-transparent shadow-none hover:bg-muted/40"
      )}
    >
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  );
}
