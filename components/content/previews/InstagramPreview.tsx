import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import Image from "next/image";
import { generateBlueGradient } from "@/lib/utils";

interface InstagramPreviewProps {
  username?: string;
  userImage?: string;
  image?: string;
  mediaType?: 'image' | 'video';
  mediaItems?: { url: string; type: 'image' | 'video' }[];
  caption?: string;
  likes?: number;
  location?: string;
}

export function InstagramPreview({
  username = "optimise_agency",
  userImage,
  image,
  mediaType = 'image',
  mediaItems = [],
  caption = "No caption provided.",
  likes = 124,
  location,
}: InstagramPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Normalize media input to array
  const slides = mediaItems.length > 0 
    ? mediaItems 
    : image ? [{ url: image, type: mediaType }] : [];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev === 0 ? prev : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentSlide((prev) => (prev === slides.length - 1 ? prev : prev + 1));
  };

  return (
    <div className="w-full max-w-[375px] bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-2xl mx-auto font-sans text-black">
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

      {/* Media Carousel */}
      <div className="relative aspect-square w-full bg-gray-100 group">
        {slides.length > 0 ? (
          <>
             {/* Current Slide */}
            <div className="w-full h-full relative">
                {slides[currentSlide].type === 'video' ? (
                    <video 
                    src={slides[currentSlide].url} 
                    className="w-full h-full object-cover" 
                    controls 
                    playsInline
                    loop
                    muted
                    />
                ) : (
                    <Image
                    src={slides[currentSlide].url}
                    alt={`Slide ${currentSlide + 1}`}
                    fill
                    className="object-cover"
                    />
                )}
            </div>

            {/* Navigation Arrows */}
            {slides.length > 1 && (
                <>
                    {currentSlide > 0 && (
                        <button 
                            onClick={handlePrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    {currentSlide < slides.length - 1 && (
                        <button 
                            onClick={handleNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-black rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                    
                    {/* Dots Indicator */}
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                        {slides.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentSlide ? 'bg-blue-500' : 'bg-white/60'}`}
                            />
                        ))}
                    </div>
                    
                    {/* Multi-post Icon */}
                    <div className="absolute top-3 right-3 bg-black/50 p-1.5 rounded-full backdrop-blur-sm">
                        <Copy className="w-3 h-3 text-white" />
                    </div>
                </>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            No media
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
