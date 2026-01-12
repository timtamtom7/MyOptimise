import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Music2, Disc } from "lucide-react";
import Image from "next/image";

interface TikTokPreviewProps {
  username?: string;
  userImage?: string;
  image?: string; // Placeholder for video thumb if no video
  caption?: string;
  likes?: string;
  comments?: string;
  shares?: string;
  soundName?: string;
}

export function TikTokPreview({
  username = "optimise_agency",
  userImage,
  image,
  caption = "Wait for the end... 👀 #agency #marketing",
  likes = "12.4K",
  comments = "102",
  shares = "45",
  soundName = "Original Sound - Optimise",
}: TikTokPreviewProps) {
  return (
    <div className="w-[320px] h-[580px] bg-black rounded-[2rem] overflow-hidden shadow-2xl mx-auto relative font-sans text-white border-4 border-gray-800">
      {/* Background Media */}
      <div className="absolute inset-0 bg-gray-900">
        {image ? (
          <Image
            src={image}
            alt="TikTok Content"
            fill
            className="object-cover opacity-90"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600">
            No Video Source
          </div>
        )}
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-b from-transparent via-transparent to-black/60">
        
        <div className="flex items-end justify-between">
          {/* Left Side: Info */}
          <div className="flex-1 pr-12 pb-2">
            <div className="font-semibold text-lg mb-1">@{username}</div>
            <div className="text-sm mb-3 line-clamp-3 leading-snug">
              {caption}
            </div>
            <div className="flex items-center gap-2 text-sm opacity-90">
              <Music2 className="h-4 w-4 animate-pulse" />
              <div className="overflow-hidden w-32">
                 <div className="whitespace-nowrap animate-marquee">
                   {soundName} &nbsp;&nbsp;&nbsp;&nbsp; {soundName}
                 </div>
              </div>
            </div>
          </div>

          {/* Right Side: Actions */}
          <div className="flex flex-col items-center gap-5 pb-2">
            {/* Avatar */}
            <div className="relative mb-2">
              <Avatar className="h-10 w-10 border-2 border-white">
                <AvatarImage src={userImage} />
                <AvatarFallback className="text-black bg-white">{username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 rounded-full p-0.5">
                 <div className="w-3 h-3 text-white flex items-center justify-center text-[10px] font-bold">+</div>
              </div>
            </div>

            {/* Like */}
            <div className="flex flex-col items-center gap-1">
              <Heart className="h-8 w-8 fill-white text-white drop-shadow-md" />
              <span className="text-xs font-semibold">{likes}</span>
            </div>

            {/* Comment */}
            <div className="flex flex-col items-center gap-1">
              <MessageCircle className="h-8 w-8 fill-white text-white drop-shadow-md -rotate-90" />
              <span className="text-xs font-semibold">{comments}</span>
            </div>

            {/* Share */}
            <div className="flex flex-col items-center gap-1">
              <Share2 className="h-8 w-8 fill-white text-white drop-shadow-md" />
              <span className="text-xs font-semibold">{shares}</span>
            </div>

             {/* Disc Animation */}
             <div className="mt-4">
                 <div className="bg-gray-800 rounded-full p-2 animate-spin-slow">
                    <Disc className="h-6 w-6" />
                 </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
