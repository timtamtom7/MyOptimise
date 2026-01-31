"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Check, X, Maximize2, Minimize2, Globe, ImageIcon, MessageSquare, Send, Printer, Play, Pause, Download, Share2, ThumbsUp, ThumbsDown, ArrowRight, User, Smartphone, Sun, Moon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { approveStrategy, rejectStrategy, addStrategySlideComment } from "@/app/actions/campaigns";
import { urlFor } from "@/sanity/lib/image";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Comment {
    _key: string;
    text: string;
    author: string;
    date: string;
    resolved?: boolean;
}

interface Slide {
  _key: string;
  title: string;
  layout: string;
  content: string;
  notes?: string;
  imageUrl?: string; // For local preview
  image?: any; // For Sanity data
  galleryImages?: { _key: string; url: string; assetId?: string }[];
  comments?: Comment[];
}

interface StrategyPresentationProps {
  campaign: {
    _id: string;
    title: string;
    client: { name: string };
    strategyDeck: {
      slides: Slide[];
      competitors: any[];
      moodboard: any[];
      status: string;
      approvalToken?: string;
      targetAudience?: string;
      toneOfVoice?: string;
      strategicPillars?: string[];
      proposedDeliverables?: any[];
    };
  };
  onClose?: () => void;
  mode?: "slideshow" | "print";
}

export function StrategyPresentation({ campaign, onClose, mode = "slideshow" }: StrategyPresentationProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  
  const router = useRouter();
  const [commentText, setCommentText] = useState("");
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [printTheme, setPrintTheme] = useState<'light' | 'dark'>('light');

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide, isFullscreen]);

  const slides = campaign.strategyDeck?.slides || [];
  const competitors = campaign.strategyDeck?.competitors || [];
  const moodboard = campaign.strategyDeck?.moodboard || [];
  const proposedDeliverables = campaign.strategyDeck?.proposedDeliverables || [];
  const context = {
      audience: campaign.strategyDeck?.targetAudience,
      tone: campaign.strategyDeck?.toneOfVoice,
      pillars: campaign.strategyDeck?.strategicPillars
  };

  const hasContext = context.audience || context.tone || (context.pillars && context.pillars.length > 0);

  const pages = [
      ...slides.map((s) => ({ type: 'slide', data: s })),
      ...(hasContext ? [{ type: 'context', data: context }] : []),
      ...(proposedDeliverables.length > 0 ? [{ type: 'plan', data: proposedDeliverables }] : []),
      ...(competitors.length > 0 ? [{ type: 'competitors', data: competitors }] : []),
      ...(moodboard.length > 0 ? [{ type: 'moodboard', data: moodboard }] : [])
  ];

  const totalSlides = pages.length;

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) setCurrentSlide(currentSlide + 1);
  };

  const handlePrev = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const handleApprove = async () => {
    if (!confirm("Approve this strategy? This will signal the team to begin production.")) return;
    setIsSubmitting(true);
    try {
        const formData = new FormData();
        formData.append("campaignId", campaign._id);
        const result = await approveStrategy(formData);
        if (result.success) {
            toast.success("Strategy Approved! Production will begin shortly.");
            onClose?.();
        } else {
            toast.error("Failed to approve strategy");
        }
    } catch (e) {
        toast.error("An error occurred");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
        toast.error("Please provide feedback on what needs to change.");
        return;
    }
    setIsSubmitting(true);
    try {
        const formData = new FormData();
        formData.append("campaignId", campaign._id);
        formData.append("reason", rejectReason);
        const result = await rejectStrategy(formData);
        if (result.success) {
            toast.success("Changes requested. The team has been notified.");
            setShowRejectDialog(false);
            onClose?.();
        } else {
            toast.error("Failed to request changes");
        }
    } catch (e) {
        toast.error("An error occurred");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleAddComment = async (slideKey: string) => {
    if (!commentText.trim()) return;
    setIsSubmitting(true);
    try {
        const formData = new FormData();
        formData.append("campaignId", campaign._id);
        formData.append("slideKey", slideKey);
        formData.append("comment", commentText);
        
        const result = await addStrategySlideComment(formData);
        if (result.success) {
            toast.success("Comment added");
            setCommentText("");
            router.refresh();
        } else {
            toast.error("Failed to add comment");
        }
    } catch (e) {
        toast.error("Error adding comment");
    } finally {
        setIsSubmitting(false);
    }
  };

  const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
      } else {
          document.exitFullscreen().then(() => setIsFullscreen(false));
      }
  };

  // --- Renderers ---

  const renderSlideContent = (slide: Slide) => {
      const imageUrl = slide.imageUrl || (slide.image ? urlFor(slide.image).url() : null);

      return (
          <div className="h-full w-full relative overflow-hidden bg-slate-950">
             {/* Dynamic Background */}
             <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay z-0" />
             
             {/* Animated Gradient Orbs */}
             <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                    x: [0, 50, 0]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-900/30 blur-[120px] rounded-full z-0" 
             />
             <motion.div 
                animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.4, 0.2],
                    x: [0, -30, 0]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
                className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900/20 blur-[120px] rounded-full z-0" 
             />

             {/* Content Container */}
             <div className="h-full w-full relative z-10 p-16 flex flex-col">
                
                {/* --- LAYOUT: TITLE --- */}
                {slide.layout === 'title' && (
                    <div className="flex flex-col items-center justify-center h-full text-center max-w-5xl mx-auto">
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="mb-12 p-6 rounded-full bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 backdrop-blur-sm"
                        >
                             <Play className="w-12 h-12 text-blue-400 fill-blue-400/20" />
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="text-7xl md:text-8xl font-bold mb-10 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 font-display tracking-tight leading-[1.1]"
                        >
                            {slide.title}
                        </motion.h1>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="w-24 h-1 bg-blue-600 rounded-full mb-10 opacity-80" 
                        />
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.6 }}
                            className="prose prose-xl prose-invert text-slate-300 max-w-3xl font-light leading-relaxed"
                        >
                            <ReactMarkdown>{slide.content}</ReactMarkdown>
                        </motion.div>
                    </div>
                )}

                {/* --- LAYOUT: SPLIT --- */}
                {slide.layout === 'split' && (
                    <div className="grid grid-cols-2 gap-20 h-full items-center">
                        <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="flex flex-col justify-center"
                        >
                            <h2 className="text-5xl md:text-6xl font-bold mb-10 text-white font-display leading-tight">{slide.title}</h2>
                            <div className="prose prose-lg prose-invert text-slate-300 leading-relaxed">
                                <ReactMarkdown>{slide.content}</ReactMarkdown>
                            </div>
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0, x: 50, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="h-[85%] relative rounded-3xl overflow-hidden shadow-2xl shadow-black/60 border border-slate-800/50 group"
                        >
                            {imageUrl ? (
                                <img src={imageUrl} alt={slide.title} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105" />
                            ) : (
                                <div className="w-full h-full bg-slate-900 flex items-center justify-center flex-col gap-4">
                                    <ImageIcon className="w-24 h-24 text-slate-800" />
                                    <p className="text-slate-700 font-mono text-sm uppercase tracking-widest">Image Placeholder</p>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                        </motion.div>
                    </div>
                )}

                {/* --- LAYOUT: IMAGE --- */}
                {slide.layout === 'image' && (
                    <div className="h-full flex flex-col">
                         <motion.div 
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1.2 }}
                            className="flex-1 relative rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-slate-800/50 group"
                        >
                            {imageUrl ? (
                                <img src={imageUrl} alt={slide.title} className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-105" />
                            ) : (
                                <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                    <ImageIcon className="w-24 h-24 text-slate-800" />
                                </div>
                            )}
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
                            
                            <div className="absolute bottom-0 left-0 right-0 p-16">
                                <motion.h2 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.4 }}
                                    className="text-6xl font-bold mb-8 text-white font-display"
                                >
                                    {slide.title}
                                </motion.h2>
                                {slide.content && (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.8, delay: 0.6 }}
                                        className="prose prose-xl prose-invert text-slate-200 max-w-4xl"
                                    >
                                        <ReactMarkdown>{slide.content}</ReactMarkdown>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* --- LAYOUT: QUOTE --- */}
                {slide.layout === 'quote' && (
                     <div className="h-full flex flex-col justify-center items-center text-center px-24 relative">
                         <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 0.05, scale: 1 }}
                            transition={{ duration: 1 }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        >
                             <MessageSquare className="w-[600px] h-[600px] text-white" />
                         </motion.div>
                         <div className="relative z-10 max-w-5xl">
                             <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="text-5xl md:text-6xl font-serif italic text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-300 leading-relaxed mb-16"
                            >
                                 <ReactMarkdown>{slide.content}</ReactMarkdown>
                             </motion.div>
                             <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: 120 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto rounded-full" 
                         />
                             <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                                className="mt-8 text-xl font-bold uppercase tracking-widest text-blue-400"
                            >
                                {slide.title}
                             </motion.p>
                         </div>
                     </div>
                )}

                {/* --- LAYOUT: STATS --- */}
                {slide.layout === 'stats' && (
                    <div className="h-full flex flex-col justify-center">
                         <motion.h2 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-5xl font-bold mb-20 text-center text-white font-display"
                        >
                            {slide.title}
                        </motion.h2>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                             {/* Note: This assumes markdown content is a list or similar. 
                                 For a real stats slide, we'd parse the content or use a structured input. 
                                 For now, we style the prose to look big. */}
                             <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="prose prose-xl prose-invert mx-auto [&>ul>li]:text-6xl [&>ul>li]:font-bold [&>ul>li]:text-blue-400 [&>ul>li]:list-none [&>ul]:p-0 [&>ul>li>strong]:text-slate-200 [&>ul>li>strong]:block [&>ul>li>strong]:text-lg [&>ul>li>strong]:mt-2 [&>ul>li>strong]:font-normal [&>ul>li>strong]:uppercase [&>ul>li>strong]:tracking-widest"
                            >
                                 <ReactMarkdown>{slide.content}</ReactMarkdown>
                             </motion.div>
                         </div>
                    </div>
                )}

                {/* --- LAYOUT: GRID --- */}
                {slide.layout === 'grid' && (
                    <div className="h-full flex flex-col">
                        <motion.h2 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-4xl font-bold mb-10 text-white font-display"
                        >
                            {slide.title}
                        </motion.h2>
                        <div className="flex-1 grid grid-cols-2 gap-8">
                             <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-800"
                             >
                                 {imageUrl ? (
                                    <img src={imageUrl} alt="Grid 1" className="w-full h-full object-cover" />
                                 ) : (
                                    <div className="w-full h-full bg-slate-900 flex items-center justify-center"><ImageIcon className="w-12 h-12 text-slate-800" /></div>
                                 )}
                             </motion.div>
                             <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 backdrop-blur-sm"
                             >
                                 <div className="prose prose-lg prose-invert text-slate-300">
                                     <ReactMarkdown>{slide.content}</ReactMarkdown>
                                 </div>
                             </motion.div>
                        </div>
                    </div>
                )}

                {/* --- LAYOUT: ROADMAP (Timeline) --- */}
                {slide.layout === 'roadmap' && (
                    <div className="h-full flex flex-col">
                        <motion.h2 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-4xl font-bold mb-12 text-center text-white font-display"
                        >
                            {slide.title}
                        </motion.h2>
                        <div className="relative flex-1 max-w-4xl mx-auto w-full overflow-y-auto pr-4">
                            {/* Central Line */}
                            <div className="absolute left-[19px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/0 via-blue-500/50 to-blue-500/0 md:transform md:-translate-x-1/2" />
                            
                            <div className="space-y-8">
                                <ReactMarkdown
                                    components={{
                                        ul: ({children}) => <ul className="list-none p-0 m-0 space-y-8">{children}</ul>,
                                        li: ({children}) => (
                                            <li className="relative grid grid-cols-[40px_1fr] md:grid-cols-2 md:gap-16 items-center group">
                                                {/* Dot */}
                                                <div className="absolute left-[11px] md:left-1/2 top-1/2 w-4 h-4 bg-slate-950 border-2 border-blue-500 rounded-full md:-translate-x-1/2 -translate-y-1/2 z-10 group-hover:bg-blue-500 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all" />
                                                
                                                {/* Content Box - Desktop Alternating */}
                                                <div className="col-start-2 md:group-odd:col-start-1 md:group-odd:text-right md:group-even:col-start-2 md:group-even:text-left">
                                                    <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl inline-block backdrop-blur-sm group-hover:border-blue-500/50 transition-colors w-full md:w-auto">
                                                        <div className="prose prose-invert prose-sm">
                                                            {children}
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        )
                                    }}
                                >
                                    {slide.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- LAYOUT: PERSONA --- */}
                {slide.layout === 'persona' && (
                    <div className="h-full flex flex-col justify-center items-center">
                        <motion.h2 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-4xl font-bold mb-12 text-center text-white font-display"
                        >
                            {slide.title}
                        </motion.h2>
                        <div className="flex flex-col md:flex-row gap-12 items-center max-w-5xl mx-auto w-full">
                             <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="relative shrink-0"
                             >
                                 <div className="w-64 h-64 md:w-80 md:h-80 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl shadow-blue-900/50 relative z-10">
                                     {imageUrl ? (
                                        <img src={imageUrl} alt="Persona" className="w-full h-full object-cover" />
                                     ) : (
                                        <div className="w-full h-full bg-slate-900 flex items-center justify-center"><User className="w-32 h-32 text-slate-700" /></div>
                                     )}
                                 </div>
                                 {/* Decorative rings */}
                                <div className="absolute inset-0 rounded-full border border-blue-500/30 scale-110 animate-pulse" />
                                <div className="absolute inset-0 rounded-full border border-blue-500/20 scale-125" />
                            </motion.div>
                             
                             <motion.div 
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-10 rounded-3xl flex-1 w-full relative overflow-hidden group"
                             >
                                 <div className="absolute top-0 right-0 p-32 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                                 <div className="prose prose-lg prose-invert text-slate-300 relative z-10">
                                     <ReactMarkdown>{slide.content}</ReactMarkdown>
                                 </div>
                             </motion.div>
                        </div>
                    </div>
                )}

                {/* --- LAYOUT: MOCKUP --- */}
                {slide.layout === 'mockup' && (
                    <div className="h-full flex flex-col justify-center">
                        <motion.h2 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-4xl font-bold mb-12 text-center text-white font-display"
                        >
                            {slide.title}
                        </motion.h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto w-full px-8">
                             <motion.div 
                                initial={{ opacity: 0, y: 100 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1, type: "spring", bounce: 0.2 }}
                                className="flex justify-center md:justify-end"
                             >
                                 <div className="relative w-[300px] h-[600px] bg-slate-950 rounded-[3rem] border-[12px] border-slate-800 shadow-2xl shadow-black overflow-hidden ring-1 ring-white/10">
                                     {/* Notch */}
                                     <div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-slate-950 rounded-b-xl z-20" />
                                     
                                     {imageUrl ? (
                                        <img src={imageUrl} alt="Mockup" className="w-full h-full object-cover" />
                                     ) : (
                                        <div className="w-full h-full bg-slate-900 flex items-center justify-center flex-col gap-4">
                                            <Smartphone className="w-16 h-16 text-slate-800" />
                                            <span className="text-slate-700 text-xs uppercase tracking-widest">Mockup</span>
                                        </div>
                                     )}
                                     
                                     {/* Screen Glint */}
                                     <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                                 </div>
                             </motion.div>
                             
                             <motion.div 
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="flex flex-col justify-center"
                             >
                                 <div className="prose prose-xl prose-invert text-slate-300">
                                     <ReactMarkdown>{slide.content}</ReactMarkdown>
                                 </div>
                             </motion.div>
                        </div>
                    </div>
                )}

                {/* --- LAYOUT: STATEMENT --- */}
                {slide.layout === 'statement' && (
                    <div className="h-full relative flex flex-col items-center justify-center p-12 text-center overflow-hidden">
                        {/* Background Image with Parallax/Zoom */}
                        {imageUrl && (
                            <div className="absolute inset-0 z-0">
                                <motion.img 
                                    initial={{ scale: 1.1 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 10, ease: "linear" }}
                                    src={imageUrl} 
                                    alt="Background" 
                                    className="w-full h-full object-cover opacity-30 blur-sm" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
                            </div>
                        )}
                        
                        <div className="relative z-10 max-w-5xl">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            >
                                <div className="prose prose-2xl prose-invert text-white [&>h1]:text-7xl [&>h1]:font-display [&>h1]:font-bold [&>h1]:leading-tight [&>h1]:mb-8 [&>p]:text-3xl [&>p]:font-light [&>p]:text-slate-300">
                                    <ReactMarkdown>{slide.content}</ReactMarkdown>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}

                {/* --- LAYOUT: GALLERY --- */}
                {slide.layout === 'gallery' && (
                    <div className="h-full flex flex-col p-12">
                        <motion.h2 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-4xl font-bold mb-10 text-center text-white font-display"
                        >
                            {slide.title}
                        </motion.h2>
                        
                        <div className="flex-1 grid grid-cols-2 gap-12 items-start">
                             <div className="grid grid-cols-2 gap-4 auto-rows-min max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                                 {slide.galleryImages?.map((img, i) => (
                                     <motion.div 
                                        key={img._key}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5, delay: i * 0.1 }}
                                        className="relative aspect-square rounded-2xl overflow-hidden shadow-lg border border-slate-800 group cursor-pointer"
                                     >
                                         <img src={img.url} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                     </motion.div>
                                 ))}
                             </div>
                             
                             <motion.div 
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="flex flex-col justify-center h-full p-8 bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-slate-800"
                             >
                                 <div className="prose prose-xl prose-invert text-slate-300">
                                     <ReactMarkdown>{slide.content}</ReactMarkdown>
                                 </div>
                             </motion.div>
                        </div>
                    </div>
                )}

                {/* --- LAYOUT: DEFAULT / TEXT --- */}
                {(slide.layout === 'text' || !['title','split','image','quote','stats','grid','persona','mockup','statement','gallery'].includes(slide.layout)) && (
                    <div className="h-full flex flex-col p-8 md:p-16">
                        <motion.h2 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-5xl md:text-6xl font-bold mb-16 text-white font-display border-b border-slate-800/50 pb-8"
                        >
                            {slide.title}
                        </motion.h2>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="prose prose-2xl prose-invert text-slate-300 max-w-6xl leading-relaxed"
                        >
                            <ReactMarkdown>{slide.content}</ReactMarkdown>
                        </motion.div>
                    </div>
                )}
             </div>
          </div>
      );
  };

  const renderStrategyContext = () => (
      <div className="h-full w-full bg-slate-950 p-16 flex flex-col overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-900/10 blur-[150px] rounded-full -z-10" />
          
          <h2 className="text-4xl font-bold mb-12 text-white font-display border-b border-slate-800 pb-6">Strategy Context</h2>
          <div className="grid md:grid-cols-2 gap-16 flex-1 overflow-y-auto pr-4">
              <div className="space-y-12">
                  {context.audience && (
                      <div className="group">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                              <span className="w-8 h-[1px] bg-blue-400"></span> Target Audience
                          </h3>
                          <p className="text-2xl font-light text-slate-200 leading-relaxed group-hover:text-white transition-colors">{context.audience}</p>
                      </div>
                  )}
                  {context.tone && (
                      <div className="group">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-sky-400 mb-4 flex items-center gap-2">
                              <span className="w-8 h-[1px] bg-sky-400"></span> Tone of Voice
                          </h3>
                          <p className="text-2xl font-light text-slate-200 leading-relaxed group-hover:text-white transition-colors">{context.tone}</p>
                      </div>
                  )}
              </div>
              
              {context.pillars && context.pillars.length > 0 && (
                  <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-blue-500 mb-6 flex items-center gap-2">
                          <span className="w-8 h-[1px] bg-blue-500"></span> Strategic Pillars
                      </h3>
                      <div className="space-y-4">
                          {context.pillars.map((pillar: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-6 p-6 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all group">
                                  <div className="h-12 w-12 rounded-full bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center font-bold text-lg shrink-0 transition-all shadow-lg">
                                      {idx + 1}
                                  </div>
                                  <p className="text-xl text-slate-200 font-medium">{pillar}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      </div>
  );

  const renderCompetitors = () => (
      <div className="h-full w-full bg-slate-950 p-16 flex flex-col relative">
          <h2 className="text-4xl font-bold mb-10 text-white font-display border-b border-slate-800 pb-6">Competitor Landscape</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto pr-4 pb-12">
              {competitors.map((comp, idx) => (
                  <div key={idx} className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:bg-slate-900 hover:border-slate-700 transition-all group">
                      <div className="flex items-start justify-between mb-4">
                          <h3 className="font-bold text-2xl text-white group-hover:text-blue-400 transition-colors">{comp.name}</h3>
                          {comp.url && (
                              <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white flex items-center text-sm transition-colors px-3 py-1 rounded-full bg-slate-800">
                                  <Globe className="w-3 h-3 mr-2" /> Visit
                              </a>
                          )}
                      </div>
                      <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">{comp.notes}</p>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderMoodboard = () => (
      <div className="h-full w-full bg-slate-950 p-16 flex flex-col relative">
          <h2 className="text-4xl font-bold mb-10 text-white font-display border-b border-slate-800 pb-6">Visual Direction</h2>
          <div className="columns-2 md:columns-3 gap-6 flex-1 overflow-y-auto pr-4 pb-12 space-y-6">
              {moodboard.map((item, idx) => (
                  <div key={idx} className="break-inside-avoid bg-slate-900 rounded-2xl overflow-hidden relative group border border-slate-800 hover:border-slate-600 transition-all shadow-xl">
                      {item.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.url} alt="Moodboard" className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                          <div className="w-full h-64 flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-slate-800" />
                          </div>
                      )}
                      {item.note && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-24 opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <p className="text-white font-medium">{item.note}</p>
                          </div>
                      )}
                  </div>
              ))}
          </div>
      </div>
  );

  const renderPlan = () => (
      <div className="h-full w-full bg-slate-950 p-16 flex flex-col relative">
          <div className="flex items-center justify-between mb-10 border-b border-slate-800 pb-6">
               <h2 className="text-4xl font-bold text-white font-display">Proposed Deliverables</h2>
               <div className="flex gap-4">
                   <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-lg shadow-green-900/20">
                       <ThumbsUp className="w-4 h-4 mr-2" /> Approve Plan
                   </Button>
               </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 flex-1 overflow-y-auto pr-4 pb-24">
              {proposedDeliverables.map((item: any, i: number) => (
                  <div key={item._key} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden hover:bg-slate-900 hover:border-blue-900/50 transition-all group flex flex-col">
                      <div className="p-6 flex-1">
                          <div className="flex items-start justify-between mb-4">
                               <Badge variant="outline" className="bg-slate-950 border-slate-800 text-slate-400 group-hover:text-blue-400 group-hover:border-blue-900/50">
                                  #{i + 1}
                               </Badge>
                               <div className="flex gap-2">
                                   <Badge className="bg-blue-900/20 text-blue-400 border-0 hover:bg-blue-900/30 uppercase text-[10px] tracking-wider">
                                      {item.platform}
                                   </Badge>
                                   <Badge variant="outline" className="border-slate-700 text-slate-400 uppercase text-[10px] tracking-wider">
                                      {item.type}
                                   </Badge>
                               </div>
                          </div>
                          
                          <h3 className="text-xl font-bold text-white mb-3 leading-tight group-hover:text-blue-400 transition-colors">{item.title}</h3>
                          
                          {item.description && (
                              <p className="text-slate-400 text-sm leading-relaxed line-clamp-4">{item.description}</p>
                          )}
                      </div>
                      
                      {item.qualityCheck?.status === 'pass' && (
                          <div className="px-6 py-3 bg-green-900/10 border-t border-green-900/20 flex items-center text-green-500 text-xs font-medium">
                              <Check className="w-3 h-3 mr-2" /> AI Verified
                          </div>
                      )}
                  </div>
              ))}
          </div>
      </div>
  );

  // --- Print Mode ---
  if (mode === 'print') {
    return (
        <div className={cn("min-h-screen", printTheme === 'dark' ? "bg-slate-950" : "bg-white")} id="printable-strategy">
             <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    #printable-strategy, #printable-strategy * { visibility: visible; }
                    #printable-strategy { position: absolute; left: 0; top: 0; width: 100%; }
                    .no-print { display: none !important; }
                    .page-break { page-break-after: always; }
                    @page { margin: 0; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
            
            <div className={cn(
                "no-print fixed top-0 left-0 right-0 h-16 border-b px-6 flex items-center justify-between z-50 shadow-sm transition-colors",
                printTheme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
            )}>
                <div className="flex flex-col">
                    <h3 className={cn("font-medium", printTheme === 'dark' ? "text-slate-100" : "text-slate-900")}>
                        Print Preview: {campaign.title} Strategy
                    </h3>
                    <span className="text-xs text-slate-500">Tip: Enable "Background graphics" in print settings for best results</span>
                </div>
                <div className="flex gap-2">
                     <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setPrintTheme(prev => prev === 'light' ? 'dark' : 'light')}
                        className={printTheme === 'dark' ? "text-slate-400 hover:text-slate-100 hover:bg-slate-800" : ""}
                     >
                        {printTheme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                     </Button>
                     <Button variant="outline" onClick={() => window.print()} className={printTheme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white" : ""}>
                        <Printer className="w-4 h-4 mr-2" /> Print / Save PDF
                    </Button>
                    {onClose && (
                        <Button variant="ghost" onClick={onClose} className={printTheme === 'dark' ? "text-slate-400 hover:text-slate-100 hover:bg-slate-800" : ""}>Close</Button>
                    )}
                </div>
            </div>

            <div className="pt-20 pb-20 max-w-5xl mx-auto space-y-12 print:space-y-0 print:pt-0 print:pb-0">
                {pages.map((page, idx) => (
                    <div key={idx} className={cn(
                        "page-break border rounded-xl shadow-sm overflow-hidden min-h-[700px] print:border-none print:shadow-none print:min-h-screen print:h-screen print:rounded-none relative flex flex-col transition-colors",
                        printTheme === 'dark' ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
                    )}>
                        
                        {/* Slide Content */}
                        {page.type === 'slide' && (
                            <div className="flex-1 flex flex-col h-full">
                                {(() => {
                                    const slide = page.data as Slide;
                                    const imageUrl = slide.imageUrl || (slide.image ? urlFor(slide.image).url() : null);
                                    
                                    if (slide.layout === 'title') {
                                        return (
                                            <div className={cn("flex-1 flex flex-col items-center justify-center text-center p-16", printTheme === 'dark' ? "bg-slate-900" : "bg-slate-50")}>
                                                <h1 className={cn("text-6xl font-bold mb-8 font-display", printTheme === 'dark' ? "text-white" : "text-slate-900")}>{slide.title}</h1>
                                                <div className="w-24 h-1 bg-blue-600 rounded-full mb-8" />
                                                <div className={cn("prose prose-xl max-w-3xl", printTheme === 'dark' ? "prose-invert text-slate-300" : "text-slate-600")}>
                                                    <ReactMarkdown>{slide.content}</ReactMarkdown>
                                                </div>
                                            </div>
                                        );
                                    }
                                    
                                    if (slide.layout === 'split') {
                                        return (
                                            <div className="flex-1 grid grid-cols-2 gap-12 items-center p-16">
                                                <div>
                                                    <h2 className={cn("text-5xl font-bold mb-8 font-display leading-tight", printTheme === 'dark' ? "text-white" : "text-slate-900")}>{slide.title}</h2>
                                                    <div className={cn("prose prose-lg", printTheme === 'dark' ? "prose-invert text-slate-300" : "text-slate-600")}>
                                                        <ReactMarkdown>{slide.content}</ReactMarkdown>
                                                    </div>
                                                </div>
                                                <div className={cn("aspect-[3/4] rounded-3xl overflow-hidden shadow-xl", printTheme === 'dark' ? "bg-slate-800" : "bg-slate-100")}>
                                                    {imageUrl ? (
                                                        <img src={imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className={cn("w-full h-full flex items-center justify-center", printTheme === 'dark' ? "text-slate-600 bg-slate-800" : "text-slate-400 bg-slate-100")}><ImageIcon className="w-16 h-16" /></div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (slide.layout === 'image') {
                                        return (
                                            <div className="flex-1 relative h-full">
                                                {imageUrl ? (
                                                    <img src={imageUrl} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />
                                                ) : (
                                                    <div className={cn("absolute inset-0", printTheme === 'dark' ? "bg-slate-800" : "bg-slate-200")} />
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                                <div className="absolute bottom-0 left-0 right-0 p-16 text-white">
                                                    <h2 className="text-6xl font-bold mb-6 font-display">{slide.title}</h2>
                                                    <div className="prose prose-xl prose-invert max-w-4xl">
                                                        <ReactMarkdown>{slide.content}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (slide.layout === 'quote') {
                                        return (
                                            <div className={cn("flex-1 flex flex-col items-center justify-center text-center p-20", printTheme === 'dark' ? "bg-slate-900" : "bg-slate-50")}>
                                                <div className={cn("text-5xl font-serif italic mb-12 leading-relaxed max-w-5xl", printTheme === 'dark' ? "text-slate-100" : "text-slate-800")}>
                                                    <ReactMarkdown>{slide.content}</ReactMarkdown>
                                                </div>
                                                <div className="w-20 h-1 bg-blue-600 rounded-full mb-8" />
                                                <p className={cn("text-xl font-bold uppercase tracking-widest", printTheme === 'dark' ? "text-slate-400" : "text-slate-500")}>{slide.title}</p>
                                            </div>
                                        );
                                    }



                                    if (slide.layout === 'persona') {
                                        return (
                                            <div className="flex-1 flex p-0 overflow-hidden">
                                                <div className={cn("w-1/3 flex items-center justify-center relative overflow-hidden", printTheme === 'dark' ? "bg-slate-800" : "bg-blue-50")}>
                                                    {imageUrl ? (
                                                        <img 
                                                            src={imageUrl} 
                                                            alt="Persona" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-2 opacity-50">
                                                            <ImageIcon className="w-12 h-12" />
                                                            <span className="text-sm font-medium uppercase tracking-wider">Persona Image</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="w-2/3 p-16 flex flex-col justify-center">
                                                    <h3 className="text-blue-600 font-mono text-sm uppercase tracking-widest mb-4">Target Persona</h3>
                                                    <h2 className={cn("text-4xl font-bold mb-6", printTheme === 'dark' ? "text-white" : "text-slate-900")}>{slide.title}</h2>
                                                    <div className={cn("prose prose-lg", printTheme === 'dark' ? "prose-invert text-slate-300" : "text-slate-600")}>
                                                        <ReactMarkdown>{slide.content}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (slide.layout === 'mockup') {
                                        return (
                                            <div className="flex-1 flex items-center justify-center p-16">
                                                <div className="flex w-full gap-12 items-center">
                                                    <div className="flex-1">
                                                        <h2 className={cn("text-4xl font-bold mb-6", printTheme === 'dark' ? "text-white" : "text-slate-900")}>{slide.title}</h2>
                                                        <div className={cn("prose prose-xl", printTheme === 'dark' ? "prose-invert text-slate-300" : "text-slate-600")}>
                                                            <ReactMarkdown>{slide.content}</ReactMarkdown>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 flex justify-center">
                                                        <div className={cn("relative w-[240px] h-[480px] rounded-[2rem] border-4 overflow-hidden shadow-xl", printTheme === 'dark' ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200")}>
                                                            {imageUrl ? (
                                                                <img src={imageUrl} alt="Mockup" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <ImageIcon className="w-8 h-8 opacity-20" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (slide.layout === 'statement') {
                                        return (
                                            <div className="flex-1 flex flex-col items-center justify-center p-16 text-center">
                                                <div className="w-20 h-1 bg-blue-600 mx-auto mb-12" />
                                                <h2 className={cn("text-5xl md:text-6xl font-bold leading-tight mb-12", printTheme === 'dark' ? "text-white" : "text-slate-900")}>
                                                    {slide.content}
                                                </h2>
                                                <div className={cn("font-mono uppercase tracking-widest text-sm", printTheme === 'dark' ? "text-slate-400" : "text-slate-500")}>
                                                    {slide.title}
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (slide.layout === 'gallery') {
                                        return (
                                            <div className="flex-1 flex flex-col p-16">
                                                <h2 className={cn("text-5xl font-bold mb-10 border-b pb-6 font-display", printTheme === 'dark' ? "text-white border-slate-800" : "text-slate-900 border-slate-200")}>{slide.title}</h2>
                                                {slide.content && (
                                                    <div className={cn("prose prose-lg mb-8 max-w-none", printTheme === 'dark' ? "prose-invert text-slate-300" : "text-slate-600")}>
                                                        <ReactMarkdown>{slide.content}</ReactMarkdown>
                                                    </div>
                                                )}
                                                <div className="grid grid-cols-2 gap-6">
                                                    {slide.galleryImages?.map((img) => (
                                                        <div key={img._key} className={cn("aspect-video rounded-xl overflow-hidden border shadow-sm", printTheme === 'dark' ? "border-slate-800" : "border-slate-200")}>
                                                            <img src={img.url} className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (slide.layout === 'stats') {
                                        return (
                                            <div className={cn("flex-1 flex flex-col justify-center p-16", printTheme === 'dark' ? "bg-slate-900" : "bg-slate-50")}>
                                                <h2 className={cn("text-5xl font-bold mb-16 text-center font-display", printTheme === 'dark' ? "text-white" : "text-slate-900")}>{slide.title}</h2>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                                                    <div className={cn("prose prose-xl mx-auto [&>ul>li]:text-6xl [&>ul>li]:font-bold [&>ul>li]:text-blue-600 [&>ul>li]:list-none [&>ul]:p-0 [&>ul>li>strong]:block [&>ul>li>strong]:text-lg [&>ul>li>strong]:mt-2 [&>ul>li>strong]:font-normal [&>ul>li>strong]:uppercase [&>ul>li>strong]:tracking-widest", printTheme === 'dark' ? "prose-invert [&>ul>li>strong]:text-slate-400" : "[&>ul>li>strong]:text-slate-500")}>
                                                        <ReactMarkdown>{slide.content}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (slide.layout === 'grid') {
                                        return (
                                            <div className="flex-1 flex flex-col p-16">
                                                <h2 className={cn("text-5xl font-bold mb-10 border-b pb-6 font-display", printTheme === 'dark' ? "text-white border-slate-800" : "text-slate-900 border-slate-200")}>{slide.title}</h2>
                                                <div className="flex-1 grid grid-cols-2 gap-8">
                                                     <div className={cn("rounded-2xl overflow-hidden shadow-sm border", printTheme === 'dark' ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-slate-100")}>
                                                         {imageUrl ? (
                                                            <img src={imageUrl} alt="Grid" className="w-full h-full object-cover" />
                                                         ) : (
                                                            <div className="w-full h-full flex items-center justify-center"><ImageIcon className={cn("w-12 h-12", printTheme === 'dark' ? "text-slate-700" : "text-slate-300")} /></div>
                                                         )}
                                                     </div>
                                                     <div className={cn("p-8 rounded-2xl border", printTheme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200")}>
                                                         <div className={cn("prose prose-lg", printTheme === 'dark' ? "prose-invert text-slate-300" : "text-slate-600")}>
                                                             <ReactMarkdown>{slide.content}</ReactMarkdown>
                                                         </div>
                                                     </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (slide.layout === 'roadmap') {
                                        return (
                                            <div className={cn("flex-1 flex flex-col p-16", printTheme === 'dark' ? "bg-slate-900" : "bg-slate-50")}>
                                                <h2 className={cn("text-5xl font-bold mb-16 text-center font-display", printTheme === 'dark' ? "text-white" : "text-slate-900")}>{slide.title}</h2>
                                                <div className="relative flex-1 max-w-4xl mx-auto w-full">
                                                    <div className={cn("absolute left-[19px] top-0 bottom-0 w-px", printTheme === 'dark' ? "bg-slate-700" : "bg-slate-300")} />
                                                    <div className="space-y-8">
                                                        <ReactMarkdown
                                                            components={{
                                                                ul: ({children}) => <ul className="list-none p-0 m-0 space-y-8">{children}</ul>,
                                                                li: ({children}) => (
                                                                    <li className="relative grid grid-cols-[40px_1fr] gap-8 items-center">
                                                                        <div className={cn("absolute left-[11px] top-1/2 w-4 h-4 border-4 border-blue-600 rounded-full -translate-y-1/2 z-10", printTheme === 'dark' ? "bg-slate-900" : "bg-white")} />
                                                                        <div className="col-start-2">
                                                                            <div className={cn("border p-6 rounded-xl shadow-sm", printTheme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                                                                                <div className={cn("prose prose-sm", printTheme === 'dark' ? "prose-invert text-slate-300" : "text-slate-600")}>
                                                                                    {children}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </li>
                                                                )
                                                            }}
                                                        >
                                                            {slide.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (slide.layout === 'comparison') {
                                         return (
                                            <div className="flex-1 flex flex-col p-16">
                                                <h2 className={cn("text-5xl font-bold mb-10 border-b pb-6 font-display text-center", printTheme === 'dark' ? "text-white border-slate-800" : "text-slate-900 border-slate-200")}>{slide.title}</h2>
                                                <div className={cn("flex-1 p-10 rounded-3xl border", printTheme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200")}>
                                                    <div className={cn("prose prose-xl max-w-none columns-2 gap-12", printTheme === 'dark' ? "prose-invert text-slate-300" : "text-slate-700")}>
                                                        <ReactMarkdown>{slide.content}</ReactMarkdown>
                                                    </div>
                                                </div>
                                            </div>
                                         );
                                    }
                                    
                                    // Default / Other layouts
                                    return (
                                        <div className="flex-1 flex flex-col p-16">
                                            <h2 className={cn("text-5xl font-bold mb-10 pb-6 border-b font-display", printTheme === 'dark' ? "text-white border-slate-800" : "text-slate-900 border-slate-200")}>{slide.title}</h2>
                                            <div className="flex gap-12 h-full">
                                                <div className={cn("flex-1 prose prose-xl", printTheme === 'dark' ? "prose-invert text-slate-300" : "text-slate-600")}>
                                                     <ReactMarkdown>{slide.content}</ReactMarkdown>
                                                </div>
                                                {imageUrl && (
                                                    <div className={cn("w-1/3 rounded-2xl overflow-hidden h-fit shadow-lg", printTheme === 'dark' ? "bg-slate-800" : "bg-slate-100")}>
                                                        <img src={imageUrl} alt="" className="w-full h-auto" />
                                                    </div>
                                                )}
                                                {slide.galleryImages && slide.galleryImages.length > 0 && (
                                                    <div className="w-1/3 grid grid-cols-2 gap-4 h-fit">
                                                        {slide.galleryImages.map(img => (
                                                            <img key={img._key} src={img.url} className={cn("w-full aspect-square object-cover rounded-xl border shadow-sm", printTheme === 'dark' ? "border-slate-800" : "border-slate-200")} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {page.type === 'context' && (
                            <div className={cn("flex-1 p-16", printTheme === 'dark' ? "bg-slate-900" : "bg-slate-50")}>
                                <h2 className={cn("text-5xl font-bold mb-12 border-b pb-6 font-display", printTheme === 'dark' ? "text-white border-slate-800" : "text-slate-900 border-slate-200")}>Strategy Context</h2>
                                <div className="grid grid-cols-2 gap-16">
                                    <div className="space-y-12">
                                        {context.audience && (
                                            <div>
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-4">Target Audience</h3>
                                                <p className={cn("text-2xl font-light leading-relaxed", printTheme === 'dark' ? "text-slate-300" : "text-slate-700")}>{context.audience}</p>
                                            </div>
                                        )}
                                        {context.tone && (
                                            <div>
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-4">Tone of Voice</h3>
                                                <p className={cn("text-2xl font-light leading-relaxed", printTheme === 'dark' ? "text-slate-300" : "text-slate-700")}>{context.tone}</p>
                                            </div>
                                        )}
                                    </div>
                                    {context.pillars && context.pillars.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600 mb-6">Strategic Pillars</h3>
                                            <div className="space-y-4">
                                                {context.pillars.map((pillar: string, idx: number) => (
                                                    <div key={idx} className={cn("flex items-center gap-6 p-6 rounded-xl border shadow-sm", printTheme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                                                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0", printTheme === 'dark' ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-500")}>
                                                            {idx + 1}
                                                        </div>
                                                        <p className={cn("text-xl font-medium", printTheme === 'dark' ? "text-slate-200" : "text-slate-800")}>{pillar}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {page.type === 'competitors' && (
                            <div className="flex-1 p-16">
                                <h2 className={cn("text-5xl font-bold mb-10 border-b pb-6 font-display", printTheme === 'dark' ? "text-white border-slate-800" : "text-slate-900 border-slate-200")}>Competitor Landscape</h2>
                                <div className="grid grid-cols-2 gap-8">
                                    {competitors.map((comp, idx) => (
                                        <div key={idx} className={cn("border p-8 rounded-2xl", printTheme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-slate-200")}>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className={cn("font-bold text-2xl", printTheme === 'dark' ? "text-white" : "text-slate-900")}>{comp.name}</h3>
                                                {comp.url && <span className="text-sm text-slate-500">{comp.url}</span>}
                                            </div>
                                            <p className={cn("leading-relaxed whitespace-pre-wrap", printTheme === 'dark' ? "text-slate-300" : "text-slate-600")}>{comp.notes}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {page.type === 'moodboard' && (
                            <div className="flex-1 p-16">
                                <h2 className={cn("text-5xl font-bold mb-10 border-b pb-6 font-display", printTheme === 'dark' ? "text-white border-slate-800" : "text-slate-900 border-slate-200")}>Visual Direction</h2>
                                <div className="columns-3 gap-6 space-y-6">
                                    {moodboard.map((item, idx) => (
                                        <div key={idx} className={cn("break-inside-avoid rounded-xl overflow-hidden border shadow-sm", printTheme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                                            {item.url && <img src={item.url} alt="" className="w-full h-auto" />}
                                            {item.note && <div className={cn("p-4", printTheme === 'dark' ? "bg-slate-800" : "bg-white")}><p className={cn("text-sm", printTheme === 'dark' ? "text-slate-300" : "text-slate-600")}>{item.note}</p></div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {page.type === 'plan' && (
                            <div className="flex-1 p-16">
                                <h2 className={cn("text-5xl font-bold mb-10 border-b pb-6 font-display", printTheme === 'dark' ? "text-white border-slate-800" : "text-slate-900 border-slate-200")}>Proposed Deliverables</h2>
                                <div className="grid grid-cols-3 gap-6">
                                    {proposedDeliverables.map((item: any, i: number) => (
                                        <div key={item._key} className={cn("border rounded-xl overflow-hidden shadow-sm flex flex-col", printTheme === 'dark' ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200")}>
                                            <div className="p-6 flex-1">
                                                <div className="flex items-start justify-between mb-4">
                                                    <span className="text-slate-400 font-mono text-sm">#{i + 1}</span>
                                                    <div className="flex gap-2">
                                                        <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border", printTheme === 'dark' ? "bg-blue-900/30 text-blue-400 border-blue-900/50" : "bg-blue-50 text-blue-600 border-blue-100")}>{item.platform}</span>
                                                    </div>
                                                </div>
                                                <h3 className={cn("text-lg font-bold mb-2 leading-tight", printTheme === 'dark' ? "text-white" : "text-slate-900")}>{item.title}</h3>
                                                {item.description && <p className="text-slate-500 text-sm leading-relaxed line-clamp-6">{item.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer / Page Number */}
                        <div className={cn("absolute bottom-6 left-16 right-16 flex justify-between items-end border-t pt-4", printTheme === 'dark' ? "border-slate-800" : "border-slate-100")}>
                            <span className={cn("text-sm font-medium uppercase tracking-widest", printTheme === 'dark' ? "text-slate-600" : "text-slate-400")}>{campaign.title} Strategy</span>
                            <span className={cn("text-sm font-mono", printTheme === 'dark' ? "text-slate-600" : "text-slate-400")}>{idx + 1}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  }

  // --- Slideshow Mode ---
  return (
    <div className={cn("bg-slate-950 flex flex-col relative overflow-hidden font-sans", isFullscreen ? "fixed inset-0 z-50" : "h-[700px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl")}>
      
      {/* Top Bar */}
      <div className="h-16 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-50 absolute top-0 left-0 right-0">
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-900 rounded-full px-3 py-1 border border-slate-800">
                  <span className="text-xs font-mono text-slate-400">
                      {String(currentSlide + 1).padStart(2, '0')}
                  </span>
                  <span className="text-xs text-slate-600">/</span>
                  <span className="text-xs font-mono text-slate-600">
                      {String(totalSlides).padStart(2, '0')}
                  </span>
              </div>
              <h3 className="font-medium text-slate-200 truncate max-w-[200px]">{campaign.title} Strategy</h3>
          </div>

          <div className="flex items-center gap-3">
               {/* Approval Actions */}
               <div className="flex items-center gap-2 mr-4 border-r border-slate-800 pr-6">
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-950/30" onClick={() => setShowRejectDialog(true)}>
                        Request Changes
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-lg shadow-blue-900/20" onClick={handleApprove}>
                        Approve Strategy
                    </Button>
               </div>

               <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={toggleFullscreen}>
                   {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
               </Button>
               {onClose && (
                   <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white" onClick={onClose}>
                       <X className="w-5 h-5" />
                   </Button>
               )}
          </div>
      </div>

      {/* Main Slide Area */}
      <div className="flex-1 relative pt-16">
          <AnimatePresence mode="wait">
              <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-full h-full"
              >
                  {(() => {
                      const page = pages[currentSlide];
                      switch (page.type) {
                          case 'slide': return renderSlideContent(page.data as Slide);
                          case 'context': return renderStrategyContext();
                          case 'competitors': return renderCompetitors();
                          case 'moodboard': return renderMoodboard();
                          case 'plan': return renderPlan();
                          default: return null;
                      }
                  })()}
              </motion.div>
          </AnimatePresence>

          {/* Navigation Controls (Overlay) */}
          <div className="absolute inset-y-0 left-0 w-24 flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity z-40">
              <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-12 h-12 rounded-full bg-slate-900/50 backdrop-blur border border-slate-700 text-slate-200 hover:bg-white hover:text-slate-900 transition-all"
                  onClick={handlePrev}
                  disabled={currentSlide === 0}
              >
                  <ChevronLeft className="w-6 h-6" />
              </Button>
          </div>
          <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity z-40">
              <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-12 h-12 rounded-full bg-slate-900/50 backdrop-blur border border-slate-700 text-slate-200 hover:bg-white hover:text-slate-900 transition-all"
                  onClick={handleNext}
                  disabled={currentSlide === totalSlides - 1}
              >
                  <ChevronRight className="w-6 h-6" />
              </Button>
          </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
            <DialogHeader>
                <DialogTitle>Request Changes</DialogTitle>
                <DialogDescription className="text-slate-400">
                    Please let us know what needs to be adjusted. The strategy will be marked as &quot;Needs Revision&quot;.
                </DialogDescription>
            </DialogHeader>
            <Textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g., The target audience feels a bit too broad..."
                className="bg-slate-950 border-slate-800 text-slate-100 min-h-[100px]"
            />
            <DialogFooter>
                <Button variant="ghost" onClick={() => setShowRejectDialog(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
                <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
