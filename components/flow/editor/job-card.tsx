"use client";

import React, { useState } from "react";
import { Brief } from "@/types/briefs";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, DollarSign, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { JobDetail } from "./job-detail";

interface JobCardProps {
  brief: Brief;
  status: "available" | "active" | "completed";
  onClaim?: (formData: FormData) => Promise<any>;
  onSubmit?: (formData: FormData) => Promise<any>;
  onStatusUpdate?: (formData: FormData) => Promise<any>;
}

export function JobCard({ brief, status, onClaim, onSubmit, onStatusUpdate }: JobCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card className="group hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300 border-border bg-card overflow-hidden flex flex-col h-full cursor-pointer shadow-sm" onClick={() => setIsOpen(true)}>
        <CardHeader className="p-6 pb-3 space-y-4">
          <div className="flex justify-between items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground p-0 border-none bg-transparent">
              {brief.metadata?.client || "Client"}
            </span>
            {brief.price && (
              <span className="text-sm font-sans font-medium text-foreground">
                ${brief.price}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-display text-2xl font-medium text-foreground leading-tight tracking-tight group-hover:underline underline-offset-4 decoration-slate-300 transition-all">
              {brief.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
              {brief.creative_goal || "No creative goal specified."}
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-0 flex-1">
          <div className="flex flex-wrap gap-4 mt-2">
            <div className="flex items-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Calendar className="w-3 h-3 mr-2 text-slate-400" />
              {brief.deadline ? new Date(brief.deadline).toLocaleDateString() : "No deadline"}
            </div>
            <div className="flex items-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              <Clock className="w-3 h-3 mr-2 text-slate-400" />
              {brief.format || "Format n/a"}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0 border-t border-slate-50 dark:border-slate-900/50 mt-auto pt-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-full flex items-center justify-between">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
              {status === "available"
                ? (brief.created_at ? "Posted " + formatDistanceToNow(new Date(brief.created_at), { addSuffix: true }) : "")
                : status === "active"
                  ? "Due " + (brief.deadline ? formatDistanceToNow(new Date(brief.deadline), { addSuffix: true }) : "soon")
                  : "Completed"}
            </span>
            <div className="flex items-center text-xs font-medium text-foreground">
              Open Deck <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </div>
          </div>
        </CardFooter>
      </Card>

      <JobDetail
        brief={brief}
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onClaim={onClaim}
        onUpload={onSubmit}
        onStatusChange={async (newStatus) => {
          if (onStatusUpdate) {
            const formData = new FormData();
            formData.append("id", brief.id);
            formData.append("status", newStatus);
            await onStatusUpdate(formData);
            setIsOpen(false);
          }
        }}
      />
    </>
  );
}
