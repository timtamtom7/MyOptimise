"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageAnnotator } from "../image-annotator";

interface TikTokPreviewProps {
  post: {
    _id: string;
    firstAssetUrl?: string;
    firstAssetMime?: string;
    caption?: string;
    title?: string;
    annotations?: any[];
  };
  authorName: string;
  authorAvatar?: string;
  className?: string;
  onAddAnnotation?: (x: number, y: number, text: string) => void;
  annotateMode?: boolean;
}

export function TikTokPreview({
  post,
  authorName,
  authorAvatar,
  className,
  onAddAnnotation,
  annotateMode = false
}: TikTokPreviewProps) {
  const isVideo = post.firstAssetMime?.startsWith("video/");

  return (
    <div className={cn("bg-black text-white border-none rounded-xl overflow-hidden shadow-sm max-w-[320px] mx-auto font-sans relative aspect-[9/16]", className)}>
      {/* Content Layer */}
      <div className="absolute inset-0 bg-gray-900">
        {post.firstAssetUrl ? (
          isVideo ? (
            <video
              src={post.firstAssetUrl}
              className="w-full h-full object-cover"
              controls={false}
              autoPlay
              loop
              muted
            />
          ) : (
            <ImageAnnotator
              src={post.firstAssetUrl}
              alt={post.title || "Post content"}
              annotations={post.annotations || []}
              onAddAnnotation={onAddAnnotation || (() => {})}
              canAnnotate={annotateMode}
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            No media
          </div>
        )}
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

      {/* Right Sidebar Actions */}
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-6 z-10 pointer-events-auto">
        <div className="relative">
          <Avatar className="h-10 w-10 ring-1 ring-white">
            {authorAvatar && <AvatarImage src={authorAvatar} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {authorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-pink-500 rounded-full w-4 h-4 flex items-center justify-center border border-white">
            <span className="text-white text-[10px] font-bold">+</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Heart className="h-8 w-8 text-white fill-white/20" />
          <span className="text-xs font-semibold">12.5K</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <MessageCircle className="h-8 w-8 text-white fill-white/20" />
          <span className="text-xs font-semibold">842</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <Share2 className="h-8 w-8 text-white fill-white/20" />
          <span className="text-xs font-semibold">Share</span>
        </div>
      </div>

      {/* Bottom Content Info */}
      <div className="absolute left-4 bottom-4 right-16 z-10 text-left pointer-events-auto">
        <div className="font-semibold text-sm mb-1 drop-shadow-md">@{authorName.replace(/\s+/g, '').toLowerCase()}</div>
        <div className="text-sm text-white/90 line-clamp-3 mb-2 drop-shadow-md">
          {post.caption || "No caption provided"}
        </div>
        <div className="flex items-center gap-2 text-white/90">
          <Music2 className="h-3 w-3 animate-spin-slow" />
          <div className="text-xs overflow-hidden w-32">
            <div className="whitespace-nowrap">Original Sound - {authorName}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
