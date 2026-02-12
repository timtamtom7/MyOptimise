"use client";

import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, HelpCircle, CalendarCheck, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EmployeeHeroProps {
  name: string;
  dueTodayCount: number;
}

export function EmployeeHero({ name, dueTodayCount }: EmployeeHeroProps) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const firstName = name.split(" ")[0];
  
  return (
    <Card className="mb-6 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-none shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarCheck className="h-4 w-4" />
              {today}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              <span className="font-bold">Good Morning,</span> <span className="font-light">{firstName}</span>
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <p>
                You have <span className="font-semibold text-foreground">{dueTodayCount} tasks</span> due today.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full h-9 bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-background/80">
              <RefreshCw className="mr-2 h-3.5 w-3.5" /> Refresh
            </Button>
            <Button variant="outline" size="sm" className="rounded-full h-9 bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-background/80">
              <HelpCircle className="mr-2 h-3.5 w-3.5" /> Help
            </Button>
            <Button size="sm" className="rounded-full h-9 shadow-md">
              <Plus className="mr-2 h-3.5 w-3.5" /> New Task
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
