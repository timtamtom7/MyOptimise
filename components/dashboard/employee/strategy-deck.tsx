"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Target, Users, Lightbulb, Palette, Layout, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface StrategyDeckProps {
  client: any;
  activeCampaigns: any[];
}

export function StrategyDeck({ client, activeCampaigns }: StrategyDeckProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Define slides based on available data
  const slides = [
    {
      id: "goals",
      title: "Strategic Goals",
      icon: Target,
      content: (
        <div className="space-y-6">
          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-xl font-semibold mb-4">Primary Objectives</h3>
            <p className="text-lg text-muted-foreground whitespace-pre-wrap">
              {client.creativeGoal || "No specific creative goals defined yet."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Service Scope</h4>
              <p className="text-sm text-muted-foreground">{client.serviceScope || "Not defined"}</p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Industry</h4>
              <p className="text-sm text-muted-foreground">{client.industry || "Not defined"}</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "audience",
      title: "Target Audience",
      icon: Users,
      content: (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Audience Segments
            </h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {client.audienceSegments || "No audience segments defined."}
            </p>
          </div>
          <div className="grid gap-4">
            <h4 className="font-medium">Key Pain Points</h4>
            <div className="bg-muted p-4 rounded-lg">
               {/* Fallback if no specific field */}
               <p className="text-muted-foreground">
                 Targeting {client.industry || "customers"} looking for {client.serviceScope || "solutions"}.
               </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: "pillars",
      title: "Content Pillars",
      icon: Layout,
      content: (
        <div className="space-y-6">
           <div className="grid md:grid-cols-2 gap-4">
             {client.contentPillars ? (
               client.contentPillars.split('\n').map((pillar: string, i: number) => (
                 <div key={i} className="bg-card border p-4 rounded-lg shadow-sm">
                   <div className="flex items-center gap-3 mb-2">
                     <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                       {i + 1}
                     </div>
                     <h4 className="font-medium">{pillar}</h4>
                   </div>
                 </div>
               ))
             ) : (
               <div className="col-span-2 text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border-dashed border-2">
                 No content pillars defined.
               </div>
             )}
           </div>
        </div>
      )
    },
    {
      id: "visuals",
      title: "Visual Direction",
      icon: Palette,
      content: (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 p-6 rounded-xl border">
            <h3 className="text-lg font-semibold mb-4">Brand Guidelines</h3>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {client.brandGuidelines || client.visualDirection || "No specific visual direction provided."}
            </p>
          </div>
          {client.website && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Website:</span>
              <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {client.website}
              </a>
            </div>
          )}
        </div>
      )
    },
    {
      id: "campaigns",
      title: "Active Campaigns",
      icon: Lightbulb,
      content: (
        <div className="space-y-4">
          {activeCampaigns.length > 0 ? (
            <div className="grid gap-4">
              {activeCampaigns.map((campaign) => (
                <Link href={`/dashboard/employee/campaigns/${campaign._id}`} key={campaign._id} className="block group">
                  <div className="p-4 border rounded-lg bg-card group-hover:shadow-md transition-shadow group-hover:border-primary/50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        {campaign.title}
                        <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                      </h4>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Start: {new Date(campaign.startDate).toLocaleDateString()}</span>
                      {campaign.endDate && <span>End: {new Date(campaign.endDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No active campaigns at the moment.
            </div>
          )}
        </div>
      )
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const CurrentIcon = slides[currentSlide].icon;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="min-h-[500px] flex flex-col shadow-lg border-2">
        <CardContent className="flex-1 p-0 flex flex-col">
          {/* Deck Header */}
          <div className="bg-muted/30 p-6 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                <CurrentIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{slides[currentSlide].title}</h2>
                <p className="text-sm text-muted-foreground">
                  Strategy Deck • Slide {currentSlide + 1} of {slides.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevSlide}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextSlide}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Deck Content */}
          <div className="flex-1 p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {slides[currentSlide].content}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Deck Footer / Navigation Dots */}
          <div className="p-4 border-t bg-muted/10 flex justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
