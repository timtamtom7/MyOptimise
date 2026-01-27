"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { StrategyPresentation } from "./strategy-presentation";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface StrategyReviewSectionProps {
  strategies: any[];
}

export function StrategyReviewSection({ strategies }: StrategyReviewSectionProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);

  if (!strategies || strategies.length === 0) return null;

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-display font-medium text-slate-900 mb-6">Strategy Review</h2>
      <div className="grid gap-6">
        {strategies.map((campaign) => (
          <Card key={campaign._id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-0 flex flex-col md:flex-row">
              <div className="bg-slate-900 w-full md:w-1/3 min-h-[200px] flex items-center justify-center p-6 text-center">
                <div>
                    <p className="text-slate-400 text-sm mb-4">Strategy Presentation</p>
                    <Button 
                        variant="secondary" 
                        className="bg-white/10 text-white hover:bg-white/20 border-white/20"
                        onClick={() => setSelectedStrategy(campaign)}
                    >
                        <Play className="w-4 h-4 mr-2" /> Review Strategy
                    </Button>
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{campaign.title}</h3>
                <p className="text-slate-600 mb-4">
                    Your account manager has prepared a new social media strategy for your review. 
                    Please review the deck, competitor analysis, and moodboard.
                </p>
                <div className="flex gap-2">
                     <Button onClick={() => setSelectedStrategy(campaign)}>
                        Open Presentation
                     </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
