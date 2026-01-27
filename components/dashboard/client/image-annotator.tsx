"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import Image from "next/image";

interface Annotation {
  id: string;
  x: number;
  y: number;
  text: string;
  author: string;
  createdAt: string;
}

interface ImageAnnotatorProps {
  src: string;
  alt: string;
  annotations: Annotation[];
  onAddAnnotation: (x: number, y: number, text: string) => void;
  onDeleteAnnotation?: (id: string) => void;
  canAnnotate: boolean;
  className?: string;
}

export function ImageAnnotator({ 
  src, 
  alt, 
  annotations, 
  onAddAnnotation, 
  onDeleteAnnotation,
  canAnnotate,
  className 
}: ImageAnnotatorProps) {
  const [pendingPoint, setPendingPoint] = useState<{x: number, y: number} | null>(null);
  const [commentText, setCommentText] = useState("");
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canAnnotate || !containerRef.current) return;
    
    // If we're already writing a comment, don't move the pin
    if (pendingPoint) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPendingPoint({ x, y });
  };

  const submitAnnotation = () => {
    if (pendingPoint && commentText.trim()) {
      onAddAnnotation(pendingPoint.x, pendingPoint.y, commentText);
      setPendingPoint(null);
      setCommentText("");
    }
  };

  const cancelAnnotation = () => {
    setPendingPoint(null);
    setCommentText("");
  };

  return (
    <div className={cn("relative inline-block w-full", className)} ref={containerRef}>
      <Image
        ref={imageRef}
        src={src} 
        alt={alt} 
        width={0}
        height={0}
        sizes="100vw"
        style={{ width: '100%', height: 'auto' }}
        className={cn("rounded-md", canAnnotate && "cursor-crosshair")}
        onClick={(e) => handleImageClick(e as any)}
      />

      {/* Existing Annotations */}
      {annotations.map((ann, i) => (
        <div
          key={ann.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
          style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
        >
          <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-md border-2 border-white cursor-pointer hover:scale-110 transition-transform">
            {i + 1}
          </div>
          
          {/* Tooltip on hover */}
          <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-48 bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
             <div className="font-semibold mb-1">{ann.author}</div>
             <div>{ann.text}</div>
          </div>
        </div>
      ))}

      {/* Pending Annotation Input */}
      {pendingPoint && (
        <div 
          className="absolute z-20 bg-background border rounded-lg shadow-lg p-3 w-64 transform -translate-x-1/2 mt-2"
          style={{ left: `${pendingPoint.x}%`, top: `${pendingPoint.y}%` }}
        >
          <div className="text-xs font-medium mb-2">Add Comment</div>
          <textarea
            className="w-full text-sm border rounded p-2 min-h-[60px] mb-2 focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="What needs to change?"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitAnnotation();
              }
              if (e.key === 'Escape') {
                cancelAnnotation();
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={cancelAnnotation} className="h-7 px-2">
              Cancel
            </Button>
            <Button size="sm" onClick={submitAnnotation} className="h-7 px-2" disabled={!commentText.trim()}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
