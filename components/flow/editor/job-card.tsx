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
      <Card className="group hover:shadow-md transition-all duration-200 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden flex flex-col h-full cursor-pointer" onClick={() => setIsOpen(true)}>
        <CardHeader className="p-5 pb-3 space-y-3">
          <div className="flex justify-between items-start gap-2">
            <Badge variant="outline" className="font-normal text-xs uppercase tracking-wider text-slate-500 border-slate-200 dark:border-slate-800">
              {brief.metadata?.client || "Client"}
            </Badge>
            {brief.price && (
              <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                ${brief.price}
              </Badge>
            )}
          </div>
          <div>
            <h3 className="font-display text-xl font-medium text-slate-900 dark:text-slate-50 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {brief.title}
            </h3>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
              {brief.creative_goal || "No creative goal specified."}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="p-5 pt-0 flex-1">
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="flex items-center text-xs text-slate-500">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              {brief.deadline ? new Date(brief.deadline).toLocaleDateString() : "No deadline"}
            </div>
            <div className="flex items-center text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              {brief.format || "Format n/a"}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-5 pt-0 border-t border-slate-50 dark:border-slate-800 mt-auto pt-4">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {status === "available" 
                ? (brief.created_at ? "Posted " + formatDistanceToNow(new Date(brief.created_at), { addSuffix: true }) : "")
                : status === "active" 
                  ? "Due " + (brief.deadline ? formatDistanceToNow(new Date(brief.deadline), { addSuffix: true }) : "soon") 
                  : "Completed"}
            </span>
            <Button size="sm" variant="ghost" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 -mr-2">
              View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
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
