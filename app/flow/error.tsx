"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function FlowError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-[70vh] flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-red-50 dark:bg-red-950/20 blur-2xl rounded-full" />
                    <div className="relative w-20 h-20 mx-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-slate-900 dark:text-slate-50" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-display font-medium text-slate-900 dark:text-slate-50">
                        A Momentary Interruption
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                        We encountered an unexpected issue while preparing your flow.
                        Our systems have been notified.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                    <Button
                        onClick={() => reset()}
                        variant="default"
                        className="bg-slate-900 text-slate-50 hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 transition-all px-8 rounded-full"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" /> Try Again
                    </Button>
                    <Button
                        asChild
                        variant="outline"
                        className="border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 px-8 rounded-full"
                    >
                        <Link href="/">
                            <Home className="w-4 h-4 mr-2" /> Back Home
                        </Link>
                    </Button>
                </div>

                {error.digest && (
                    <div className="pt-8">
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                            Error Hash: {error.digest}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
