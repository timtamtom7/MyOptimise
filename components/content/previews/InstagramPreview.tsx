import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { generateBlueGradient } from "@/lib/utils";

interface InstagramPreviewProps {
  username?: string;
  userImage?: string;
  image?: string;
  caption?: string;
  likes?: number;
  location?: string;
}

export function InstagramPreview({
  username = "optimise_agency",
  userImage,
  image,
  caption = "No caption provided.",
  likes = 124,
  location,
}: InstagramPreviewProps) {
  return (
    <div className="w-full max-w-[375px] bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-2xl mx-auto font-sans text-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userImage} />
            <AvatarFallback 
              style={{ background: generateBlueGradient(username) }}
              className="text-white text-[10px]"
            >
              {username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none">{username}</span>
            {location && <span className="text-xs text-gray-500">{location}</span>}
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5 text-gray-600" />
      </div>

      {/* Image */}
      <div className="relative aspect-square w-full bg-gray-100">
        {image ? (
          <Image
            src={image}
            alt="Post content"
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No image
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <Heart className="h-6 w-6 stroke-[1.5] hover:text-red-500 cursor-pointer transition-colors" />
            <MessageCircle className="h-6 w-6 stroke-[1.5] -rotate-90" />
            <Send className="h-6 w-6 stroke-[1.5]" />
          </div>
          <Bookmark className="h-6 w-6 stroke-[1.5]" />
        </div>

        {/* Likes */}
        <div className="text-sm font-semibold mb-2">
          {likes.toLocaleString()} likes
        </div>

        {/* Caption */}
        <div className="text-sm">
          <span className="font-semibold mr-2">{username}</span>
          <span className="whitespace-pre-wrap">{caption}</span>
        </div>

        {/* Timestamp */}
        <div className="text-[10px] text-gray-400 mt-2 uppercase tracking-wide">
          2 hours ago
        </div>
      </div>
    </div>
  );
}
