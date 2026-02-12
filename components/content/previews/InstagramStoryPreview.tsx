import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, X, Heart, Send } from "lucide-react";
import Image from "next/image";
import { generateBlueGradient } from "@/lib/utils";

interface InstagramStoryPreviewProps {
  username?: string;
  userImage?: string;
  image?: string;
  mediaType?: 'image' | 'video';
  timeAgo?: string;
}

export function InstagramStoryPreview({
  username = "optimise_agency",
  userImage,
  image,
  mediaType = 'image',
  timeAgo = "2h",
}: InstagramStoryPreviewProps) {
  return (
    <div className="w-[320px] h-[568px] bg-black rounded-[2rem] overflow-hidden shadow-2xl mx-auto relative font-sans text-white border-4 border-gray-800">
        
      {/* Progress Bars */}
      <div className="absolute top-4 left-0 right-0 px-2 flex gap-1 z-20">
          <div className="h-0.5 bg-white/40 flex-1 rounded-full overflow-hidden">
             <div className="h-full bg-white w-2/3" />
          </div>
          <div className="h-0.5 bg-white/40 flex-1 rounded-full" />
          <div className="h-0.5 bg-white/40 flex-1 rounded-full" />
      </div>

      {/* Header */}
      <div className="absolute top-8 left-0 right-0 px-3 flex items-center justify-between z-20">
         <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 ring-0">
                <AvatarImage src={userImage} />
                <AvatarFallback 
                    style={{ background: generateBlueGradient(username) }}
                    className="text-white text-[10px]"
                >
                    {username[0].toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{username}</span>
                <span className="text-xs text-white/60">{timeAgo}</span>
            </div>
         </div>
         <div className="flex items-center gap-3">
             <MoreHorizontal className="w-5 h-5 text-white" />
             <X className="w-6 h-6 text-white" />
         </div>
      </div>

      {/* Content */}
      <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
        {image ? (
          mediaType === 'video' ? (
            <video 
              src={image} 
              className="w-full h-full object-cover" 
              controls={false}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <Image
              src={image}
              alt="Story content"
              fill
              className="object-cover"
            />
          )
        ) : (
          <div className="text-center p-6">
              <div className="text-2xl font-bold bg-gradient-to-tr from-purple-500 to-orange-500 bg-clip-text text-transparent mb-2">
                  New Post
              </div>
              <div className="text-sm text-gray-400">
                  Tap to view full content
              </div>
          </div>
        )}
      </div>

      {/* Footer / Input */}
      <div className="absolute bottom-4 left-0 right-0 px-3 flex items-center gap-3 z-20">
          <div className="flex-1 h-11 rounded-full border border-white/20 bg-transparent px-4 flex items-center">
              <span className="text-sm text-white/80">Send message</span>
          </div>
          <Heart className="w-7 h-7 text-white" />
          <Send className="w-7 h-7 text-white" />
      </div>
    </div>
  );
}
