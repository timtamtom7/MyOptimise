import React from "react";

export default function FlowLoading() {
    return (
        <div className="container max-w-6xl mx-auto py-12 px-4 space-y-12 animate-in fade-in duration-700">
            <header className="flex justify-between items-end">
                <div className="space-y-4">
                    <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                    <div className="h-5 w-64 bg-slate-100 dark:bg-slate-900 rounded-md animate-pulse" />
                </div>
                <div className="h-10 w-32 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
            </header>

            <div className="space-y-8">
                <div className="flex gap-8 border-b border-slate-200 dark:border-slate-800 pb-px">
                    <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-t-md animate-pulse" />
                    <div className="h-10 w-24 bg-slate-100 dark:bg-slate-900 rounded-t-md animate-pulse" />
                    <div className="h-10 w-24 bg-slate-100 dark:bg-slate-900 rounded-t-md animate-pulse" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
                            <div className="flex justify-between">
                                <div className="h-5 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                <div className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
                            </div>
                            <div className="h-6 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                            <div className="h-20 w-full bg-slate-50 dark:bg-slate-950 rounded-lg animate-pulse" />
                            <div className="flex justify-between mt-auto">
                                <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                <div className="h-4 w-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
