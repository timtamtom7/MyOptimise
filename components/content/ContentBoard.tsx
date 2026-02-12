"use client";

import { useState } from "react";
import { useCapabilities } from "@/hooks/use-capabilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, Calendar as CalendarIcon, Filter, Search, MoreHorizontal, MessageSquare, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { InstagramPreview } from "./previews/InstagramPreview";
import { TikTokPreview } from "./previews/TikTokPreview";
import { urlFor } from "@/sanity/lib/image";
import { generateApprovalLink } from "@/app/actions/content";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getOrCreateThreadForDocument } from "@/app/actions/messages";
import { cn } from "@/lib/utils";
import { ContentCalendarView } from "./content-calendar-view";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { CreateContentDialog } from "./create-content-dialog";

type ContentItem = {
  _id: string;
  title: string;
  platform: string;
  status: string;
  scheduledAt?: string;
  caption?: string;
  media?: any[];
  client?: { _id: string; businessName?: string; name?: string };
};

interface ContentBoardProps {
  items: ContentItem[];
  clients: any[];
}

const COLUMNS = [
  { id: "draft", label: "Drafts", color: "bg-slate-100 dark:bg-slate-800" },
  { id: "internal_review", label: "Internal Review", color: "bg-purple-50 dark:bg-purple-900/10" },
  { id: "client_review", label: "Client Review", color: "bg-amber-50 dark:bg-amber-900/10" },
  { id: "scheduled", label: "Scheduled", color: "bg-blue-50 dark:bg-blue-900/10" },
  { id: "published", label: "Published", color: "bg-emerald-50 dark:bg-emerald-900/10" },
];

export function ContentBoard({ items, clients }: ContentBoardProps) {
  const { hasCapability } = useCapabilities();
  const canCreate = hasCapability("content.create");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [viewMode, setViewMode] = useState<"board" | "calendar">("board");
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.client?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDiscuss = async () => {
    if (!selectedItem) return;
    try {
        setLoading(true);
        const threadId = await getOrCreateThreadForDocument(
            selectedItem._id,
            "contentItem",
            selectedItem.title,
            selectedItem.client?._id || ""
        );
        if (threadId) {
            router.push(`/dashboard/employee/messages/${threadId}`);
        }
    } catch (e) {
        toast.error("Failed to start discussion");
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const getImageUrl = (item: ContentItem) => {
    if (!item.media || item.media.length === 0) return undefined;
    try {
      return urlFor(item.media[0]).url();
    } catch (e) {
      console.error("Error generating image URL", e);
      return undefined;
    }
  };

  const handleGenerateLink = async () => {
    if (!selectedItem) return;
    try {
        const path = await generateApprovalLink(selectedItem._id);
        const fullUrl = `${window.location.origin}${path}`;
        await navigator.clipboard.writeText(fullUrl);
        toast.success("Approval link copied to clipboard!");
    } catch (e) {
        toast.error("Failed to generate link");
        console.error(e);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[2rem]">
            <Button 
                variant={viewMode === "board" ? "default" : "ghost"}
                onClick={() => setViewMode("board")}
                className={cn(
                    "rounded-[1.5rem] px-6 font-bold h-10 transition-all",
                    viewMode === "board" ? "shadow-md" : "text-slate-500 hover:text-slate-900"
                )}
            >
                <LayoutGrid className="mr-2 h-4 w-4" /> Board
            </Button>
            <Button 
                variant={viewMode === "calendar" ? "default" : "ghost"}
                onClick={() => setViewMode("calendar")}
                className={cn(
                    "rounded-[1.5rem] px-6 font-bold h-10 transition-all",
                    viewMode === "calendar" ? "shadow-md" : "text-slate-500 hover:text-slate-900"
                )}
            >
                <CalendarIcon className="mr-2 h-4 w-4" /> Calendar
            </Button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                    placeholder="Search content..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 rounded-[1.5rem] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                />
            </div>
            {canCreate && (
                <CreateContentDialog clients={clients} />
            )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        {viewMode === "board" ? (
            <div className="flex gap-6 overflow-x-auto pb-4 h-full scrollbar-hide">
                {COLUMNS.map((col) => {
                const colItems = filteredItems.filter((i) => i.status === col.id);
                return (
                    <div
                        key={col.id}
                        className={cn(
                            "min-w-[320px] w-[320px] flex flex-col rounded-[2.5rem] p-4 border border-slate-100 dark:border-slate-800/50",
                            col.color
                        )}
                    >
                        <div className="px-2 mb-4 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200">
                                {col.label}
                            </h3>
                            <Badge variant="secondary" className="bg-white/50 dark:bg-black/20 font-bold rounded-lg">
                                {colItems.length}
                            </Badge>
                        </div>
                        
                        <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                            {colItems.map((item) => (
                            <Card
                                key={item._id}
                                className="cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-sm bg-white dark:bg-slate-900 rounded-[1.5rem] group"
                                onClick={() => setSelectedItem(item)}
                            >
                                <CardContent className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <Badge variant="outline" className="rounded-lg text-[10px] uppercase tracking-wider font-bold bg-slate-50 dark:bg-slate-800">
                                            {item.platform}
                                        </Badge>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                        </Button>
                                    </div>
                                    
                                    <h4 className="font-bold text-slate-900 dark:text-slate-100 leading-tight mb-3 line-clamp-2">
                                        {item.title}
                                    </h4>

                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                                                    {item.client?.name?.substring(0, 2) || "CL"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs font-medium text-slate-500 truncate max-w-[100px]">
                                                {item.client?.name || "Client"}
                                            </span>
                                        </div>
                                        {item.scheduledAt && (
                                            <div className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                {new Date(item.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                            ))}
                            {colItems.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                                <div className="h-12 w-12 rounded-full bg-white/50 dark:bg-black/10 flex items-center justify-center mb-3">
                                    <Plus className="h-5 w-5 text-slate-400" />
                                </div>
                                <p className="text-sm font-medium text-slate-500">No items</p>
                            </div>
                            )}
                        </div>
                    </div>
                );
                })}
            </div>
        ) : (
            <ContentCalendarView items={filteredItems} onSelectItem={setSelectedItem} />
        )}
      </div>

      <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto rounded-l-[2.5rem] border-l border-slate-200 dark:border-slate-800 shadow-2xl p-0 bg-slate-50 dark:bg-slate-950">
          <div className="p-8 pb-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <SheetHeader>
                <div className="flex items-center gap-3 mb-4">
                    <Badge variant="outline" className="h-8 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800">
                        {selectedItem?.platform}
                    </Badge>
                    <Badge className={cn(
                        "h-8 px-3 rounded-lg text-xs font-bold uppercase tracking-wider",
                        selectedItem?.status === 'published' ? 'bg-emerald-500' : 'bg-blue-500'
                    )}>
                        {selectedItem?.status.replace('_', ' ')}
                    </Badge>
                </div>
                <SheetTitle className="text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                    {selectedItem?.title}
                </SheetTitle>
                <SheetDescription className="text-lg font-medium text-slate-500 mt-2">
                    {selectedItem?.client?.name} • {selectedItem?.scheduledAt ? new Date(selectedItem.scheduledAt).toLocaleDateString() : "Unscheduled"}
                </SheetDescription>
            </SheetHeader>
          </div>
          
          {selectedItem && (
            <div className="p-8 space-y-8">
               {/* Preview Section */}
               <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-[2rem] blur-xl opacity-50" />
                        <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
                             {selectedItem.platform === "instagram" ? (
                                <InstagramPreview 
                                    image={getImageUrl(selectedItem)}
                                    caption={selectedItem.caption}
                                />
                            ) : selectedItem.platform === "tiktok" ? (
                                <TikTokPreview 
                                    image={getImageUrl(selectedItem)}
                                    caption={selectedItem.caption}
                                />
                            ) : (
                                <div className="w-[300px] h-[400px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl">
                                    <p className="text-slate-400 font-medium">Preview not available</p>
                                </div>
                            )}
                        </div>
                   </div>
               </div>

               {/* Actions */}
               <div className="grid grid-cols-2 gap-4">
                    <Button onClick={handleGenerateLink} className="h-14 rounded-[1.5rem] font-bold text-base shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <LinkIcon className="mr-2 h-5 w-5 text-blue-500" /> Copy Link
                    </Button>
                    <Button onClick={handleDiscuss} className="h-14 rounded-[1.5rem] font-bold text-base shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                        <MessageSquare className="mr-2 h-5 w-5" /> Discuss
                    </Button>
               </div>
               
               {/* Details */}
               <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 space-y-6">
                  <div>
                      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Caption</h4>
                      <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {selectedItem.caption || "No caption provided."}
                      </p>
                  </div>
                  
                  {selectedItem.scheduledAt && (
                      <div>
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Scheduled For</h4>
                          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-medium">
                                <CalendarIcon className="h-5 w-5 text-blue-500" />
                                {new Date(selectedItem.scheduledAt).toLocaleString()}
                          </div>
                      </div>
                  )}
               </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
