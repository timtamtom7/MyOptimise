"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface MoodboardItem {
  _key: string;
  url?: string; // External URL
  image?: any;  // Sanity Image
  note?: string;
}

interface MoodboardViewProps {
  items: MoodboardItem[];
}

export function MoodboardView({ items }: MoodboardViewProps) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-slate-700">
        <ImageIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Empty Moodboard</h3>
        <p className="text-slate-500 dark:text-slate-400">Collect visual inspiration for the campaign.</p>
      </div>
    );
  }

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
      {items.map((item, i) => (
        <MoodboardCard key={item._key || i} item={item} />
      ))}
    </div>
  );
}

function MoodboardCard({ item }: { item: MoodboardItem }) {
  const imageUrl = item.image ? urlFor(item.image).url() : item.url;

  if (!imageUrl) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-zoom-in shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <img 
            src={imageUrl} 
            alt={item.note || "Moodboard image"} 
            className="w-full h-auto object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
             <ZoomIn className="text-white h-8 w-8 drop-shadow-md" />
          </div>
          {item.note && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <p className="text-white text-xs font-medium text-center line-clamp-2">{item.note}</p>
            </div>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-transparent border-0 shadow-none p-0 overflow-hidden">
        <div className="relative rounded-[2rem] overflow-hidden bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl">
           <img 
            src={imageUrl} 
            alt={item.note || "Moodboard image full"} 
            className="w-full h-auto max-h-[85vh] object-contain"
          />
          {item.note && (
            <div className="p-6 text-center">
                <p className="text-white text-lg font-medium">{item.note}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
