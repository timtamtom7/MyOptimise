"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Target, TrendingUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { urlFor } from "@/sanity/lib/image";

interface Competitor {
  _key: string;
  name?: string;
  url?: string;
  notes?: string;
  screenshot?: any;
  feed?: Array<{
    title?: string;
    url?: string;
    date?: string;
    source?: string;
  }>;
}

interface CompetitorAnalysisViewProps {
  competitors: Competitor[];
}

export function CompetitorAnalysisView({ competitors }: CompetitorAnalysisViewProps) {
  if (!competitors || competitors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-slate-700">
        <Target className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">No competitors analyzed</h3>
        <p className="text-slate-500 dark:text-slate-400">Add competitors to track their performance.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {competitors.map((competitor, i) => (
        <CompetitorCard key={competitor._key || i} competitor={competitor} />
      ))}
    </div>
  );
}

function CompetitorCard({ competitor }: { competitor: Competitor }) {
  const screenshotUrl = competitor.screenshot ? urlFor(competitor.screenshot).url() : null;

  return (
    <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden flex flex-col h-full bg-white dark:bg-slate-950">
      <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-900 overflow-hidden group">
        {screenshotUrl ? (
          <img 
            src={screenshotUrl} 
            alt={competitor.name || "Competitor"} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-300">
            <Search className="h-12 w-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-6 flex items-end">
          <div className="flex justify-between items-end w-full">
            <h3 className="text-2xl font-bold text-white shadow-sm">{competitor.name || "Competitor Name"}</h3>
            {competitor.url && (
              <Link 
                href={competitor.url} 
                target="_blank" 
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md p-2 rounded-full text-white transition-all"
              >
                <ExternalLink className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </div>
      
      <CardContent className="p-8 flex flex-col gap-6 grow">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <TrendingUp className="h-4 w-4" />
            Analysis
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
            {competitor.notes || "No analysis provided."}
          </p>
        </div>

        {competitor.feed && competitor.feed.length > 0 && (
          <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 uppercase tracking-wider opacity-70">Recent Activity</h4>
            <ul className="space-y-3">
              {competitor.feed.slice(0, 3).map((item, i) => (
                <li key={i} className="flex gap-3 items-start group">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                  <div className="flex flex-col gap-1">
                    <Link href={item.url || "#"} target="_blank" className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1">
                      {item.title || "Untitled Post"}
                    </Link>
                    <div className="flex gap-2 text-xs text-slate-400 font-medium uppercase tracking-wide">
                      <span>{item.source}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
