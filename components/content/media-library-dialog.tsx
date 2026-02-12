"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Image as ImageIcon, FolderOpen, History } from "lucide-react";
import { getMediaLibrary } from "@/app/actions/content";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface MediaLibraryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string;
    onSelect: (url: string, assetId: string, type: 'image' | 'video') => void;
}

export function MediaLibraryDialog({ open, onOpenChange, clientId, onSelect }: MediaLibraryDialogProps) {
    const [loading, setLoading] = useState(false);
    const [assets, setAssets] = useState<{ brandAssets: any[], history: any[] }>({ brandAssets: [], history: [] });

    useEffect(() => {
        if (open && clientId) {
            setLoading(true);
            getMediaLibrary(clientId)
                .then((data: any) => {
                    setAssets({
                        brandAssets: data.brandAssets || [],
                        history: data.history || []
                    });
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [open, clientId]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden bg-slate-50 dark:bg-slate-900 rounded-[2rem]">
                <div className="p-6 pb-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Media Library</DialogTitle>
                        <DialogDescription>Select an asset from the client's library or previous posts.</DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-hidden p-6">
                    <Tabs defaultValue="brand" className="h-full flex flex-col">
                        <TabsList className="w-full justify-start h-12 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl p-1 mb-4">
                            <TabsTrigger value="brand" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <FolderOpen className="w-4 h-4 mr-2" />
                                Brand Assets
                            </TabsTrigger>
                            <TabsTrigger value="history" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                <History className="w-4 h-4 mr-2" />
                                Previous Uploads
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-hidden bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                                </div>
                            ) : (
                                <>
                                    <TabsContent value="brand" className="h-full m-0 p-0">
                                        <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                                            {assets.brandAssets.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                    <FolderOpen className="w-12 h-12 mb-4 opacity-20" />
                                                    <p>No brand assets found.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {assets.brandAssets.map((asset, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => {
                                                                if (asset.url && asset.assetId) {
                                                                    const type = asset.mimeType?.startsWith('video/') ? 'video' : 'image';
                                                                    onSelect(asset.url, asset.assetId, type);
                                                                    onOpenChange(false);
                                                                }
                                                            }}
                                                            className="group relative aspect-square rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 hover:ring-2 hover:ring-blue-500 transition-all bg-slate-50"
                                                        >
                                                            {asset.url && (
                                                                <Image 
                                                                    src={asset.url} 
                                                                    alt={asset.title || "Asset"} 
                                                                    fill 
                                                                    className="object-cover transition-transform group-hover:scale-105" 
                                                                />
                                                            )}
                                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-white text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {asset.title || "Untitled"}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="history" className="h-full m-0 p-0">
                                        <div className="h-full overflow-y-auto p-4 custom-scrollbar">
                                            {assets.history.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                                    <History className="w-12 h-12 mb-4 opacity-20" />
                                                    <p>No history found.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {assets.history.map((item, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => {
                                                                if (item.url && item.assetId) {
                                                                    onSelect(item.url, item.assetId, item.type || 'image');
                                                                    onOpenChange(false);
                                                                }
                                                            }}
                                                            className="group relative aspect-square rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 hover:ring-2 hover:ring-blue-500 transition-all bg-slate-50"
                                                        >
                                                            <Image 
                                                                src={item.url} 
                                                                alt="History item" 
                                                                fill 
                                                                className="object-cover transition-transform group-hover:scale-105" 
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                </>
                            )}
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
