"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Check, X, Maximize2, Minimize2, Globe, ImageIcon, MessageSquare, Send, Printer } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { approveStrategy, rejectStrategy, addStrategySlideComment } from "@/app/actions/campaigns";
import { urlFor } from "@/sanity/lib/image";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

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
  
  const router = useRouter();
  const [commentText, setCommentText] = useState("");
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

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
    setIsSubmitting(true);
    try {
        const formData = new FormData();
        formData.append("campaignId", campaign._id);
        const result = await approveStrategy(formData);
        if (result.success) {
            toast.success("Strategy Approved!");
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
    if (!confirm("Are you sure you want to request changes? This will notify your account manager.")) return;
    setIsSubmitting(true);
    try {
        const formData = new FormData();
        formData.append("campaignId", campaign._id);
        const result = await rejectStrategy(formData);
        if (result.success) {
            toast.success("Changes requested successfully");
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

  const renderSlideContent = (slide: Slide) => {
      const imageUrl = slide.imageUrl || (slide.image ? urlFor(slide.image).url() : null);

      switch (slide.layout) {
          case 'title':
              return (
                  <div className="flex flex-col items-center justify-center h-full text-center p-12">
                      <h1 className="text-5xl font-bold mb-8 text-slate-900">{slide.title}</h1>
                      <div className="prose prose-xl max-w-2xl text-slate-600">
                          <ReactMarkdown>{slide.content}</ReactMarkdown>
                      </div>
                  </div>
              );
          case 'split':
              return (
                  <div className="grid grid-cols-2 gap-12 h-full p-12">
                      <div className="flex flex-col justify-center">
                          <h2 className="text-4xl font-bold mb-6 text-slate-900">{slide.title}</h2>
                          <div className="prose prose-lg text-slate-600">
                              <ReactMarkdown>{slide.content}</ReactMarkdown>
                          </div>
                      </div>
                      <div className="bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden relative">
                          {imageUrl ? (
                              <img src={imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                          ) : (
                              <ImageIcon className="w-16 h-16 text-slate-300" />
                          )}
                      </div>
                  </div>
              );
          case 'image':
              return (
                  <div className="h-full p-12 flex flex-col">
                      <h2 className="text-4xl font-bold mb-6 text-slate-900">{slide.title}</h2>
                      <div className="flex-1 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden relative">
                          {imageUrl ? (
                              <img src={imageUrl} alt={slide.title} className="w-full h-full object-contain" />
                          ) : (
                              <ImageIcon className="w-16 h-16 text-slate-300" />
                          )}
                      </div>
                  </div>
              );
          case 'grid':
              const sections = slide.content.split(/^## /m).filter(Boolean);
              if (sections.length > 0) {
                  return (
                      <div className="p-12 h-full flex flex-col">
                          <h2 className="text-4xl font-bold mb-8 text-slate-900 border-b pb-4">{slide.title}</h2>
                          <div className="grid grid-cols-2 gap-8 flex-1 overflow-y-auto">
                              {sections.map((section, idx) => {
                                  const [title, ...body] = section.split('\n');
                                  return (
                                      <div key={idx} className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                                          <h3 className="text-xl font-bold mb-4 text-slate-800">{title}</h3>
                                          <div className="prose prose-sm text-slate-600">
                                              <ReactMarkdown>{body.join('\n')}</ReactMarkdown>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  );
              }
              // Fallback to default
              return (
                  <div className="p-12 h-full flex flex-col">
                      <h2 className="text-4xl font-bold mb-8 text-slate-900 border-b pb-4">{slide.title}</h2>
                      <div className="prose prose-lg max-w-4xl text-slate-600 flex-1 overflow-y-auto">
                          <ReactMarkdown>{slide.content}</ReactMarkdown>
                      </div>
                  </div>
              );
          default:
              return (
                  <div className="p-12 h-full flex flex-col">
                      <h2 className="text-4xl font-bold mb-8 text-slate-900 border-b pb-4">{slide.title}</h2>
                      <div className="prose prose-lg max-w-4xl text-slate-600 flex-1 overflow-y-auto">
                          <ReactMarkdown>{slide.content}</ReactMarkdown>
                      </div>
                  </div>
              );
      }
  };

  const renderStrategyContext = () => (
      <div className="p-12 h-full flex flex-col justify-center overflow-y-auto">
          <h2 className="text-4xl font-bold mb-12 text-slate-900 border-b pb-4">Strategy Context</h2>
          <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                  {context.audience && (
                      <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">Target Audience</h3>
                          <p className="text-2xl font-medium text-slate-900">{context.audience}</p>
                      </div>
                  )}
                  {context.tone && (
                      <div>
                          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">Tone of Voice</h3>
                          <p className="text-2xl font-medium text-slate-900">{context.tone}</p>
                      </div>
                  )}
              </div>
              
              {context.pillars && context.pillars.length > 0 && (
                  <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Strategic Pillars</h3>
                      <div className="space-y-4">
                          {context.pillars.map((pillar: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                                      {idx + 1}
                                  </div>
                                  <p className="text-lg text-slate-800 font-medium pt-0.5">{pillar}</p>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      </div>
  );

  const renderCompetitors = () => (
      <div className="p-12 h-full overflow-y-auto">
          <h2 className="text-4xl font-bold mb-8 text-slate-900 border-b pb-4">Competitor Landscape</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {competitors.map((comp, idx) => (
                  <Card key={idx} className="overflow-hidden">
                      <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                              <h3 className="font-bold text-xl">{comp.name}</h3>
                              {comp.url && (
                                  <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline flex items-center text-sm">
                                      <Globe className="w-4 h-4 mr-1" /> Visit
                                  </a>
                              )}
                          </div>
                          <p className="text-slate-600 whitespace-pre-wrap">{comp.notes}</p>
                      </CardContent>
                  </Card>
              ))}
          </div>
      </div>
  );

  const renderMoodboard = () => (
      <div className="p-12 h-full overflow-y-auto">
          <h2 className="text-4xl font-bold mb-8 text-slate-900 border-b pb-4">Visual Direction</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {moodboard.map((item, idx) => (
                  <div key={idx} className="aspect-square bg-slate-100 rounded-lg overflow-hidden relative group">
                      {item.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.url} alt="Moodboard" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-slate-300" />
                          </div>
                      )}
                      {item.note && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.note}
                          </div>
                      )}
                  </div>
              ))}
          </div>
      </div>
  );

  const renderPlan = () => (
      <div className="p-12 h-full overflow-y-auto">
          <h2 className="text-4xl font-bold mb-8 text-slate-900 border-b pb-4">Proposed Deliverables</h2>
          <div className="space-y-4">
              {proposedDeliverables.map((item: any) => (
                  <Card key={item._key} className="overflow-hidden">
                      <CardContent className="p-6 flex items-start justify-between gap-4">
                          <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                  <h3 className="font-bold text-xl text-slate-900">{item.title}</h3>
                                  <Badge variant="secondary" className="uppercase text-xs font-semibold tracking-wider">
                                      {item.platform}
                                  </Badge>
                                  <Badge variant="outline" className="uppercase text-xs font-semibold tracking-wider">
                                      {item.type}
                                  </Badge>
                              </div>
                              {item.description && (
                                  <p className="text-slate-600 text-lg">{item.description}</p>
                              )}
                          </div>
                      </CardContent>
                  </Card>
              ))}
          </div>
          <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100 text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Ready to proceed?</h3>
              <p className="text-blue-700">Approving this strategy will automatically create these deliverables in our production pipeline.</p>
          </div>
      </div>
  );

  if (mode === 'print') {
    return (
        <div className="bg-white min-h-screen" id="printable-strategy">
             <style jsx global>{`
                @media print {
                    /* Hide everything by default */
                    body * {
                        visibility: hidden;
                    }
                    /* Show only our printable content */
                    #printable-strategy, #printable-strategy * {
                        visibility: visible;
                    }
                    /* Position it at the top */
                    #printable-strategy {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                        margin: 0;
                        padding: 0;
                    }
                    /* Hide no-print elements inside the printable area */
                    .no-print { display: none !important; }
                    
                    /* Page breaks */
                    .page-break { page-break-after: always; }
                    
                    /* Ensure colors print correctly */
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    
                    /* Reset margins */
                    @page { margin: 0; }
                }
            `}</style>
            
            <div className="no-print fixed top-0 left-0 right-0 h-16 bg-white border-b px-6 flex items-center justify-between z-50 shadow-sm">
                <h3 className="font-medium text-slate-900">Print Preview: {campaign.title} Strategy</h3>
                <div className="flex gap-2">
                     <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" /> Print / Save PDF
                    </Button>
                    {onClose && (
                        <Button variant="ghost" onClick={onClose}>Close</Button>
                    )}
                </div>
            </div>

            <div className="pt-20 pb-20 max-w-5xl mx-auto space-y-12 print:space-y-0 print:pt-0 print:pb-0">
                {pages.map((page, idx) => (
                    <div key={idx} className="page-break border rounded-xl shadow-sm overflow-hidden min-h-[600px] bg-white print:border-none print:shadow-none print:min-h-screen print:rounded-none">
                        {(() => {
                            switch (page.type) {
                                case 'slide': return renderSlideContent(page.data as Slide);
                                case 'context': return renderStrategyContext();
                                case 'competitors': return renderCompetitors();
                                case 'moodboard': return renderMoodboard();
                                case 'plan': return renderPlan();
                                default: return null;
                            }
                        })()}
                        <div className="bg-slate-50 border-t p-2 text-center text-xs text-slate-400">
                            Page {idx + 1}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
  }

  return (
    <div className={cn("bg-slate-50 flex flex-col", isFullscreen ? "fixed inset-0 z-50" : "h-[600px] rounded-xl overflow-hidden border shadow-lg")}>
      
      {/* Toolbar */}
      <div className="h-16 bg-white border-b px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
              <Badge variant="outline" className="font-mono">
                  {currentSlide + 1} / {totalSlides}
              </Badge>
              <h3 className="font-medium text-slate-900">{campaign.title} Strategy</h3>

              {/* Comments Trigger - Only for slides */}
              {pages[currentSlide]?.type === 'slide' && (
                  <Sheet open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
                      <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="ml-4 gap-2 text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
                              <MessageSquare className="w-4 h-4" />
                              Comments
                              {((pages[currentSlide].data as Slide).comments?.length || 0) > 0 && (
                                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-blue-200 text-blue-800">
                                      {(pages[currentSlide].data as Slide).comments?.length}
                                  </Badge>
                              )}
                          </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full bg-white z-[60]">
                          <SheetHeader>
                              <SheetTitle>Slide Comments</SheetTitle>
                          </SheetHeader>
                          <div className="flex-1 overflow-y-auto py-6 space-y-4">
                              {((pages[currentSlide].data as Slide).comments || []).length === 0 ? (
                                  <div className="text-center text-slate-500 py-8">
                                      No comments yet. Be the first to add one!
                                  </div>
                              ) : (
                                  ((pages[currentSlide].data as Slide).comments || []).map((comment, i) => (
                                      <div key={i} className="bg-slate-50 p-4 rounded-lg border">
                                          <div className="flex justify-between items-start mb-2">
                                              <span className="font-semibold text-sm">{comment.author}</span>
                                              <span className="text-xs text-slate-400">
                                                  {new Date(comment.date).toLocaleDateString()}
                                              </span>
                                          </div>
                                          <p className="text-sm text-slate-700">{comment.text}</p>
                                      </div>
                                  ))
                              )}
                          </div>
                          <div className="pt-4 mt-auto border-t">
                              <div className="flex gap-2">
                                  <Input 
                                      placeholder="Add a comment..." 
                                      value={commentText}
                                      onChange={(e) => setCommentText(e.target.value)}
                                      onKeyDown={(e) => {
                                          if (e.key === 'Enter' && !e.shiftKey) {
                                              e.preventDefault();
                                              handleAddComment((pages[currentSlide].data as Slide)._key);
                                          }
                                      }}
                                  />
                                  <Button 
                                      size="icon" 
                                      disabled={isSubmitting || !commentText.trim()}
                                      onClick={() => handleAddComment((pages[currentSlide].data as Slide)._key)}
                                  >
                                      <Send className="w-4 h-4" />
                                  </Button>
                              </div>
                          </div>
                      </SheetContent>
                  </Sheet>
              )}
          </div>
          <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={() => setIsFullscreen(!isFullscreen)}>
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              {onClose && (
                  <Button size="icon" variant="ghost" onClick={onClose}>
                      <X className="w-4 h-4" />
                  </Button>
              )}
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative bg-white">
          {(() => {
              const page = pages[currentSlide];
              if (!page) return null;
              switch (page.type) {
                  case 'slide': return renderSlideContent(page.data as Slide);
                  case 'context': return renderStrategyContext();
                  case 'competitors': return renderCompetitors();
                  case 'moodboard': return renderMoodboard();
                  case 'plan': return renderPlan();
                  default: return null;
              }
          })()}
      </div>

      {/* Navigation Footer */}
      <div className="h-20 bg-white border-t px-6 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrev} disabled={currentSlide === 0}>
                  <ChevronLeft className="w-4 h-4 mr-2" /> Previous
              </Button>
              <Button variant="outline" onClick={handleNext} disabled={currentSlide === totalSlides - 1}>
                  Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
          </div>

          <div className="flex gap-3">
              <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
                  Request Changes
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={isSubmitting}>
                  {isSubmitting ? "Approving..." : "Approve Strategy"}
                  {!isSubmitting && <Check className="w-4 h-4 ml-2" />}
              </Button>
          </div>
      </div>

    </div>
  );
}
