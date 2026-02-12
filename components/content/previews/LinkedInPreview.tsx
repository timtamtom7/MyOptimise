import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, ThumbsUp, MessageSquare, Share2, Send } from "lucide-react";
import Image from "next/image";
import { generateBlueGradient } from "@/lib/utils";

interface LinkedInPreviewProps {
  username?: string;
  userImage?: string;
  userTitle?: string;
  image?: string;
  mediaType?: 'image' | 'video';
  caption?: string;
  likes?: number;
  comments?: number;
}

export function LinkedInPreview({
  username = "Optimise Agency",
  userImage,
  userTitle = "Digital Marketing Experts",
  image,
  mediaType = 'image',
  caption = "Excited to announce our new strategy for Q4! 🚀 #marketing #growth",
  likes = 42,
  comments = 12,
}: LinkedInPreviewProps) {
  return (
    <div className="w-full max-w-[500px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mx-auto font-sans text-black">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-3">
        <div className="flex gap-3">
          <Avatar className="h-12 w-12 rounded-none">
            <AvatarImage src={userImage} />
            <AvatarFallback 
              style={{ background: generateBlueGradient(username) }}
              className="text-white text-xs rounded-none"
            >
              {username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900 leading-tight hover:text-blue-600 cursor-pointer hover:underline decoration-blue-600">{username}</span>
            <span className="text-xs text-slate-500 leading-tight mt-0.5">{userTitle}</span>
            <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-slate-500">2h • </span>
                <span className="text-xs text-slate-500">Edited • </span>
                <div className="w-3 h-3 relative opacity-60">
                    <Image src="https://static.licdn.com/aero-v1/sc/h/5a0c7104x516s5k524c753b5i" alt="world" fill />
                </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
             <MoreHorizontal className="h-5 w-5 text-slate-600 cursor-pointer" />
        </div>
      </div>

      {/* Caption */}
      <div className="px-4 pb-2 text-sm text-slate-900 whitespace-pre-wrap">
        {caption}
      </div>

      {/* Image */}
      {image ? (
        <div className="relative aspect-[1.91/1] w-full bg-slate-100">
          {mediaType === 'video' ? (
            <video 
              src={image} 
              className="w-full h-full object-cover" 
              controls 
              playsInline
            />
          ) : (
            <Image
              src={image}
              alt="Post content"
              fill
              className="object-cover"
            />
          )}
        </div>
      ) : (
         <div className="w-full aspect-[1.91/1] bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
            No media attached
         </div>
      )}

      {/* Stats */}
      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
              <div className="flex -space-x-1">
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-white z-10">
                      <ThumbsUp className="w-2 h-2 text-white fill-white" />
                  </div>
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-white">
                      <Heart className="w-2 h-2 text-white fill-white" />
                  </div>
              </div>
              <span className="hover:text-blue-600 hover:underline cursor-pointer ml-1">{likes}</span>
          </div>
          <div className="hover:text-blue-600 hover:underline cursor-pointer">
              {comments} comments • 2 reposts
          </div>
      </div>

      {/* Actions */}
      <div className="px-2 py-1 flex items-center justify-between">
         <button className="flex items-center gap-2 px-3 py-3 hover:bg-slate-100 rounded-md transition-colors group flex-1 justify-center">
             <ThumbsUp className="w-5 h-5 text-slate-600 group-hover:text-slate-900" />
             <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">Like</span>
         </button>
         <button className="flex items-center gap-2 px-3 py-3 hover:bg-slate-100 rounded-md transition-colors group flex-1 justify-center">
             <MessageSquare className="w-5 h-5 text-slate-600 group-hover:text-slate-900" />
             <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">Comment</span>
         </button>
         <button className="flex items-center gap-2 px-3 py-3 hover:bg-slate-100 rounded-md transition-colors group flex-1 justify-center">
             <Share2 className="w-5 h-5 text-slate-600 group-hover:text-slate-900" />
             <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">Repost</span>
         </button>
         <button className="flex items-center gap-2 px-3 py-3 hover:bg-slate-100 rounded-md transition-colors group flex-1 justify-center">
             <Send className="w-5 h-5 text-slate-600 group-hover:text-slate-900" />
             <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900">Send</span>
         </button>
      </div>
    </div>
  );
}
