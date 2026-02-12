"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Instagram, Linkedin, Facebook, Youtube, Video, Image as ImageIcon, FileText, Smartphone, Layout } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProposedDeliverable {
  _key: string;
  title?: string;
  type?: "reel" | "story" | "carousel" | "static_post" | "video_long" | "other";
  platform?: "instagram" | "tiktok" | "linkedin" | "youtube" | "facebook" | "twitter" | "other";
  description?: string;
  visualDirection?: string;
  prediction?: {
    score?: number;
    advice?: string[];
  };
}

interface ProposedDeliverablesViewProps {
  deliverables: ProposedDeliverable[];
}

export function ProposedDeliverablesView({ deliverables }: ProposedDeliverablesViewProps) {
  if (!deliverables || deliverables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-slate-700">
        <Layout className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">No deliverables proposed</h3>
        <p className="text-slate-500 dark:text-slate-400">Add deliverables to the strategy.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {deliverables.map((item, i) => (
        <DeliverableCard key={item._key || i} deliverable={item} />
      ))}
    </div>
  );
}

function DeliverableCard({ deliverable }: { deliverable: ProposedDeliverable }) {
  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case "instagram": return <Instagram className="h-4 w-4" />;
      case "linkedin": return <Linkedin className="h-4 w-4" />;
      case "facebook": return <Facebook className="h-4 w-4" />;
      case "youtube": return <Youtube className="h-4 w-4" />;
      case "tiktok": return <Smartphone className="h-4 w-4" />;
      default: return <Layout className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case "reel": return <Video className="h-4 w-4" />;
      case "story": return <Smartphone className="h-4 w-4" />;
      case "carousel": return <ImageIcon className="h-4 w-4" />;
      case "static_post": return <FileText className="h-4 w-4" />;
      case "video_long": return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    if (score >= 90) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    if (score >= 70) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    if (score >= 50) return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  };

  return (
    <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
      <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 p-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex gap-2 mb-2">
            <Badge variant="secondary" className="rounded-lg h-7 px-3 flex gap-1 items-center bg-white dark:bg-slate-800 shadow-sm border">
              {getPlatformIcon(deliverable.platform)}
              <span className="capitalize">{deliverable.platform || "Platform"}</span>
            </Badge>
            <Badge variant="secondary" className="rounded-lg h-7 px-3 flex gap-1 items-center bg-white dark:bg-slate-800 shadow-sm border">
              {getTypeIcon(deliverable.type)}
              <span className="capitalize">{deliverable.type?.replace('_', ' ') || "Format"}</span>
            </Badge>
          </div>
          {deliverable.prediction?.score && (
            <div className={cn("flex flex-col items-center justify-center h-12 w-12 rounded-full font-bold text-sm shadow-inner", getScoreColor(deliverable.prediction.score))}>
              {deliverable.prediction.score}
            </div>
          )}
        </div>
        <CardTitle className="text-xl font-bold leading-tight mt-2">{deliverable.title || "Untitled Deliverable"}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 flex flex-col gap-6 grow">
        {deliverable.description && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider opacity-70">Concept</h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm">
              {deliverable.description}
            </p>
          </div>
        )}
        
        {deliverable.visualDirection && (
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider opacity-70">Visual Direction</h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm italic border-l-2 border-blue-500/30 pl-3">
              {deliverable.visualDirection}
            </p>
          </div>
        )}

        {deliverable.prediction?.advice && deliverable.prediction.advice.length > 0 && (
           <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
             <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">AI Recommendations</h4>
             <ul className="space-y-1">
               {deliverable.prediction.advice.map((tip, i) => (
                 <li key={i} className="text-xs text-slate-500 dark:text-slate-400 flex gap-2 items-start">
                   <span className="text-blue-500">•</span> {tip}
                 </li>
               ))}
             </ul>
           </div>
        )}
      </CardContent>
    </Card>
  );
}
