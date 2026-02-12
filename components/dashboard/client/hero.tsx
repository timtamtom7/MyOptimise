"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ClientHeroProps {
  user: {
    name: string;
    email: string;
    id?: string;
    timezone?: string;
    avatar?: string;
  };
  account?: any;
}

export function ClientHero({
  user,
  account,
}: ClientHeroProps) {
  const packageName = account?.serviceScope?.split("-")[0] || "Growth Tier";
  
  // Use user.name instead of userName props
  const userName = user.name;
  
  // These were props before, but now we'll derive them or remove them if not needed by the new design
  // The new design seems to use this component mainly for the welcome message + package info

  return (
    <Card className="overflow-hidden mb-8 border-none shadow-sm bg-card/50 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="p-8 relative overflow-hidden">
          {/* Abstract background shape if desired */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-normal tracking-tight">
                    Good to see you, {userName}.
                  </h1>
                  {account && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                      {packageName}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-2 font-light">
                   Your dashboard is ready.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
