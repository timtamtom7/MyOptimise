"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageAnnotator } from "../image-annotator";
import { useState } from "react";

interface InstagramPreviewProps {
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
  onAddAnnotation?: (x: number, y: number, text: string) => Promise<void>;
  annotateMode?: boolean;
}

export function InstagramPreview({ 
  post, 
  authorName, 
  authorAvatar, 
  className,
  onAddAnnotation,
  annotateMode = false
}: InstagramPreviewProps) {
  const isVideo = post.firstAssetMime?.startsWith("video/");
  const [expanded, setExpanded] = useState(false);
  const caption = post.caption || "";
  const shouldTruncate = caption.length > 125;

  return (
    <div className={cn("bg-white text-black border rounded-xl overflow-hidden shadow-sm max-w-[375px] mx-auto font-sans", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 ring-2 ring-red-500 ring-offset-1">
            {authorAvatar && <AvatarImage src={authorAvatar} />}
            <AvatarFallback className="bg-gradient-to-tr from-yellow-400 to-purple-600 text-white text-[10px]">
              {authorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-xs font-semibold">{authorName.toLowerCase().replace(/\s+/g, '')}</div>
            <div className="text-[10px] text-gray-500">Original Audio</div>
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5 text-gray-600" />
      </div>

      {/* Content */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {post.firstAssetUrl ? (
          isVideo ? (
            <video 
              src={post.firstAssetUrl} 
              className="w-full h-full object-cover" 
              controls 
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
          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
            No media
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <Heart className="h-6 w-6" />
            <MessageCircle className="h-6 w-6 -rotate-90" />
            <Send className="h-6 w-6" />
          </div>
          <Bookmark className="h-6 w-6" />
        </div>

        {/* Likes */}
        <div className="text-xs font-semibold mb-2">
          1,234 likes
        </div>

        {/* Caption */}
        <div className="text-xs space-y-1">
          <p>
            <span className="font-semibold mr-2">{authorName.toLowerCase().replace(/\s+/g, '')}</span>
            {shouldTruncate && !expanded ? caption.slice(0, 125) + "... " : caption}
            {shouldTruncate && (
              <button onClick={() => setExpanded(!expanded)} className="text-gray-500 ml-1 hover:text-gray-700">
                {expanded ? "less" : "more"}
              </button>
            )}
          </p>
          <p className="text-gray-500 text-[10px] uppercase mt-2">2 days ago</p>
        </div>
      </div>
    </div>
  );
}
