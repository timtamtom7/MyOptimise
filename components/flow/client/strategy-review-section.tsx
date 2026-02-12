"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { StrategyPresentation } from "./strategy-presentation";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface StrategyReviewSectionProps {
  campaigns: any[];
  deliverables?: any[];
}

export function StrategyReviewSection({ campaigns, deliverables }: StrategyReviewSectionProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);

  if (!campaigns || campaigns.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground opacity-50">
            <p>No active strategies to review.</p>
        </div>
      );
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <div key={campaign._id} className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/5 p-6 hover:bg-white/10 transition-colors">
            <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="h-16 w-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                    <Play className="h-6 w-6 ml-1" />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-medium text-foreground mb-1">{campaign.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 md:mb-0">
                        Strategic direction for {new Date(campaign.startDate).getFullYear()}.
                    </p>
                </div>

                <Button 
                    onClick={() => setSelectedStrategy(campaign)}
                    className="rounded-full bg-white/10 hover:bg-white/20 text-foreground border-white/10"
                >
                    Open Deck
                </Button>
            </div>
        </div>
      ))}

      <Dialog open={!!selectedStrategy} onOpenChange={(open) => !open && setSelectedStrategy(null)}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 border-0 bg-transparent shadow-none">
            {selectedStrategy && (
                <StrategyPresentation 
                    campaign={selectedStrategy} 
                    onClose={() => setSelectedStrategy(null)} 
                />
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
