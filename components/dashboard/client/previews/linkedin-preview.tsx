"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, MessageSquare, Share2, Send, MoreHorizontal, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageAnnotator } from "../image-annotator";
import { useState } from "react";

interface LinkedInPreviewProps {
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

export function LinkedInPreview({
  post,
  authorName,
  authorAvatar,
  className,
  onAddAnnotation,
  annotateMode = false
}: LinkedInPreviewProps) {
  const isVideo = post.firstAssetMime?.startsWith("video/");
  const [expanded, setExpanded] = useState(false);
  const caption = post.caption || "";
  const shouldTruncate = caption.length > 200;

  return (
    <div className={cn("bg-white text-black border rounded-lg overflow-hidden shadow-sm max-w-[500px] mx-auto font-sans", className)}>
      {/* Header */}
      <div className="p-3 flex items-start justify-between">
        <div className="flex gap-3">
          <Avatar className="h-12 w-12 rounded-none">
            {authorAvatar && <AvatarImage src={authorAvatar} />}
            <AvatarFallback className="bg-blue-600 text-white rounded-none">
              {authorName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-semibold hover:underline decoration-1 cursor-pointer text-left">
              {authorName}
            </div>
            <div className="text-xs text-gray-500 text-left">Marketing Manager • 1st</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              1h • <Globe className="h-3 w-3" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 text-gray-500">
           <MoreHorizontal className="h-5 w-5" />
        </div>
      </div>

      {/* Caption */}
      <div className="px-3 pb-2 text-sm text-gray-900 whitespace-pre-wrap text-left">
        {shouldTruncate && !expanded ? (
          <>
            {caption.slice(0, 200)}...
            <button onClick={() => setExpanded(true)} className="text-gray-500 hover:underline ml-1">see more</button>
          </>
        ) : (
          caption
        )}
      </div>

      {/* Media Content */}
      <div className="w-full bg-gray-100">
         {post.firstAssetUrl ? (
          isVideo ? (
            <video
              src={post.firstAssetUrl}
              className="w-full h-auto max-h-[500px] object-contain"
              controls
            />
          ) : (
            <ImageAnnotator
              src={post.firstAssetUrl}
              alt={post.title || "Post content"}
              annotations={post.annotations || []}
              onAddAnnotation={onAddAnnotation || (() => {})}
              canAnnotate={annotateMode}
              className="w-full h-auto"
            />
          )
        ) : (
          <div className="aspect-video flex items-center justify-center text-gray-400 bg-gray-50 border-t border-b">
            No media
          </div>
        )}
      </div>

      {/* Footer / Action Bar */}
      <div className="px-3 py-2 border-b border-gray-100">
         <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
            <div className="bg-blue-500 rounded-full p-[2px]"><ThumbsUp className="h-2 w-2 text-white fill-white" /></div>
            <span className="hover:underline hover:text-blue-600 cursor-pointer">You and 42 others</span>
            <span className="mx-1">•</span>
            <span className="hover:underline hover:text-blue-600 cursor-pointer">5 comments</span>
         </div>

         <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <Button variant="ghost" size="sm" className="flex-1 text-gray-600 hover:bg-gray-100 font-semibold text-sm h-10 gap-2 rounded-md">
              <ThumbsUp className="h-4 w-4" /> Like
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 text-gray-600 hover:bg-gray-100 font-semibold text-sm h-10 gap-2 rounded-md">
              <MessageSquare className="h-4 w-4" /> Comment
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 text-gray-600 hover:bg-gray-100 font-semibold text-sm h-10 gap-2 rounded-md">
              <Share2 className="h-4 w-4" /> Repost
            </Button>
            <Button variant="ghost" size="sm" className="flex-1 text-gray-600 hover:bg-gray-100 font-semibold text-sm h-10 gap-2 rounded-md">
              <Send className="h-4 w-4" /> Send
            </Button>
         </div>
      </div>
    </div>
  );
}
