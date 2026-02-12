"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileDown, Loader2, FileText, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ReportGenerator() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    // Simulate PDF generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setOpen(false);
    toast.success("Report generated successfully!", {
      description: "Downloading monthly-report-oct.pdf..."
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-14 px-8 rounded-full font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 gap-2 transition-all hover:scale-105">
          <FileDown className="h-5 w-5" />
          Export Report
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[3rem] p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-950 sm:max-w-[500px]">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-8 py-10 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
            <DialogHeader className="relative z-10">
                <div className="h-14 w-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30 shadow-lg">
                    <FileText className="h-7 w-7 text-white" />
                </div>
                <DialogTitle className="text-3xl font-black text-white">Generate Report</DialogTitle>
                <DialogDescription className="text-blue-100 font-medium mt-1 text-base">
                Compile analytics into a professional PDF.
                </DialogDescription>
            </DialogHeader>
        </div>

        <div className="p-8 space-y-8">
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-sm text-slate-500 mb-6 uppercase tracking-wider flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    Included Sections
                </h4>
                <ul className="space-y-4">
                    <li className="flex items-center gap-4 font-bold text-slate-700 dark:text-slate-300">
                        <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                        Executive Summary
                    </li>
                    <li className="flex items-center gap-4 font-bold text-slate-700 dark:text-slate-300">
                        <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                        ROI Analysis & Charts
                    </li>
                    <li className="flex items-center gap-4 font-bold text-slate-700 dark:text-slate-300">
                        <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                        Content Performance Breakdown
                    </li>
                    <li className="flex items-center gap-4 font-bold text-slate-700 dark:text-slate-300">
                        <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                        Next Month Strategy
                    </li>
                </ul>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setOpen(false)} className="h-16 px-8 rounded-[2rem] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800">
                    Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={loading} className="h-16 px-10 rounded-[2rem] font-bold shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 bg-blue-600 hover:bg-blue-700 text-white min-w-[200px] text-lg">
                    {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <><FileDown className="mr-2 h-6 w-6" /> Download PDF</>}
                </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
