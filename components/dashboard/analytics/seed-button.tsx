"use client";
import { seedAnalyticsData } from "@/app/actions/analytics";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SeedButton() {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="text-xs text-muted-foreground hover:text-primary"
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
