"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, LayoutGrid, Type, Image as ImageIcon, Split, User, Smartphone, Quote, Grid3X3, ArrowLeft, ArrowRight, Expand, Calendar, Table, StickyNote, X, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { urlFor } from "@/sanity/lib/image";
import ReactPlayer from "react-player/lazy";

// Types based on Sanity Schema
export interface StrategySlide {
  _key: string;
  title?: string;
  layout: "title" | "text" | "split" | "grid" | "image" | "persona" | "mockup" | "statement" | "gallery" | "timeline" | "data-grid" | "video";
  content?: string; // Markdown
  image?: any;
  galleryImages?: any[];
  notes?: string;
  comments?: any[];
}

export interface StrategyDeckData {
  status?: string;
  slides?: StrategySlide[];
}

interface StrategyDeckViewerProps {
  data: StrategyDeckData;
}

export function StrategyDeckViewer({ data }: StrategyDeckViewerProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const slides = data.slides || [];

  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-slate-700">
        <LayoutGrid className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">No slides yet</h3>
        <p className="text-slate-500 dark:text-slate-400">Start building your strategy deck.</p>
      </div>
    );
  }

  const currentSlide = slides[currentSlideIndex];

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Controls & Progress */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="h-10 px-4 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            Slide {currentSlideIndex + 1} / {slides.length}
          </Badge>
          <span className="text-sm font-medium text-muted-foreground hidden md:inline-block">
            {currentSlide.title || "Untitled Slide"}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
            <Button
                variant={showNotes ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setShowNotes(!showNotes)}
                className="h-12 w-12 rounded-full mr-2"
                title="Toggle Strategist Notes"
            >
                <StickyNote className={cn("h-5 w-5", showNotes ? "text-blue-500" : "text-slate-400")} />
            </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prevSlide} 
            disabled={currentSlideIndex === 0}
            className="h-12 w-12 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={nextSlide} 
            disabled={currentSlideIndex === slides.length - 1}
            className="h-12 w-12 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="flex gap-6 h-[600px]">
        {/* Slide Viewport */}
        <div className="relative flex-1 bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <AnimatePresence mode="wait">
            <motion.div
                key={currentSlideIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute inset-0 p-8 md:p-12 lg:p-16 h-full w-full"
            >
                <SlideContent slide={currentSlide} />
            </motion.div>
            </AnimatePresence>
        </div>

        {/* Strategist Notes Sidebar */}
        <AnimatePresence>
            {showNotes && (
                <motion.div 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 320, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="h-full bg-yellow-50 dark:bg-yellow-900/10 rounded-[2.5rem] border border-yellow-200 dark:border-yellow-800/30 overflow-hidden shadow-lg flex-shrink-0"
                >
                    <div className="w-[320px] h-full flex flex-col p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg text-yellow-800 dark:text-yellow-500 flex items-center gap-2">
                                <StickyNote className="h-5 w-5" /> Strategist Notes
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowNotes(false)} className="h-8 w-8 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/20">
                                <X className="h-4 w-4 text-yellow-700 dark:text-yellow-500" />
                            </Button>
                        </div>
                        <div className="flex-1 pr-4 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-200 dark:scrollbar-thumb-yellow-800">
                            <div className="prose prose-sm prose-yellow dark:prose-invert">
                                {currentSlide.notes ? (
                                    <div className="whitespace-pre-wrap text-yellow-900/80 dark:text-yellow-200/80 font-medium font-handwriting text-lg leading-relaxed">
                                        {currentSlide.notes}
                                    </div>
                                ) : (
                                    <p className="text-yellow-700/50 dark:text-yellow-500/50 italic">
                                        No internal notes for this slide.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-4 overflow-x-auto pb-4 px-1 scrollbar-hide">
        {slides.map((slide, idx) => (
          <button
            key={slide._key || idx}
            onClick={() => setCurrentSlideIndex(idx)}
            className={cn(
              "flex-shrink-0 w-32 aspect-video rounded-xl border-2 transition-all overflow-hidden relative group",
              currentSlideIndex === idx 
                ? "border-blue-500 ring-2 ring-blue-500/20 shadow-lg scale-105" 
                : "border-transparent bg-slate-100 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 opacity-70 hover:opacity-100"
            )}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <SlideIcon layout={slide.layout} className="h-6 w-6 text-slate-400" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 text-[10px] text-white truncate text-center backdrop-blur-sm">
                {slide.title || `Slide ${idx + 1}`}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function SlideIcon({ layout, className }: { layout: string, className?: string }) {
  switch (layout) {
    case "title": return <Type className={className} />;
    case "text": return <Type className={className} />;
    case "split": return <Split className={className} />;
    case "grid": return <Grid3X3 className={className} />;
    case "image": return <ImageIcon className={className} />;
    case "persona": return <User className={className} />;
    case "mockup": return <Smartphone className={className} />;
    case "statement": return <Quote className={className} />;
    case "gallery": return <LayoutGrid className={className} />;
    case "timeline": return <Calendar className={className} />;
    case "data-grid": return <Table className={className} />;
    case "video": return <PlayCircle className={className} />;
    default: return <LayoutGrid className={className} />;
  }
}

function SlideContent({ slide }: { slide: StrategySlide }) {
  // Helper to render markdown-like content safely (simplified)
  const renderContent = (content?: string) => {
    if (!content) return null;
    return (
      <div className="prose prose-lg dark:prose-invert max-w-none prose-slate">
        {content.split('\n').map((line, i) => (
          <p key={i} className="mb-4">{line}</p>
        ))}
      </div>
    );
  };

  const getImageUrl = (source: any) => {
    if (!source) return null;
    try {
      return urlFor(source).url();
    } catch (e) {
      return null;
    }
  };

  const parseList = (content?: string) => {
    if (!content) return [];
    return content.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*')).map(line => line.replace(/^[-*]\s+/, ''));
  };

  // Extract URL from content (assuming first line is URL or using a specific pattern)
  // For simplicity, we'll check if content *contains* a URL, or if not, use the whole content as description
  // Actually, let's assume the user pastes the URL as the first line or we regex it.
  const extractVideoUrl = (content?: string) => {
    if (!content) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const match = content.match(urlRegex);
    return match ? match[0] : null;
  };

  const cleanContentForVideo = (content?: string) => {
    if (!content) return "";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.replace(urlRegex, '').trim();
  };

  switch (slide.layout) {
    case "video":
        const videoUrl = extractVideoUrl(slide.content);
        const description = cleanContentForVideo(slide.content);
        
        return (
             <div className="h-full flex flex-col">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-6 shrink-0">{slide.title}</h2>
                <div className="flex-1 rounded-[2rem] overflow-hidden bg-black relative shadow-xl border border-slate-200 dark:border-slate-800">
                    {videoUrl ? (
                        <div className="absolute inset-0 w-full h-full">
                            <ReactPlayer 
                                url={videoUrl} 
                                width="100%" 
                                height="100%" 
                                controls 
                                playing={false}
                            />
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                            <div className="text-center">
                                <PlayCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>No video URL found in content.</p>
                            </div>
                        </div>
                    )}
                </div>
                {description && (
                    <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                         {renderContent(description)}
                    </div>
                )}
             </div>
        );

    case "title":
      return (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-slate-100 max-w-4xl">
            {slide.title}
          </h1>
          {slide.content && (
            <p className="text-2xl text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
              {slide.content}
            </p>
          )}
          <div className="w-24 h-2 bg-blue-500 rounded-full mt-8" />
        </div>
      );

    case "split":
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 h-full items-center">
          <div className="space-y-6 overflow-y-auto max-h-full pr-4">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100">{slide.title}</h2>
            <div className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              {renderContent(slide.content)}
            </div>
          </div>
          <div className="h-full rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-900 relative shadow-inner">
            {slide.image ? (
              <img 
                src={getImageUrl(slide.image) || ""} 
                alt={slide.title} 
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-300">
                <ImageIcon className="h-16 w-16" />
              </div>
            )}
          </div>
        </div>
      );

    case "image":
      return (
        <div className="relative h-full w-full rounded-[2rem] overflow-hidden">
          {slide.image ? (
            <img 
              src={getImageUrl(slide.image) || ""} 
              alt={slide.title} 
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
             <div className="flex items-center justify-center h-full bg-slate-100 dark:bg-slate-900 text-slate-300">
                <ImageIcon className="h-16 w-16" />
              </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{slide.title}</h2>
            {slide.content && <p className="text-white/80 text-lg max-w-3xl">{slide.content}</p>}
          </div>
        </div>
      );
      
    case "statement":
      return (
        <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
          <Quote className="h-16 w-16 text-blue-500/20 mb-8 absolute top-0 left-0" />
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-slate-100 leading-tight max-w-5xl relative z-10">
            "{slide.content || slide.title}"
          </h2>
          <div className="mt-12 flex items-center gap-4">
             <div className="h-1 w-24 bg-blue-500 rounded-full" />
             {slide.layout !== "statement" && <p className="text-xl font-bold text-slate-500">{slide.title}</p>}
          </div>
           <Quote className="h-16 w-16 text-blue-500/20 mt-8 absolute bottom-0 right-0 rotate-180" />
        </div>
      );

    case "grid":
      return (
        <div className="h-full flex flex-col">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8 shrink-0">{slide.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2 pb-2 grow">
             {/* Assuming content is markdown list or just text, we'll try to parse logically or just show text */}
             <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                {renderContent(slide.content)}
             </div>
             <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                {slide.image ? (
                    <img 
                        src={getImageUrl(slide.image) || ""} 
                        alt="Grid visual" 
                        className="rounded-2xl max-h-full object-contain shadow-lg"
                    />
                ) : (
                    <div className="text-center text-slate-400">
                        <Grid3X3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Visual Placeholder</p>
                    </div>
                )}
             </div>
          </div>
        </div>
      );

    case "timeline":
      const timelineItems = parseList(slide.content);
      return (
        <div className="h-full flex flex-col">
           <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-10 shrink-0">{slide.title}</h2>
           <div className="flex-1 overflow-y-auto px-4">
              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-12 pb-10">
                  {timelineItems.length > 0 ? timelineItems.map((item, i) => (
                      <div key={i} className="relative pl-12">
                          <div className="absolute -left-[9px] top-2 h-4 w-4 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-950" />
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800/50">
                              <p className="text-lg font-medium text-slate-800 dark:text-slate-200">{item}</p>
                          </div>
                      </div>
                  )) : (
                      <p className="pl-8 text-slate-400 italic">Add bullet points to your slide content to create timeline items.</p>
                  )}
              </div>
           </div>
        </div>
      );

    case "data-grid":
        const dataItems = parseList(slide.content);
        return (
            <div className="h-full flex flex-col">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-8 shrink-0">{slide.title}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 overflow-y-auto pb-4">
                    {dataItems.length > 0 ? dataItems.map((item, i) => (
                        <div key={i} className="aspect-square bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-all">
                             <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400 font-bold text-xl">
                                {i + 1}
                             </div>
                             <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{item}</p>
                        </div>
                    )) : (
                        <div className="col-span-full text-center py-12 text-slate-400">
                             <Table className="h-12 w-12 mx-auto mb-4 opacity-50" />
                             <p>Add bullet points to create data cards.</p>
                        </div>
                    )}
                </div>
            </div>
        );

    default: // text layout fallback
      return (
        <div className="max-w-4xl mx-auto h-full flex flex-col justify-center">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-8 border-b-2 border-slate-100 dark:border-slate-800 pb-6 w-fit">
            {slide.title}
          </h2>
          <div className="text-xl leading-loose text-slate-600 dark:text-slate-300">
            {renderContent(slide.content)}
          </div>
        </div>
      );
  }
}
