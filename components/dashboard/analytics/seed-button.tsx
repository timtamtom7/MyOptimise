"use client";
import { seedAnalyticsData } from "@/app/actions/analytics";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SeedButton() {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-9 px-4 rounded-full text-xs font-bold text-muted-foreground hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
      onClick={async () => {
        toast.promise(seedAnalyticsData(), {
          loading: "Seeding data...",
          success: "Data seeded!",
          error: "Failed to seed data"
        });
      }}
    >
      Seed Demo Data
    </Button>
  );
}
