"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, Trash2, Layout, Image as ImageIcon, Sparkles, ArrowRight, Loader2, Presentation, ArrowUp, ArrowDown, Upload, ImagePlus, Eye, MessageSquare, Check, Bold, Italic, List, Heading1, Heading2, ListOrdered, Grid2X2, Columns2, AlignLeft, BookOpen, Target, Search, Users, Palette, Printer, FolderOpen, Smartphone, User, Type, GalleryHorizontal, Globe, Briefcase, Info, Activity, Newspaper, Layers, Minimize2, Maximize2, RefreshCcw, AlertTriangle, CheckCircle, ShieldCheck, MousePointer2, XCircle, X, Download } from "lucide-react";
import { toast } from "sonner";
import { updateCampaignDeck, uploadMoodboardImage, submitStrategy, publishToClient, resolveStrategySlideComment, generateDeliverablePlan, generateContextSuggestions, uploadClientAsset, deleteClientAsset, updateClientAssetTags } from "@/app/actions/campaigns";
import { AnimatePresence, motion } from "framer-motion";

import { analyzeUrl, generateSlideContent, refreshCompetitorFeed, checkDeliverableQuality } from "@/app/actions/research-tools";
import { generateDeliverablesFromStrategy } from "@/app/actions/campaign-automation";
import { AIResearchAssistant } from "@/components/dashboard/employee/ai-research-assistant";
import { StrategyPresentation } from "@/components/flow/client/strategy-presentation";
import ReactMarkdown from "react-markdown";
import { urlFor } from "@/sanity/lib/image";
import { PersonaSlide, MockupSlide, StatementSlide, GallerySlide } from "@/components/flow/manager/luxury-slide-templates";

export interface Slide {
  _key: string;
  title: string;
  layout: "title" | "text" | "split" | "grid" | "image" | "quote" | "stats" | "comparison" | "roadmap" | "persona" | "mockup" | "statement" | "gallery";
  content: string;
  notes?: string;
  imageUrl?: string;
  imageAssetId?: string;
  galleryImages?: Array<{
      _key: string;
      url: string;
      assetId?: string;
  }>;
  comments?: Array<{
    _key: string;
    text: string;
    author: string;
    date: string;
    resolved: boolean;
  }>;
}

interface ProposedDeliverable {
  _key: string;
  title: string;
  type: string;
  platform: string;
  description: string;
  visualDirection?: string;
  hook?: string;
  script?: string;
  caption?: string;
  hashtags?: string[];
  assets?: any[];
  references?: string[];
  prediction?: {
    score: number;
    advice: string[];
  };
  qualityCheck?: {
    status: "approved" | "needs_improvement";
    score: number;
    missing_elements: string[];
    editor_clarity_score: number;
    feedback: string;
  };
}

const SLIDE_TEMPLATES = [
    {
        id: "default",
        label: "Standard Slide",
        icon: AlignLeft,
        slide: {
            title: "New Slide",
            layout: "text" as const,
            content: "## Key Points\n- Point 1\n- Point 2"
        }
    },
    {
        id: "split",
        label: "Image & Text",
        icon: Columns2,
        slide: {
            title: "Visual Slide",
            layout: "split" as const,
            content: "## Description\nAdd details here..."
        }
    },
    {
        id: "swot",
        label: "SWOT Analysis",
        icon: Grid2X2,
        slide: {
            title: "SWOT Analysis",
            layout: "grid" as const,
            content: "## Strengths\n- Strong Brand\n- Loyal Customers\n\n## Weaknesses\n- Limited Budget\n- New Market\n\n## Opportunities\n- Expansion\n- Partnerships\n\n## Threats\n- Competitors\n- Regulations"
        }
    },
    {
        id: "quote",
        label: "Quote Slide",
        icon: MessageSquare,
        slide: {
            title: "Key Insight",
            layout: "quote" as const,
            content: "> \"Marketing is no longer about the stuff that you make, but about the stories you tell.\"\n\n**- Seth Godin**"
        }
    },
    {
        id: "stats",
        label: "Big Stats",
        icon: Heading1,
        slide: {
            title: "Performance",
            layout: "stats" as const,
            content: "## 150%\nGrowth in Q1\n\n## 24k\nNew Users\n\n## $1.2M\nRevenue Generated"
        }
    },
    {
        id: "comparison",
        label: "Comparison",
        icon: Columns2,
        slide: {
            title: "Us vs Them",
            layout: "comparison" as const,
            content: "## Us\n- Innovative\n- Fast\n- Reliable\n\n## Them\n- Traditional\n- Slow\n- Complex"
        }
    },
    {
        id: "timeline",
        label: "Roadmap Timeline",
        icon: ListOrdered,
        slide: {
            title: "Project Roadmap",
            layout: "roadmap" as const,
            content: "## Q1: Foundation\n- Research & Discovery\n- Strategy Definition\n\n## Q2: Implementation\n- Content Production\n- Channel Launch\n\n## Q3: Growth\n- Performance Optimization\n- Scale Up"
        }
    },
    {
        id: "persona",
        label: "Persona Profile",
        icon: User,
        slide: {
            title: "Target Audience",
            layout: "persona" as const,
            content: "## The Trendsetter\n- **Age:** 18-24\n- **Interests:** Fashion, Sustainability\n- **Pain Points:** Fast fashion guilt, High prices"
        }
    },
    {
        id: "mockup",
        label: "Mobile Mockup",
        icon: Smartphone,
        slide: {
            title: "Content Concept",
            layout: "mockup" as const,
            content: "## Viral Hook\nDescribe the visual hook here...\n\n## Caption\nWrite the caption here..."
        }
    },
    {
        id: "statement",
        label: "Visual Statement",
        icon: Type,
        slide: {
            title: "Core Philosophy",
            layout: "statement" as const,
            content: "# Less is more.\nSimplicity is the ultimate sophistication."
        }
    },
    {
        id: "gallery",
        label: "Image Gallery",
        icon: GalleryHorizontal,
        slide: {
            title: "Visual Mood",
            layout: "gallery" as const,
            content: "## Mood\nDescribe the aesthetic here..."
        }
    }
];

const MarkdownToolbar = ({ onInsert }: { onInsert: (text: string, wrap?: string) => void }) => {
    return (
        <div className="flex items-center gap-1 mb-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-800 w-fit">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onInsert("**", "**")} title="Bold">
                <Bold className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onInsert("_", "_")} title="Italic">
                <Italic className="w-3 h-3" />
            </Button>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onInsert("# ")} title="Heading 1">
                <Heading1 className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onInsert("## ")} title="Heading 2">
                <Heading2 className="w-3 h-3" />
            </Button>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onInsert("- ")} title="Bullet List">
                <List className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onInsert("1. ")} title="Numbered List">
                <ListOrdered className="w-3 h-3" />
            </Button>
        </div>
    );
};

interface CampaignStrategyTabProps {
  campaign: any;
  user?: any;
}

export function CampaignStrategyTab({ campaign }: CampaignStrategyTabProps) {
    // Initial state from campaign or default
    const [status, setStatus] = useState(campaign.strategyDeck?.status || "drafting");

    const [slides, setSlides] = useState<Slide[]>(
        campaign.strategyDeck?.slides?.map((s: any) => ({
            ...s,
            imageUrl: s.image ? urlFor(s.image).url() : s.imageUrl,
            imageAssetId: s.image?.asset?._ref,
            galleryImages: s.galleryImages?.map((g: any) => ({
                _key: g._key,
                url: urlFor(g).url(),
                assetId: g.asset?._ref
            })) || []
        })) || [
            { _key: "1", title: "Campaign Strategy", layout: "title", content: `# ${campaign.title}\n\nPrepared for ${campaign.client.name}` }
        ]
    );
  const [competitors, setCompetitors] = useState<any[]>(campaign.strategyDeck?.competitors || []);
  const [moodboard, setMoodboard] = useState<any[]>(
    campaign.strategyDeck?.moodboard?.map((m: any) => ({
        ...m,
        url: m.url || (m.image ? urlFor(m.image).url() : ""),
        assetId: m.image?.asset?._ref
    })) || []
  );
  const [proposedDeliverables, setProposedDeliverables] = useState<ProposedDeliverable[]>(
      campaign.strategyDeck?.proposedDeliverables || []
  );
  const [clientAssets, setClientAssets] = useState<any[]>(campaign.client.brandAssets || []);

  // Strategy Context State
  const [targetAudience, setTargetAudience] = useState(campaign.strategyDeck?.targetAudience || "");
  const [toneOfVoice, setToneOfVoice] = useState(campaign.strategyDeck?.toneOfVoice || "");
  const [strategicPillars, setStrategicPillars] = useState<string>((campaign.strategyDeck?.strategicPillars || []).join('\n'));

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [generatingDeliverables, setGeneratingDeliverables] = useState(false);
  const [planError, setPlanError] = useState("");
  const [activeTab, setActiveTab] = useState("plan");
  const [selectedDeliverableIndex, setSelectedDeliverableIndex] = useState<number | null>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // AI Double-Check All Workflow
  const handleDoubleCheckAll = async (itemsToCheck: ProposedDeliverable[] | null = null) => {
      const targetItems = itemsToCheck || proposedDeliverables;
      if (!targetItems.length) return;
      
      setIsCheckingAll(true);
      const toastId = toast.loading("AI is double-checking all deliverables...");

      try {
          const newDeliverables = [...targetItems];
          const batchSize = 3; // Process in batches to avoid rate limits
          
          for (let i = 0; i < targetItems.length; i += batchSize) {
              const batch = targetItems.slice(i, i + batchSize);
              const batchPromises = batch.map(async (item, batchIdx) => {
                  const actualIdx = i + batchIdx;
                  // Skip if already passed? Maybe not, force re-check.
                  const res = await checkDeliverableQuality(item);
                  return { index: actualIdx, result: res };
              });
              
              const results = await Promise.all(batchPromises);
              
              results.forEach(({ index, result }) => {
                if (result.success && result.qualityCheck) {
                    newDeliverables[index] = {
                        ...newDeliverables[index],
                        qualityCheck: result.qualityCheck
                    };
                }
            });
            
            // Progressive update for better UX
            setProposedDeliverables([...newDeliverables]);
        }
        
        const passedCount = newDeliverables.filter(d => d.qualityCheck?.status === 'approved').length;
        toast.success(`Double-check complete: ${passedCount}/${targetItems.length} approved.`);
      } catch (e) {
          console.error(e);
          toast.error("Error running double-check");
      } finally {
          setIsCheckingAll(false);
          toast.dismiss(toastId);
      }
  };

  // Debounced Save
  useEffect(() => {
       if (!hasUnsavedChanges) return;

       const timer = setTimeout(() => {
           handleSave();
           setHasUnsavedChanges(false);
       }, 2000);

       return () => clearTimeout(timer);
   }, [hasUnsavedChanges, slides, competitors, moodboard, proposedDeliverables, targetAudience, toneOfVoice, strategicPillars]);
   
   const [researchUrl, setResearchUrl] = useState("");
   const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [extractedImages, setExtractedImages] = useState<string[]>([]);
  const [analyzingCompetitor, setAnalyzingCompetitor] = useState<number | null>(null);
  const [refreshingFeed, setRefreshingFeed] = useState<Record<number, boolean>>({});
  const [checkingQuality, setCheckingQuality] = useState<Record<number, boolean>>({});
  const slideFileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [newComment, setNewComment] = useState("");
  const assetInputRef = useRef<HTMLInputElement>(null);
  const [viewAsset, setViewAsset] = useState<any>(null);
  const [assetSearch, setAssetSearch] = useState("");
  const [assetFilter, setAssetFilter] = useState("all");
  const [newTag, setNewTag] = useState("");

  const handleAddTag = async () => {
      if (!viewAsset || !newTag.trim()) return;
      
      const currentTags = viewAsset.tags || [];
      if (currentTags.includes(newTag.trim())) {
          setNewTag("");
          return;
      }

      const updatedTags = [...currentTags, newTag.trim()];
      
      // Optimistic update
      const updatedAsset = { ...viewAsset, tags: updatedTags };
      setViewAsset(updatedAsset);
      setClientAssets(prev => prev.map(a => a._key === viewAsset._key ? updatedAsset : a));
      setNewTag("");

      const clientId = campaign.client._id || campaign.client._ref;
      const res = await updateClientAssetTags(clientId, viewAsset._key, updatedTags);
      
      if (!res.success) {
          toast.error("Failed to add tag");
          // Revert
          const revertedAsset = { ...viewAsset, tags: currentTags };
          setViewAsset(revertedAsset);
          setClientAssets(prev => prev.map(a => a._key === viewAsset._key ? revertedAsset : a));
      }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
      if (!viewAsset) return;
      
      const currentTags = viewAsset.tags || [];
      const updatedTags = currentTags.filter((t: string) => t !== tagToRemove);
      
      // Optimistic update
      const updatedAsset = { ...viewAsset, tags: updatedTags };
      setViewAsset(updatedAsset);
      setClientAssets(prev => prev.map(a => a._key === viewAsset._key ? updatedAsset : a));

      const clientId = campaign.client._id || campaign.client._ref;
      const res = await updateClientAssetTags(clientId, viewAsset._key, updatedTags);
      
      if (!res.success) {
          toast.error("Failed to remove tag");
          // Revert
          const revertedAsset = { ...viewAsset, tags: currentTags };
          setViewAsset(revertedAsset);
          setClientAssets(prev => prev.map(a => a._key === viewAsset._key ? revertedAsset : a));
      }
  };

  const filteredAssets = clientAssets.filter(asset => {
      const matchesSearch = (asset.title || asset.name || "").toLowerCase().includes(assetSearch.toLowerCase());
      const matchesFilter = assetFilter === "all" || (asset.type || "image") === assetFilter;
      return matchesSearch && matchesFilter;
  });
  
  const [showMoodboardCanvas, setShowMoodboardCanvas] = useState(false);
  const [isMoodboardFullScreen, setIsMoodboardFullScreen] = useState(false);
  // Mock collaborators for "Live" feel
  const collaborators = [
      { name: "Sarah (Client)", color: "bg-blue-500", x: 200, y: 300 },
      { name: "Mike (Editor)", color: "bg-green-500", x: 600, y: 150 },
  ];

  async function handleAssetUpload(e: React.ChangeEvent<HTMLInputElement>) {
      if (!e.target.files?.length) return;
      const file = e.target.files[0];
      const toastId = toast.loading("Uploading asset...");
      
      try {
          const formData = new FormData();
          formData.append("file", file);
          const clientId = campaign.client._id || campaign.client._ref;
          
          if (!clientId) {
              throw new Error("Client ID not found");
          }
          
          formData.append("clientId", clientId);

          const res = await uploadClientAsset(formData);
          
          if (res.success && res.asset) {
              // If we are in moodboard tab, add to moodboard
              if (activeTab === "moodboard") {
                  const newMoodboardItem = {
                      _key: Math.random().toString(36).slice(2),
                      type: "image",
                      url: res.asset.url,
                      assetId: res.asset.file.asset._ref
                  };
                  setMoodboard(prev => [...prev, newMoodboardItem]);
                  toast.success("Added to Moodboard");
              } else {
                  // Default behavior: just add to assets list (which is also updated by uploadClientAsset in backend)
                  setClientAssets(prev => [...prev, res.asset]);
                  toast.success("Asset uploaded successfully");
              }
          } else {
              toast.error(res.error || "Upload failed");
          }
      } catch (error) {
          console.error("Asset upload error:", error);
          toast.error("Error uploading asset");
      } finally {
          toast.dismiss(toastId);
          if (assetInputRef.current) assetInputRef.current.value = "";
      }
  }

  async function handlePostComment() {
      if (!newComment.trim() || !activeSlide) return;
      const toastId = toast.loading("Posting comment...");
      
      // Mocking comment addition since we don't have a backend action for it yet in the imports
      // But we do have 'resolveStrategySlideComment', so maybe we have 'addStrategySlideComment'?
      // I'll simulate it locally for now as requested "functionality"
      
      const newCommentObj = {
          _key: Math.random().toString(36).slice(2),
          text: newComment,
          author: "You", // In real app, get from session
          date: new Date().toISOString(),
          resolved: false
      };
      
      const currentComments = activeSlide.comments || [];
      updateSlide(activeSlide._key, { comments: [...currentComments, newCommentObj] });
      
      setNewComment("");
      toast.success("Comment added");
      toast.dismiss(toastId);
  }

  const handleConvertToDeliverables = async () => {
    setGeneratingDeliverables(true);
    try {
        const result = await generateDeliverablesFromStrategy(campaign._id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(`Successfully created ${result.count} deliverables!`);
            setShowConvertDialog(false);
        }
    } catch (error) {
        toast.error("Failed to generate deliverables");
    } finally {
        setGeneratingDeliverables(false);
    }
  };

  const activeSlide = slides[activeSlideIndex];
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Competitor Feed
  async function handleRefreshFeed(index: number, name: string) {
      if (!name) return;
      setRefreshingFeed(prev => ({ ...prev, [index]: true }));
      try {
          const res = await refreshCompetitorFeed(name);
          if (res.success && res.feed) {
              updateCompetitor(index, 'feed', res.feed);
              toast.success("Feed updated");
          } else {
              toast.error("Failed to fetch feed");
          }
      } catch (e) {
          toast.error("Error fetching feed");
      } finally {
          setRefreshingFeed(prev => ({ ...prev, [index]: false }));
      }
  }

  // Prediction Logic
  // Removed unused prediction logic


  async function handleQualityCheck(index: number) {
      const deliverable = proposedDeliverables[index];
      setCheckingQuality(prev => ({ ...prev, [index]: true }));
      try {
          const res = await checkDeliverableQuality(deliverable);
          if (res.success && res.qualityCheck) {
              updateProposedDeliverable(index, 'qualityCheck', res.qualityCheck);
              if (res.qualityCheck.status === 'approved') {
                  toast.success("Deliverable passed quality check!");
              } else {
                  toast.warning("Issues found. Please review.");
              }
          } else {
              toast.error("Failed to check quality");
          }
      } catch (e) {
          toast.error("Error checking quality");
      } finally {
          setCheckingQuality(prev => ({ ...prev, [index]: false }));
      }
  }

  const addSlideWithTemplate = (templateId: string) => {
    const template = SLIDE_TEMPLATES.find(t => t.id === templateId)?.slide || SLIDE_TEMPLATES[0].slide;
    const newSlide: Slide = {
        _key: Math.random().toString(36).slice(2, 11),
        title: template.title,
        layout: template.layout,
        content: template.content
    };
    setSlides([...slides, newSlide]);
    setActiveSlideIndex(slides.length);
    setHasUnsavedChanges(true);
  };

  const handleMarkdownInsert = (text: string, wrap?: string) => {
      if (!editorRef.current) return;
      
      const textarea = editorRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      let newText = "";
      let newCursorPos = 0;

      if (wrap) {
          const selection = value.substring(start, end);
          newText = value.substring(0, start) + wrap + selection + wrap + value.substring(end);
          newCursorPos = end + wrap.length * 2;
      } else {
          newText = value.substring(0, start) + text + value.substring(end);
          newCursorPos = start + text.length;
      }

      updateSlide(activeSlide._key, { content: newText });
      
      setTimeout(() => {
          if (editorRef.current) {
              editorRef.current.focus();
              editorRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
      }, 0);
  };

  // Helper to get image URL for preview (handles both local upload state and Sanity image object)
  // Note: For existing Sanity images, we would ideally use urlFor(source).url() but we need the source object.
  // In our mapped state, we might have lost the full asset ref if we didn't map it carefully.
  // For this iteration, we rely on 'imageUrl' being populated either during load or upload.

  async function handleSlideImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeSlide) return;

    const formData = new FormData();
    formData.append("file", file);
    const toastId = toast.loading("Uploading slide image...");

    try {
        const res = await uploadMoodboardImage(formData);
        if (res.success && res.url) {
            updateSlide(activeSlide._key, { 
                imageUrl: res.url, 
                imageAssetId: res.assetId 
            });
            toast.success("Image uploaded");
        } else {
            toast.error("Upload failed");
        }
    } catch (e) {
        toast.error("Upload error");
    } finally {
        toast.dismiss(toastId);
        if (slideFileInputRef.current) slideFileInputRef.current.value = "";
    }
  }

  async function handleDirectImageUpload(file: File) {
    if (!activeSlide) return;

    const formData = new FormData();
    formData.append("file", file);
    const toastId = toast.loading("Uploading slide image...");

    try {
        const res = await uploadMoodboardImage(formData);
        if (res.success && res.url) {
            updateSlide(activeSlide._key, { 
                imageUrl: res.url, 
                imageAssetId: res.assetId 
            });
            toast.success("Image uploaded");
        } else {
            toast.error("Upload failed");
        }
    } catch (e) {
        toast.error("Upload error");
    } finally {
        toast.dismiss(toastId);
    }
  }

  async function handleDirectGalleryUpload(files: FileList) {
      if (!activeSlide || !files.length) return;
      const toastId = toast.loading(`Uploading ${files.length} images...`);

      try {
          const newImages: { _key: string; url: string; assetId?: string }[] = [];
          
          for (let i = 0; i < files.length; i++) {
              const file = files[i];
              const formData = new FormData();
              formData.append("file", file);
              const res = await uploadMoodboardImage(formData);
              if (res.success && res.url && res.assetId) {
                  newImages.push({
                      _key: Math.random().toString(36).slice(2),
                      url: res.url,
                      assetId: res.assetId
                  });
              }
          }

          if (newImages.length > 0) {
              const currentImages = activeSlide.galleryImages || [];
              updateSlide(activeSlide._key, { galleryImages: [...currentImages, ...newImages] });
              toast.success(`Added ${newImages.length} images to gallery`);
          }
      } catch (e) {
          toast.error("Upload error");
      } finally {
          toast.dismiss(toastId);
      }
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
      if (!e.target.files || !e.target.files.length || !activeSlide) return;
      const files = Array.from(e.target.files);
      const toastId = toast.loading(`Uploading ${files.length} images...`);

      try {
          const newImages: { _key: string; url: string; assetId?: string }[] = [];
          
          for (const file of files) {
              const formData = new FormData();
              formData.append("file", file);
              const res = await uploadMoodboardImage(formData);
              if (res.success && res.url && res.assetId) {
                  newImages.push({
                      _key: Math.random().toString(36).slice(2),
                      url: res.url,
                      assetId: res.assetId
                  });
              }
          }

          if (newImages.length > 0) {
              const currentImages = activeSlide.galleryImages || [];
              updateSlide(activeSlide._key, { 
                  galleryImages: [...currentImages, ...newImages] 
              });
              toast.success(`Added ${newImages.length} images to gallery`);
          } else {
              toast.error("Failed to upload images");
          }
      } catch (e) {
          toast.error("Upload error");
      } finally {
          toast.dismiss(toastId);
          if (galleryInputRef.current) galleryInputRef.current.value = "";
      }
  }

  async function handleAnalyzeCompetitor(index: number, url: string) {
    if (!url) return;
    setAnalyzingCompetitor(index);
    try {
        const res: any = await analyzeUrl(url);
        if (res.success && res.analysis) {
            updateCompetitor(index, 'notes', res.analysis);
            toast.success("Competitor analyzed");
        } else {
            toast.error(res.error || "Analysis failed");
        }
    } catch (e) {
        toast.error("Error analyzing competitor");
    } finally {
        setAnalyzingCompetitor(null);
    }
  }

  async function handleMoodboardUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const toastId = toast.loading("Uploading image...");

    try {
        const res = await uploadMoodboardImage(formData);
        if (res.success && res.url) {
            setMoodboard([...moodboard, { 
                _key: Math.random().toString(36), 
                type: "image", 
                url: res.url, 
                assetId: res.assetId,
                note: file.name 
            }]);
            toast.success("Image uploaded");
            setHasUnsavedChanges(true);
        } else {
            toast.error("Upload failed");
        }
    } catch (err) {
        toast.error("Upload error");
    } finally {
        toast.dismiss(toastId);
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const updateSlide = (key: string, updates: Partial<Slide>) => {
    setSlides(slides.map(s => s._key === key ? { ...s, ...updates } : s));
    setHasUnsavedChanges(true);
  };

  const removeSlide = (index: number) => {
    if (slides.length <= 1) return;
    const newSlides = [...slides];
    newSlides.splice(index, 1);
    setSlides(newSlides);
    if (activeSlideIndex >= newSlides.length) setActiveSlideIndex(newSlides.length - 1);
    setHasUnsavedChanges(true);
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === slides.length - 1) return;

    const newSlides = [...slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
    
    setSlides(newSlides);
    setActiveSlideIndex(targetIndex);
    setHasUnsavedChanges(true);
  };

  // Competitor Actions
  const addCompetitor = () => {
    setCompetitors([...competitors, { _key: Math.random().toString(36), name: "New Competitor", url: "", notes: "" }]);
    setHasUnsavedChanges(true);
  };

  const updateCompetitor = (index: number, field: string, value: any) => {
    const newCompetitors = [...competitors];
    newCompetitors[index] = { ...newCompetitors[index], [field]: value };
    setCompetitors(newCompetitors);
    setHasUnsavedChanges(true);
  };

  const removeCompetitor = (index: number) => {
    const newCompetitors = [...competitors];
    newCompetitors.splice(index, 1);
    setCompetitors(newCompetitors);
    setHasUnsavedChanges(true);
  };

  const generateCompetitorSlide = () => {
      const headerRow = `| Feature | ${campaign.client.name} | ${competitors.map(c => c.name || "Competitor").join(" | ")} |`;
      const separatorRow = `|---|---|${competitors.map(() => "---|").join("")}`;
      const content = `${headerRow}\n${separatorRow}\n| USP | [Your USP] | ${competitors.map(() => "[Competitor USP]").join(" | ")} |\n| Pricing | [Your Pricing] | ${competitors.map(() => "[Price]").join(" | ")} |\n| Strengths | [Your Strengths] | ${competitors.map(() => "[Strength]").join(" | ")} |`;
      
      const newSlide: Slide = {
          _key: Math.random().toString(36).slice(2, 11),
          title: "Competitor Analysis",
          layout: "text",
          content: content
      };
      setSlides([...slides, newSlide]);
      setActiveSlideIndex(slides.length);
      setHasUnsavedChanges(true);
      toast.success("Comparison slide added");
  };

  // Deliverable Actions
  const addProposedDeliverable = () => {
    setProposedDeliverables([
        ...proposedDeliverables, 
        { 
            _key: Math.random().toString(36).slice(2, 11), 
            title: "New Deliverable", 
            type: "static_post", 
            platform: "instagram", 
            description: "" 
        }
    ]);
    setHasUnsavedChanges(true);
  };

  const updateProposedDeliverable = (index: number, field: string, value: any) => {
    const newDeliverables = [...proposedDeliverables];
    newDeliverables[index] = { ...newDeliverables[index], [field]: value };
    setProposedDeliverables(newDeliverables);
    setHasUnsavedChanges(true);
  };

  const removeProposedDeliverable = (index: number) => {
    const newDeliverables = [...proposedDeliverables];
    newDeliverables.splice(index, 1);
    setProposedDeliverables(newDeliverables);
    setHasUnsavedChanges(true);
  };

  // Moodboard Actions - Removed unused item removal
  // const removeMoodboardItem = (index: number) => { ... }



  const toggleAssetSelection = (deliverableIndex: number, asset: any) => {
      const deliverable = proposedDeliverables[deliverableIndex];
      const currentAssets = deliverable.assets || [];
      const exists = currentAssets.some((a: any) => a._key === asset._key);

      let newAssets;
      if (exists) {
          newAssets = currentAssets.filter((a: any) => a._key !== asset._key);
      } else {
          newAssets = [...currentAssets, asset];
      }

      updateProposedDeliverable(deliverableIndex, 'assets', newAssets as any);
  };



  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    setPlanError("");
    
    // Gather Context
    const context = {
        strategy: slides.map(s => s.content).join("\n"),
        research: [], 
        competitors: competitors,
        moodboard: moodboard,
        targetAudience,
        toneOfVoice,
        strategicPillars,
        clientAssets: campaign.client.brandAssets || []
    };

    const res = await generateDeliverablePlan(context);

    if (res.success && res.deliverables) {
        const newItems = res.deliverables.map((d: any) => {
            // Map suggestedAssetIndices to actual asset objects
            const mappedAssets = d.suggestedAssetIndices?.map((index: number) => 
                campaign.client.brandAssets?.[index]
            ).filter(Boolean) || [];

            return {
                _key: Math.random().toString(36).slice(2, 11),
                ...d,
                assets: mappedAssets
            };
        });
        
        const updatedList = [...proposedDeliverables, ...newItems];
        setProposedDeliverables(updatedList);
        setHasUnsavedChanges(true);
        toast.success("AI generated a plan! Starting quality check...");
        
        // Trigger Double Check on the updated list
        // We use setTimeout to allow the state to settle/render first so user sees the items
        setTimeout(() => {
            handleDoubleCheckAll(updatedList);
        }, 500);

    } else {
        setPlanError(res.message || "Failed to generate plan");
        toast.error(res.message || "Plan generation failed");
    }

    setIsGeneratingPlan(false);
  };

  async function handleSave() {
    setIsSaving(true);
    
    // Format for Sanity
    const formattedSlides = slides.map(s => ({
        ...s,
        image: s.imageAssetId ? {
            _type: "image",
            asset: { _type: "reference", _ref: s.imageAssetId }
        } : undefined,
        galleryImages: s.galleryImages?.map((g: any) => ({
             _type: "image",
             _key: g._key,
             asset: { _type: "reference", _ref: g.assetId }
        })),
    }));

    const formattedMoodboard = moodboard.map(m => ({
        ...m,
        image: m.assetId ? {
             _type: "image",
            asset: { _type: "reference", _ref: m.assetId }
        } : undefined
    }));

    const formattedDeliverables = proposedDeliverables.map(d => ({
        ...d,
        assets: d.assets?.map((a: any) => {
             if (a.assetId) {
                 return {
                     _type: "image",
                     _key: a._key, 
                     asset: { _type: "reference", _ref: a.assetId }
                 };
             }
             return null;
        }).filter(Boolean)
    }));

    const deck = {
      slides: formattedSlides,
      competitors,
      moodboard: formattedMoodboard,
      proposedDeliverables: formattedDeliverables,
      targetAudience,
      toneOfVoice,
      strategicPillars: strategicPillars.split('\n').filter(p => p.trim()),
      status: campaign.strategyDeck?.status || "draft"
    };

    const formData = new FormData();
    formData.append("campaignId", campaign._id);
    formData.append("deck", JSON.stringify(deck));

    try {
      const result = await updateCampaignDeck(formData);
      if (result.success) {
        toast.success("Strategy Deck saved successfully");
      } else {
        toast.error("Failed to save deck");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit() {
      setIsSaving(true);
      
      // Save content first
      await handleSave();

      const formData = new FormData();
      formData.append("campaignId", campaign._id);
      
      try {
          const res = await submitStrategy(formData);
          if (res.success) {
              setStatus("internal_review"); // Update local state to prevent overwrite
              toast.success("Submitted for review");
              setShowSubmitDialog(false);
          } else {
              toast.error("Failed to submit");
          }
      } catch (e) {
          toast.error("Error submitting");
      } finally {
          setIsSaving(false);
      }
  }

  async function handlePublish() {
      if (!confirm("Publish to Client? They will be able to view the deck.")) return;
      setIsSaving(true);
      await handleSave();
      
      const formData = new FormData();
      formData.append("campaignId", campaign._id);
      
      try {
          const res = await publishToClient(formData);
          if (res.success) {
              setStatus("client_review");
              toast.success("Published to Client");
          } else {
              toast.error(res.error || "Failed to publish");
          }
      } catch (e) {
          toast.error("Error publishing");
      } finally {
          setIsSaving(false);
      }
  }

  const [isGeneratingContext, setIsGeneratingContext] = useState(false);
  const [contextSuggestions, setContextSuggestions] = useState<{
      targetAudience?: string;
      targetAudienceOptions?: string[];
      toneOfVoice?: string;
      toneOfVoiceOptions?: string[];
      pillars?: string;
      pillarsOptions?: string[];
  } | null>(null);

  async function handleGenerateContextSuggestions() {
      setIsGeneratingContext(true);
      try {
          const res = await generateContextSuggestions(campaign.client.name, campaign.client.industry || "General", {
              targetAudience,
              toneOfVoice,
              strategicPillars
          });
          if (res && !res.error) {
              // Ensure pillars is string if it comes as array
              const suggestions = {
                  ...res,
                  pillars: Array.isArray(res.pillars) ? res.pillars.join('\n') : res.pillars
              };
              setContextSuggestions(suggestions);
              toast.success("AI Suggestions generated");
              
              // Only auto-fill if empty, otherwise just show suggestions
              if (!targetAudience && suggestions.targetAudience) setTargetAudience(suggestions.targetAudience);
              if (!toneOfVoice && suggestions.toneOfVoice) setToneOfVoice(suggestions.toneOfVoice);
              if (strategicPillars.length === 0 && suggestions.pillars) setStrategicPillars(suggestions.pillars);
              
              setHasUnsavedChanges(true);
          } else {
              toast.error("Failed to generate suggestions");
          }
      } catch (e) {
          toast.error("Error generating suggestions");
      } finally {
          setIsGeneratingContext(false);
      }
  }

  async function handleDeleteAsset(assetKey: string) {
      if (!confirm("Are you sure you want to delete this asset?")) return;
      
      const clientId = campaign.client._id || campaign.client._ref;
      const toastId = toast.loading("Deleting asset...");
      
      try {
          const res = await deleteClientAsset(clientId, assetKey);
          if (res.success) {
              setClientAssets(prev => prev.filter(a => a._key !== assetKey));
              toast.success("Asset deleted");
              setViewAsset(null);
          } else {
              toast.error(res.error || "Delete failed");
          }
      } catch (e) {
          toast.error("Error deleting asset");
      } finally {
          toast.dismiss(toastId);
      }
  }

  async function handleAnalyzeUrl() {
    if (!researchUrl) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setExtractedImages([]);
    try {
        const res: any = await analyzeUrl(researchUrl);
        if (res.success && res.analysis) {
            setAnalysisResult(res.analysis);
            setExtractedImages(res.images || []);
            toast.success("Analysis complete");
        } else {
            toast.error(res.error || "Failed to analyze");
        }
    } catch (e) {
        toast.error("Error analyzing URL");
    } finally {
        setIsAnalyzing(false);
    }
  }

  async function handleGenerateContent() {
      if (!activeSlide) return;
      const toastId = toast.loading("Generating content...");
      const res = await generateSlideContent(activeSlide.title, {
          client: campaign.client.name,
          industry: campaign.client.industry,
          goals: campaign.client.creativeGoal
      });
      
      toast.dismiss(toastId);
      
      if (res.success && res.content) {
          updateSlide(activeSlide._key, { content: res.content });
          toast.success("Content generated");
      } else {
          toast.error("Failed to generate content");
      }
  }

  async function handleResolveComment(slideKey: string, commentKey: string) {
      const formData = new FormData();
      formData.append("campaignId", campaign._id);
      formData.append("slideKey", slideKey);
      formData.append("commentKey", commentKey);

      const toastId = toast.loading("Resolving comment...");
      try {
          const res = await resolveStrategySlideComment(formData);
          if (res.success) {
              toast.success("Comment resolved");
              // Optimistic update
              const newSlides = slides.map(s => {
                  if (s._key === slideKey) {
                      return {
                          ...s,
                          comments: s.comments?.map(c => c._key === commentKey ? { ...c, resolved: true } : c)
                      };
                  }
                  return s;
              });
              setSlides(newSlides);
          } else {
              toast.error("Failed to resolve comment");
          }
      } catch (e) {
          toast.error("Error resolving comment");
      } finally {
          toast.dismiss(toastId);
      }
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-8 p-4">
      
      {/* Hidden inputs for file uploads */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleMoodboardUpload} />
      <input type="file" ref={slideFileInputRef} className="hidden" accept="image/*" onChange={handleSlideImageUpload} />
      <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" multiple onChange={handleGalleryUpload} />

      {/* LEFT: Slide List */}
      <div className="w-full lg:w-80 h-48 lg:h-auto flex flex-col shrink-0 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between backdrop-blur-sm sticky top-0 z-10 rounded-t-2xl">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm tracking-wide">Slides</h3>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors"><Plus className="w-5 h-5" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Add Slide</div>
                    {SLIDE_TEMPLATES.map(template => (
                        <DropdownMenuItem key={template.id} onClick={() => addSlideWithTemplate(template.id)} className="cursor-pointer rounded-lg py-2.5 px-3 focus:bg-blue-50 dark:focus:bg-blue-900/20 focus:text-blue-600">
                            <template.icon className="w-4 h-4 mr-3 opacity-70" />
                            {template.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        
        <div className="space-y-3 overflow-y-auto flex-1 p-4 pl-6 pb-8 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {slides.map((slide, idx) => (
                <div 
                    key={slide._key}
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`group p-4 rounded-xl border cursor-pointer transition-all duration-200 relative ${
                        idx === activeSlideIndex 
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10 shadow-md ring-1 ring-blue-600 z-10" 
                        : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm"
                    }`}
                >
                    {/* Active Indicator Dot - Floating Pill */}
                    {idx === activeSlideIndex && (
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-600 rounded-r-full shadow-lg shadow-blue-500/30 z-10" />
                    )}
                    
                    <div className="flex justify-between items-start mb-2 pl-3">
                        <span className={`text-xs font-mono font-medium ${idx === activeSlideIndex ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                            {(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-slate-900/80 backdrop-blur rounded-full px-1 shadow-sm border border-slate-100 dark:border-slate-800 absolute right-2 top-2">
                            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" onClick={(e) => { e.stopPropagation(); moveSlide(idx, 'up'); }} disabled={idx === 0}>
                                <ArrowUp className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" onClick={(e) => { e.stopPropagation(); moveSlide(idx, 'down'); }} disabled={idx === slides.length - 1}>
                                <ArrowDown className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                            </Button>
                            {slides.length > 1 && (
                                <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20" onClick={(e) => {
                                    e.stopPropagation();
                                    removeSlide(idx);
                                }}>
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                    <p className={`text-sm font-semibold truncate pl-2 mb-2 ${idx === activeSlideIndex ? 'text-blue-900 dark:text-blue-100' : 'text-slate-700 dark:text-slate-200'}`}>
                        {slide.title || "Untitled Slide"}
                    </p>
                    <div className="flex items-center gap-2 pl-2">
                        <Badge variant="secondary" className="text-[10px] h-5 px-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-normal uppercase tracking-wider border-0">
                            {slide.layout}
                        </Badge>
                        {(slide.comments?.length || 0) > 0 && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {slide.comments?.length}
                            </Badge>
                        )}
                    </div>
                </div>
            ))}
        </div>
        
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 rounded-b-2xl">
            <div className="grid grid-cols-2 gap-3">
                <Button className="min-w-0 justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm px-4" onClick={() => setShowPreview(true)} variant="outline" title="Preview Deck">
                    <Eye className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" /> <span className="truncate">Preview</span>
                </Button>
                <Button className="min-w-0 justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm px-4 w-full" onClick={() => setShowPrintPreview(true)} variant="outline" title="Export as PDF">
                    <Printer className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400 flex-shrink-0" /> <span className="truncate">Export PDF</span>
                </Button>
            </div>
             <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-200 dark:shadow-none" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Deck
             </Button>
             
             {status === "drafting" && (
                <Button className="w-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/30" variant="outline" onClick={() => setShowSubmitDialog(true)} disabled={isSaving}>
                    <Presentation className="w-4 h-4 mr-2" />
                    Submit for Review
                </Button>
             )}

             {status === "internal_review" && (
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20" onClick={handlePublish} disabled={isSaving}>
                    <Globe className="w-4 h-4 mr-2" />
                    Publish to Client
                </Button>
             )}

             {status === "client_review" && (
                 <div className="w-full p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center justify-center gap-2 text-yellow-700 dark:text-yellow-400 text-sm font-medium">
                     <Loader2 className="w-4 h-4 animate-spin" />
                     Client Reviewing...
                 </div>
             )}

             {status === "approved" && (
                 <div className="w-full p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-center gap-2 text-green-700 dark:text-green-400 text-sm font-medium">
                     <Check className="w-4 h-4" />
                     Strategy Approved
                 </div>
             )}
        </div>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0 border-none bg-transparent shadow-2xl overflow-hidden rounded-2xl">
            <StrategyPresentation 
                campaign={{ 
                    ...campaign, 
                    strategyDeck: { 
                        slides, 
                        competitors, 
                        moodboard, 
                        status: campaign.strategyDeck?.status || "draft",
                        targetAudience,
                        toneOfVoice,
                        strategicPillars,
                        proposedDeliverables
                    } 
                }} 
                onClose={() => setShowPreview(false)} 
            />
        </DialogContent>
      </Dialog>

      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="max-w-none w-screen h-screen p-0 border-none bg-white dark:bg-slate-950 shadow-none rounded-none overflow-y-auto">
            <StrategyPresentation 
                campaign={{ 
                    ...campaign, 
                    strategyDeck: { 
                        slides, 
                        competitors, 
                        moodboard, 
                        status: campaign.strategyDeck?.status || "draft",
                        targetAudience,
                        toneOfVoice,
                        strategicPillars,
                        proposedDeliverables
                    } 
                }} 
                onClose={() => setShowPrintPreview(false)} 
                mode="print"
            />
        </DialogContent>
      </Dialog>

      {/* CENTER: Editor */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
         <div className="border-b border-slate-100 dark:border-slate-800 p-6 flex items-center gap-6 bg-white dark:bg-slate-950 z-10">
            <div className="flex-1">
                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Slide Title</Label>
                <Input 
                    value={activeSlide.title} 
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSlide(activeSlide._key, { title: e.target.value })}
                    className="font-display text-2xl font-bold bg-transparent border-0 border-b border-slate-200 dark:border-slate-800 hover:border-slate-300 focus:border-blue-600 dark:focus:border-blue-500 focus-visible:ring-0 px-0 h-auto py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-300 rounded-none transition-colors"
                    placeholder="Enter slide title..."
                />
            </div>
            <div className="w-48">
                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Layout</Label>
                <Select 
                    value={activeSlide.layout} 
                    onValueChange={(val: Slide['layout']) => updateSlide(activeSlide._key, { layout: val })}
                >
                    <SelectTrigger className="w-full h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-blue-500/20">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="title">Title Slide</SelectItem>
                        <SelectItem value="text">Text Only</SelectItem>
                        <SelectItem value="split">Split (Left/Right)</SelectItem>
                        <SelectItem value="grid">Grid</SelectItem>
                        <SelectItem value="image">Full Image</SelectItem>
                        <SelectItem value="quote">Quote</SelectItem>
                        <SelectItem value="stats">Big Stats</SelectItem>
                        <SelectItem value="comparison">Comparison</SelectItem>
                        <SelectItem value="roadmap">Roadmap Timeline</SelectItem>
                        <SelectItem value="persona">Persona Profile</SelectItem>
                        <SelectItem value="mockup">Mobile Mockup</SelectItem>
                        <SelectItem value="statement">Visual Statement</SelectItem>
                        <SelectItem value="gallery">Image Gallery</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

        <div className="flex-1 p-8 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center">
            {/* Visual Preview / Edit Area */}
            <div className="w-full max-w-4xl aspect-video bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-800 p-12 relative group text-slate-900 dark:text-slate-100 transition-all hover:shadow-2xl">
                     <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleGenerateContent}
                     >
                        <Sparkles className="w-4 h-4 mr-2 text-blue-600" /> AI Write
                     </Button>

                     {activeSlide.layout === 'title' && (
                         <div className="h-full flex flex-col justify-center items-center text-center space-y-4">
                             <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">{activeSlide.title}</h1>
                             <div className="w-full max-w-lg text-left">
                                <MarkdownToolbar onInsert={handleMarkdownInsert} />
                                <Textarea 
                                    ref={editorRef}
                                    value={activeSlide.content}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSlide(activeSlide._key, { content: e.target.value })}
                                    className="text-center border-none shadow-none resize-none focus-visible:ring-0 text-slate-500 dark:text-slate-400 text-xl placeholder:text-slate-400"
                                    rows={4}
                                />
                             </div>
                         </div>
                     )}

                     {(activeSlide.layout === 'text' || activeSlide.layout === 'grid') && (
                         <div className="h-full flex flex-col">
                             <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-slate-50">{activeSlide.title}</h2>
                             <div className="flex-1 flex flex-col">
                                <MarkdownToolbar onInsert={handleMarkdownInsert} />
                                <Textarea 
                                    ref={editorRef}
                                    value={activeSlide.content}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSlide(activeSlide._key, { content: e.target.value })}
                                    className="flex-1 border-none shadow-none resize-none focus-visible:ring-0 text-slate-700 dark:text-slate-200 text-lg leading-relaxed font-sans placeholder:text-slate-400"
                                    placeholder="# Heading 1..."
                                />
                             </div>
                         </div>
                     )}

                    {activeSlide.layout === 'persona' && (
                        <PersonaSlide 
                            slide={activeSlide} 
                            isEditable={true} 
                            onUpdate={(updates) => updateSlide(activeSlide._key, updates)}
                            onImageUpload={() => slideFileInputRef.current?.click()}
                        />
                    )}

                    {activeSlide.layout === 'mockup' && (
                        <MockupSlide 
                            slide={activeSlide} 
                            isEditable={true} 
                            onUpdate={(updates) => updateSlide(activeSlide._key, updates)}
                            onImageUpload={() => slideFileInputRef.current?.click()}
                        />
                    )}

                    {activeSlide.layout === 'statement' && (
                        <StatementSlide 
                            slide={activeSlide} 
                            isEditable={true} 
                            onUpdate={(updates) => updateSlide(activeSlide._key, updates)}
                        />
                    )}

                    {activeSlide.layout === 'gallery' && (
                        <GallerySlide 
                            slide={activeSlide} 
                            isEditable={true} 
                            onUpdate={(updates) => updateSlide(activeSlide._key, updates)}
                            onImageUpload={() => galleryInputRef.current?.click()}
                        />
                    )}

                     {activeSlide.layout === 'split' && (
                         <div className="h-full grid grid-cols-2 gap-8">
                             <div className="flex flex-col h-full">
                                <h2 className="text-2xl font-bold mb-4">{activeSlide.title}</h2>
                                <div className="flex-1 flex flex-col">
                                    <MarkdownToolbar onInsert={handleMarkdownInsert} />
                                    <Textarea 
                                        ref={editorRef}
                                        value={activeSlide.content}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSlide(activeSlide._key, { content: e.target.value })}
                                        className="flex-1 border-none shadow-none resize-none focus-visible:ring-0 text-slate-700 dark:text-slate-200 text-base leading-relaxed"
                                    />
                                </div>
                             </div>
                             <div className="bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden relative">
                                {activeSlide.imageUrl ? (
                                    <>
                                        <img src={activeSlide.imageUrl} alt="Slide Image" className="w-full h-full object-cover" />
                                        <Button 
                                            variant="destructive" 
                                            size="icon" 
                                            className="absolute top-2 right-2"
                                            onClick={() => updateSlide(activeSlide._key, { imageUrl: undefined, imageAssetId: undefined })}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <div className="text-center">
                                        <ImageIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                        <Button variant="outline" size="sm" onClick={() => slideFileInputRef.current?.click()}>Upload Image</Button>
                                    </div>
                                )}
                             </div>
                         </div>
                     )}

                     {activeSlide.layout === 'image' && (
                         <div className="h-full bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden relative">
                            {activeSlide.imageUrl ? (
                                <>
                                    <img src={activeSlide.imageUrl} alt="Slide Image" className="w-full h-full object-contain" />
                                    <Button 
                                        variant="destructive" 
                                        size="icon" 
                                        className="absolute top-2 right-2"
                                        onClick={() => updateSlide(activeSlide._key, { imageUrl: undefined, imageAssetId: undefined })}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </>
                            ) : (
                                <div className="text-center">
                                    <ImageIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                    <Button variant="outline" size="sm" onClick={() => slideFileInputRef.current?.click()}>Upload Image</Button>
                                </div>
                            )}
                         </div>
                     )}

                     {activeSlide.layout === 'quote' && (
                         <div className="h-full flex flex-col justify-center items-center text-center px-12">
                             <MessageSquare className="w-12 h-12 text-blue-200 dark:text-blue-800 mb-6" />
                             <div className="w-full">
                                <MarkdownToolbar onInsert={handleMarkdownInsert} />
                                <Textarea 
                                    ref={editorRef}
                                    value={activeSlide.content}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSlide(activeSlide._key, { content: e.target.value })}
                                    className="text-center border-none shadow-none resize-none focus-visible:ring-0 text-slate-700 dark:text-slate-200 text-2xl font-serif italic leading-relaxed placeholder:text-slate-400"
                                    rows={6}
                                    placeholder="Enter quote here..."
                                />
                             </div>
                         </div>
                     )}

                     {activeSlide.layout === 'stats' && (
                         <div className="h-full flex flex-col">
                             <h2 className="text-2xl font-bold mb-8 text-center text-slate-900 dark:text-slate-50">{activeSlide.title}</h2>
                             <div className="flex-1 flex flex-col justify-center">
                                <MarkdownToolbar onInsert={handleMarkdownInsert} />
                                <Textarea 
                                    ref={editorRef}
                                    value={activeSlide.content}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSlide(activeSlide._key, { content: e.target.value })}
                                    className="flex-1 border-none shadow-none resize-none focus-visible:ring-0 text-slate-700 dark:text-slate-200 text-center text-lg placeholder:text-slate-400"
                                    placeholder="## 100% \n Label"
                                />
                             </div>
                         </div>
                     )}

                     {activeSlide.layout === 'comparison' && (
                         <div className="h-full flex flex-col">
                             <h2 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-slate-50">{activeSlide.title}</h2>
                             <div className="flex-1 flex flex-col">
                                <MarkdownToolbar onInsert={handleMarkdownInsert} />
                                <Textarea 
                                    ref={editorRef}
                                    value={activeSlide.content}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSlide(activeSlide._key, { content: e.target.value })}
                                    className="flex-1 border-none shadow-none resize-none focus-visible:ring-0 text-slate-700 dark:text-slate-200 text-base placeholder:text-slate-400"
                                    placeholder="## Us\n- Good\n\n## Them\n- Bad"
                                />
                             </div>
                         </div>
                     )}

                     {activeSlide.layout === 'roadmap' && (
                         <div className="h-full flex flex-col">
                             <h2 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-slate-50">{activeSlide.title}</h2>
                             <div className="flex-1 flex flex-col">
                                <MarkdownToolbar onInsert={handleMarkdownInsert} />
                                <Textarea 
                                    ref={editorRef}
                                    value={activeSlide.content}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateSlide(activeSlide._key, { content: e.target.value })}
                                    className="flex-1 border-none shadow-none resize-none focus-visible:ring-0 text-slate-700 dark:text-slate-200 text-base placeholder:text-slate-400"
                                    placeholder="## Q1: Foundation\n- Research\n- Strategy"
                                />
                             </div>
                         </div>
                     )}

                     {activeSlide.layout === 'persona' && (
                        <PersonaSlide 
                            slide={activeSlide} 
                            isEditable={true} 
                            onUpdate={(updates) => updateSlide(activeSlide._key, updates)} 
                            onImageUpload={handleDirectImageUpload}
                        />
                     )}

                     {activeSlide.layout === 'mockup' && (
                        <MockupSlide 
                            slide={activeSlide} 
                            isEditable={true} 
                            onUpdate={(updates) => updateSlide(activeSlide._key, updates)} 
                            onImageUpload={handleDirectImageUpload}
                        />
                     )}

                     {activeSlide.layout === 'statement' && (
                        <StatementSlide 
                            slide={activeSlide} 
                            isEditable={true} 
                            onUpdate={(updates) => updateSlide(activeSlide._key, updates)} 
                            onImageUpload={handleDirectImageUpload}
                        />
                     )}

                     {activeSlide.layout === 'gallery' && (
                        <GallerySlide 
                            slide={activeSlide} 
                            isEditable={true} 
                            onUpdate={(updates) => updateSlide(activeSlide._key, updates)} 
                            onImageUpload={handleDirectImageUpload}
                            onGalleryUpload={handleDirectGalleryUpload}
                        />
                     )}
               </div>
           </div>
        </div>

     {/* RIGHT: Research & Tools */}
      <div className="w-full lg:w-[480px] flex flex-col gap-6 h-full min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full min-h-0 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <TabsList className="flex w-full p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl overflow-x-auto no-scrollbar gap-1 h-auto">
                    {[
                        { id: "plan", icon: Target, label: "Plan" },
                        { id: "context", icon: BookOpen, label: "Context" },
                        { id: "research", icon: Search, label: "Research" },
                        { id: "competitors", icon: Users, label: "Comp." },
                        { id: "moodboard", icon: Palette, label: "Mood" },
                        { id: "assets", icon: FolderOpen, label: "Assets" },
                        { id: "comments", icon: MessageSquare, label: "Chat", hasBadge: (activeSlide.comments?.length || 0) > 0 }
                    ].map((tab) => (
                    <TabsTrigger 
                        key={tab.id}
                        value={tab.id} 
                        className={`
                            relative px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex-shrink-0 flex items-center gap-2
                            data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm
                            text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200
                        `}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                        {tab.hasBadge && (
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        )}
                    </TabsTrigger>
                    ))}
                </TabsList>
            </div>

            <div className="flex-1 flex flex-col bg-white dark:bg-slate-950">
                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    
                    <TabsContent value="context" className="m-0 space-y-8 animate-in fade-in duration-700">
                        <div className="flex items-end justify-between mb-8 border-b border-slate-200/60 dark:border-slate-800/60 pb-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-widest">
                                    <Sparkles className="w-3 h-3" />
                                    AI-Powered Strategy
                                </div>
                                <div>
                                    <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter font-display">Strategy Context</h3>
                                    <p className="text-base text-slate-500 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed font-light">
                                        Define the core DNA of your campaign. These inputs guide our AI to generate on-brand content that resonates with your audience.
                                    </p>
                                </div>
                            </div>
                            <Button 
                                variant="default" 
                                size="lg" 
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 dark:shadow-blue-900/40 px-8 h-12 rounded-full transition-all hover:scale-105 active:scale-95 font-medium tracking-wide"
                                onClick={handleGenerateContextSuggestions}
                                disabled={isGeneratingContext}
                            >
                                {isGeneratingContext ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                Auto-Fill with AI
                            </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Target Audience */}
                            <div className="group/field relative p-8 bg-white dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-500 hover:border-blue-200 dark:hover:border-blue-800/50">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-transparent dark:from-blue-900/10 opacity-0 group-hover/field:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
                                
                                <div className="relative z-10 mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-lg font-display font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-3">
                                            Target Audience
                                            {contextSuggestions?.targetAudience && !targetAudience && (
                                                <span className="relative flex h-2.5 w-2.5">
                                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                                                </span>
                                            )}
                                        </Label>
                                        {targetAudience && (
                                            <Badge variant="outline" className={cn(
                                                "px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border",
                                                contextSuggestions?.targetAudience === targetAudience 
                                                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                                                    : contextSuggestions?.targetAudience && targetAudience.includes(contextSuggestions.targetAudience.substring(0, 20))
                                                        ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                                                        : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700"
                                            )}>
                                                {contextSuggestions?.targetAudience === targetAudience 
                                                    ? <><Sparkles className="w-3 h-3 mr-1.5" /> AI Generated</>
                                                    : contextSuggestions?.targetAudience && targetAudience.includes(contextSuggestions.targetAudience.substring(0, 20))
                                                        ? <><Sparkles className="w-3 h-3 mr-1.5" /> AI Modified</>
                                                        : <><User className="w-3 h-3 mr-1.5" /> Human Edit</>
                                                }
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm font-light text-slate-500 dark:text-slate-400">Who is this campaign for? Describe demographics, interests, and pain points.</p>
                                </div>
                                
                                <div className="relative z-10">
                                    <Textarea 
                                        value={targetAudience}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                            setTargetAudience(e.target.value);
                                            setHasUnsavedChanges(true);
                                        }}
                                        placeholder="e.g., Gen Z fashion enthusiasts aged 18-24 who value sustainability and authentic storytelling..."
                                        className="min-h-[180px] text-base resize-none border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all p-5 shadow-inner rounded-2xl bg-slate-50 dark:bg-slate-950/50 placeholder:text-slate-400 font-light leading-relaxed text-slate-900 dark:text-slate-100"
                                    />
                                    
                                    {contextSuggestions?.targetAudienceOptions && contextSuggestions.targetAudienceOptions.length > 0 ? (
                                        <div className="mt-6 space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest">AI Suggestions</span>
                                            </div>
                                            <div className="flex gap-4 overflow-x-auto pb-4 snap-x -mx-2 px-2 mask-linear-fade">
                                                {contextSuggestions.targetAudienceOptions.map((option, i) => (
                                                    <div 
                                                        key={i}
                                                        className={cn(
                                                            "flex-shrink-0 w-72 p-5 rounded-2xl border cursor-pointer transition-all duration-300 group/opt relative overflow-hidden snap-center",
                                                            targetAudience === option
                                                                ? "bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-lg shadow-blue-500/10"
                                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg hover:-translate-y-1"
                                                        )}
                                                        onClick={() => {
                                                            setTargetAudience(option);
                                                            setHasUnsavedChanges(true);
                                                        }}
                                                    >
                                                        <p className={cn(
                                                            "text-sm line-clamp-4 leading-relaxed",
                                                            targetAudience === option 
                                                                ? "text-blue-900 dark:text-blue-100 font-medium" 
                                                                : "text-slate-600 dark:text-slate-400 group-hover/opt:text-slate-900 dark:group-hover/opt:text-slate-200 font-light"
                                                        )}>
                                                            {option}
                                                        </p>
                                                        {targetAudience !== option && (
                                                            <div className="mt-4 opacity-0 group-hover/opt:opacity-100 transition-opacity flex justify-end">
                                                                <span className="text-[10px] font-bold text-white bg-blue-600 px-3 py-1.5 rounded-full shadow-lg shadow-blue-500/30">Apply Suggestion</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : contextSuggestions?.targetAudience && targetAudience !== contextSuggestions.targetAudience && (
                                        <div 
                                            className="mt-4 p-5 bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/10 dark:to-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl cursor-pointer hover:shadow-md transition-all group/suggestion relative overflow-hidden"
                                            onClick={() => setTargetAudience(contextSuggestions.targetAudience!)}
                                        >
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest">AI Recommendation</span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 group-hover/suggestion:text-blue-800 dark:group-hover/suggestion:text-blue-200 transition-colors font-light italic">
                                                "{contextSuggestions.targetAudience}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Tone of Voice */}
                            <div className="group/field relative p-8 bg-white dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-500 hover:border-blue-200 dark:hover:border-blue-800/50">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-transparent dark:from-blue-900/10 opacity-0 group-hover/field:opacity-100 transition-opacity rounded-3xl pointer-events-none" />
                                
                                <div className="relative z-10 mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-lg font-display font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-3">
                                            Tone of Voice
                                            {contextSuggestions?.toneOfVoice && !toneOfVoice && (
                                                <span className="relative flex h-2.5 w-2.5">
                                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                                                </span>
                                            )}
                                        </Label>
                                        {toneOfVoice && (
                                            <Badge variant="outline" className={cn(
                                                "px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border",
                                                contextSuggestions?.toneOfVoice === toneOfVoice 
                                                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                                                    : contextSuggestions?.toneOfVoice && toneOfVoice.includes(contextSuggestions.toneOfVoice.substring(0, 10))
                                                        ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                                                        : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700"
                                            )}>
                                                {contextSuggestions?.toneOfVoice === toneOfVoice 
                                                    ? <><Sparkles className="w-3 h-3 mr-1.5" /> AI Generated</>
                                                    : contextSuggestions?.toneOfVoice && toneOfVoice.includes(contextSuggestions.toneOfVoice.substring(0, 10))
                                                        ? <><Sparkles className="w-3 h-3 mr-1.5" /> AI Modified</>
                                                        : <><User className="w-3 h-3 mr-1.5" /> Human Edit</>
                                                }
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm font-light text-slate-500 dark:text-slate-400">How should the brand sound? Adjectives like 'Professional', 'Witty', or 'Empathetic'.</p>
                                </div>
                                
                                <div className="relative z-10">
                                    <Input 
                                        value={toneOfVoice}
                                        onChange={(e) => {
                                            setToneOfVoice(e.target.value);
                                            setHasUnsavedChanges(true);
                                        }}
                                        placeholder="e.g. Professional, Witty, Empathetic..."
                                        className="h-14 text-base border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all px-5 shadow-inner rounded-xl bg-slate-50 dark:bg-slate-950/50 placeholder:text-slate-400 font-light text-slate-900 dark:text-slate-100"
                                    />
                                    
                                    {contextSuggestions?.toneOfVoiceOptions && contextSuggestions.toneOfVoiceOptions.length > 0 ? (
                                        <div className="mt-6 space-y-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                </div>
                                                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest">AI Suggestions</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {contextSuggestions.toneOfVoiceOptions.map((option, i) => (
                                                    <div 
                                                        key={i}
                                                        className={cn(
                                                            "px-4 py-2 rounded-full border cursor-pointer transition-all duration-300 group/opt relative overflow-hidden",
                                                            toneOfVoice === option
                                                                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/30"
                                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md hover:-translate-y-0.5"
                                                        )}
                                                        onClick={() => {
                                                            setToneOfVoice(option);
                                                            setHasUnsavedChanges(true);
                                                        }}
                                                    >
                                                        <span className={cn(
                                                            "text-sm font-medium",
                                                            toneOfVoice === option 
                                                                ? "text-white" 
                                                                : "text-slate-600 dark:text-slate-400 group-hover/opt:text-slate-900 dark:group-hover/opt:text-slate-200"
                                                        )}>
                                                            {option}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : contextSuggestions?.toneOfVoice && toneOfVoice !== contextSuggestions.toneOfVoice && (
                                        <div 
                                            className="mt-4 p-5 bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-900/10 dark:to-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-2xl cursor-pointer hover:shadow-md transition-all group/suggestion relative overflow-hidden"
                                            onClick={() => setToneOfVoice(contextSuggestions.toneOfVoice!)}
                                        >
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-widest">AI Recommendation</span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 group-hover/suggestion:text-blue-800 dark:group-hover/suggestion:text-blue-200 transition-colors font-light italic">
                                                "{contextSuggestions.toneOfVoice}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Strategic Pillars */}
                        <div className="p-6 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group/field">
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <Label className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                            Strategic Pillars
                                            {contextSuggestions?.pillars && !strategicPillars && (
                                                <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                            )}
                                        </Label>
                                        {strategicPillars && (
                                            <Badge variant="secondary" className={cn(
                                                "text-[10px] uppercase tracking-wider font-bold",
                                                contextSuggestions?.pillars === strategicPillars 
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                    : contextSuggestions?.pillars && strategicPillars.includes(contextSuggestions.pillars.substring(0, 20))
                                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                            )}>
                                                {contextSuggestions?.pillars === strategicPillars 
                                                    ? <><Sparkles className="w-3 h-3 mr-1" /> AI Generated</>
                                                    : contextSuggestions?.pillars && strategicPillars.includes(contextSuggestions.pillars.substring(0, 20))
                                                        ? <><Sparkles className="w-3 h-3 mr-1" /> AI Modified</>
                                                        : <><User className="w-3 h-3 mr-1" /> Manual Input</>
                                                }
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500">Key themes or pillars for the campaign content.</p>
                                </div>
                                <div className="relative">
                                    <Textarea 
                                        value={strategicPillars}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStrategicPillars(e.target.value)}
                                        placeholder="e.g. 1. Sustainability First 2. Community Driven 3. Transparent Sourcing..."
                                        className="min-h-[120px] text-base resize-none border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-950 transition-all p-4 shadow-sm rounded-xl bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 text-slate-900 dark:text-slate-100"
                                    />
                                    {contextSuggestions?.pillarsOptions && contextSuggestions.pillarsOptions.length > 0 ? (
                                        <div className="mt-4 space-y-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                                                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">AI Suggestions</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {contextSuggestions.pillarsOptions.map((option, i) => (
                                                    <div 
                                                        key={i}
                                                        className={cn(
                                                            "p-4 rounded-xl border cursor-pointer transition-all group/opt relative overflow-hidden h-full flex flex-col",
                                                            strategicPillars === option
                                                                ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
                                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md"
                                                        )}
                                                        onClick={() => {
                                                            setStrategicPillars(option);
                                                            setHasUnsavedChanges(true);
                                                        }}
                                                    >
                                                        <p className={cn(
                                                            "text-sm whitespace-pre-line flex-1",
                                                            strategicPillars === option 
                                                                ? "text-blue-900 dark:text-blue-100 font-medium" 
                                                                : "text-slate-600 dark:text-slate-400 group-hover/opt:text-slate-900 dark:group-hover/opt:text-slate-200"
                                                        )}>
                                                            {option}
                                                        </p>
                                                        {strategicPillars !== option && (
                                                            <div className="mt-3 opacity-0 group-hover/opt:opacity-100 transition-opacity flex justify-end">
                                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/50 px-2 py-1 rounded-full">Apply</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : contextSuggestions?.pillars && strategicPillars !== contextSuggestions.pillars && (
                                        <div 
                                            className="mt-3 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-all group/suggestion relative overflow-hidden"
                                            onClick={() => setStrategicPillars(contextSuggestions.pillars!)}
                                        >
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles className="w-3 h-3 text-blue-600" />
                                                <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">AI Suggestion Available</span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line group-hover/suggestion:text-blue-800 dark:group-hover/suggestion:text-blue-200 transition-colors">
                                                {contextSuggestions.pillars}
                                            </p>
                                        </div>
                                    )}
                                </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="plan" className="m-0 space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6 shrink-0">
                            <div>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-50 font-display tracking-tight">Deliverables Plan</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl leading-relaxed">
                                    The concrete outputs for this campaign. Generate a comprehensive plan with AI or build it item by item.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {proposedDeliverables.length > 0 && (
                                    <Button 
                                        variant="outline" 
                                        size="lg" 
                                        onClick={() => handleDoubleCheckAll()} 
                                        disabled={isCheckingAll}
                                        className={cn(
                                            "h-12 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all rounded-xl",
                                            isCheckingAll && "opacity-80"
                                        )}
                                    >
                                        {isCheckingAll ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
                                        {isCheckingAll ? "AI Checking..." : "Double Check All"}
                                    </Button>
                                )}
                                <Button 
                                    variant="default" 
                                    size="lg" 
                                    onClick={handleGeneratePlan}
                                    disabled={isGeneratingPlan}
                                    className="h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 dark:shadow-blue-900/20 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isGeneratingPlan ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                    {proposedDeliverables.length > 0 ? "Regenerate Plan" : "Generate Plan"}
                                </Button>
                            </div>
                        </div>

                        {planError && (
                            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800 flex items-center gap-3 shrink-0">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                {planError}
                            </div>
                        )}

                        <div className="flex-1 flex gap-8 min-h-0 overflow-hidden">
                            {/* Left Column: Deliverables List */}
                            <div className="w-1/3 flex flex-col bg-white dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50">
                                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                                        {proposedDeliverables.length} Deliverables
                                    </div>
                                    <Button size="sm" variant="ghost" onClick={addProposedDeliverable} className="h-8 text-xs hover:bg-white dark:hover:bg-slate-800 rounded-lg text-blue-600 dark:text-blue-400">
                                        <Plus className="w-3.5 h-3.5 mr-1.5" /> Add New
                                    </Button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {proposedDeliverables.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                                                <Target className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No deliverables yet</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Generate a plan or add manually</p>
                                        </div>
                                    ) : (
                                        proposedDeliverables.map((item, i) => (
                                            <div 
                                                key={item._key}
                                                onClick={() => setSelectedDeliverableIndex(i)}
                                                className={cn(
                                                    "p-4 rounded-2xl border cursor-pointer transition-all hover:shadow-md relative group",
                                                    selectedDeliverableIndex === i 
                                                        ? "bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-900/50 border-blue-200 dark:border-blue-800 shadow-md" 
                                                        : "bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-700"
                                                )}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className={cn(
                                                        "font-semibold text-sm line-clamp-1 transition-colors",
                                                        selectedDeliverableIndex === i ? "text-blue-900 dark:text-blue-100" : "text-slate-900 dark:text-slate-100"
                                                    )}>
                                                        {item.title || "Untitled Deliverable"}
                                                    </div>
                                                    {item.qualityCheck && (
                                                        <div className={cn(
                                                            "w-2.5 h-2.5 rounded-full shrink-0 mt-1 ring-2 ring-white dark:ring-slate-900 shadow-sm",
                                                            item.qualityCheck.status === 'approved' ? "bg-green-500" : "bg-amber-500"
                                                        )} />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                                                    <Badge variant="secondary" className={cn(
                                                        "h-5 px-2 text-[9px] font-bold tracking-wider border",
                                                        selectedDeliverableIndex === i 
                                                            ? "bg-white dark:bg-slate-900 border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-300" 
                                                            : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700"
                                                    )}>
                                                        {item.platform || "PLATFORM"}
                                                    </Badge>
                                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                                    <span className="capitalize font-medium">{item.type?.replace('_', ' ') || "Type"}</span>
                                                </div>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="absolute right-2 bottom-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                    onClick={(e) => { e.stopPropagation(); removeProposedDeliverable(i); }}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Detail Editor */}
                            <div className="flex-1 bg-white dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 flex flex-col relative">
                                {selectedDeliverableIndex !== null && proposedDeliverables[selectedDeliverableIndex] ? (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-transparent dark:from-blue-900/5 pointer-events-none" />
                                        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative z-10">
                                            {/* Header Inputs */}
                                            <div className="space-y-8">
                                                <div className="group/title relative">
                                                    <Label className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-2 block">Deliverable Title</Label>
                                                    <Input 
                                                        value={proposedDeliverables[selectedDeliverableIndex].title} 
                                                        onChange={(e) => updateProposedDeliverable(selectedDeliverableIndex, 'title', e.target.value)}
                                                        className="text-3xl font-bold font-display border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-500 rounded-none px-0 h-auto py-2 bg-transparent focus:ring-0 placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-900 dark:text-white transition-all"
                                                        placeholder="Enter title..."
                                                    />
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="space-y-3">
                                                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Platform</Label>
                                                        <Select 
                                                            value={proposedDeliverables[selectedDeliverableIndex].platform} 
                                                            onValueChange={(val) => updateProposedDeliverable(selectedDeliverableIndex, 'platform', val)}
                                                        >
                                                            <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-colors shadow-sm">
                                                                <SelectValue placeholder="Select Platform" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="instagram">Instagram</SelectItem>
                                                                <SelectItem value="tiktok">TikTok</SelectItem>
                                                                <SelectItem value="linkedin">LinkedIn</SelectItem>
                                                                <SelectItem value="youtube">YouTube</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Format Type</Label>
                                                        <Select 
                                                            value={proposedDeliverables[selectedDeliverableIndex].type} 
                                                            onValueChange={(val) => updateProposedDeliverable(selectedDeliverableIndex, 'type', val)}
                                                        >
                                                            <SelectTrigger className="h-12 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 transition-colors shadow-sm">
                                                                <SelectValue placeholder="Select Type" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="static_post">Static Post</SelectItem>
                                                                <SelectItem value="carousel">Carousel</SelectItem>
                                                                <SelectItem value="reel">Reel / Video</SelectItem>
                                                                <SelectItem value="story">Story</SelectItem>
                                                                <SelectItem value="video_long">Long Video</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Core Content */}
                                            <div className="space-y-8">
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Content Description</Label>
                                                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">What's happening?</span>
                                                    </div>
                                                    <div className="relative group/field">
                                                        <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-900/10 opacity-0 group-hover/field:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                                                        <Textarea 
                                                            value={proposedDeliverables[selectedDeliverableIndex].description}
                                                            onChange={(e) => updateProposedDeliverable(selectedDeliverableIndex, 'description', e.target.value)}
                                                            className="min-h-[140px] resize-none bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl p-5 transition-all text-base leading-relaxed"
                                                            placeholder="Detailed description of the content..."
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Visual Direction</Label>
                                                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">Aesthetic & Mood</span>
                                                    </div>
                                                    <div className="relative group/field">
                                                        <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-900/10 opacity-0 group-hover/field:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                                                        <Textarea 
                                                            value={proposedDeliverables[selectedDeliverableIndex].visualDirection || ""}
                                                            onChange={(e) => updateProposedDeliverable(selectedDeliverableIndex, 'visualDirection', e.target.value)}
                                                            className="min-h-[100px] resize-none bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl p-5 transition-all text-base leading-relaxed"
                                                            placeholder="Fast paced, dark mode, upbeat music, specific colors..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Assets / Moodboard */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Assets & References</Label>
                                                    <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg px-2" onClick={() => fileInputRef.current?.click()}>
                                                        <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload New
                                                    </Button>
                                                </div>
                                                
                                                {(!moodboard || moodboard.length === 0) ? (
                                                    <div className="text-xs text-slate-400 italic p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center bg-slate-50/50 dark:bg-slate-900/50">
                                                        No assets available. Upload to Moodboard first.
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                                        {moodboard.map((m) => {
                                                            const isSelected = proposedDeliverables[selectedDeliverableIndex].assets?.some((a: any) => a._key === m._key);
                                                            return (
                                                                <div 
                                                                    key={m._key}
                                                                    onClick={() => toggleAssetSelection(selectedDeliverableIndex, m)}
                                                                    className={cn(
                                                                        "aspect-square rounded-xl overflow-hidden relative cursor-pointer border-2 transition-all group/asset shadow-sm",
                                                                        isSelected 
                                                                            ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900" 
                                                                            : "border-transparent hover:border-blue-200 dark:hover:border-blue-800 opacity-80 hover:opacity-100"
                                                                    )}
                                                                >
                                                                    <img src={m.url} alt="Asset" className="w-full h-full object-cover transition-transform group-hover/asset:scale-105" />
                                                                    {isSelected && (
                                                                        <div className="absolute top-1.5 right-1.5 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
                                                                            <Check className="w-3 h-3" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {/* AI Quality Check Section */}
                                            <div className="pt-8 mt-4 border-t border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center justify-between mb-5">
                                                    <h4 className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                                        <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                                                            <ShieldCheck className="w-4 h-4" />
                                                        </div>
                                                        AI Validation
                                                    </h4>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => handleQualityCheck(selectedDeliverableIndex)}
                                                        disabled={checkingQuality[selectedDeliverableIndex]}
                                                        className="h-9 rounded-lg border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all hover:border-blue-200 dark:hover:border-blue-800"
                                                    >
                                                        {checkingQuality[selectedDeliverableIndex] ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <RefreshCcw className="w-3.5 h-3.5 mr-2" />}
                                                        Run Check
                                                    </Button>
                                                </div>

                                                {proposedDeliverables[selectedDeliverableIndex].qualityCheck ? (
                                                    <div className={cn(
                                                        "p-6 rounded-2xl border shadow-sm transition-all",
                                                        proposedDeliverables[selectedDeliverableIndex].qualityCheck!.status === 'approved' 
                                                            ? "bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30" 
                                                            : "bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30"
                                                    )}>
                                                        <div className="flex items-center gap-2 font-bold text-lg mb-4">
                                                            {proposedDeliverables[selectedDeliverableIndex].qualityCheck!.status === 'approved' 
                                                                ? <span className="text-green-700 dark:text-green-400 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Ready for Editor</span>
                                                                : <span className="text-amber-700 dark:text-amber-400 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Needs Attention</span>
                                                            }
                                                        </div>
                                                        
                                                        {proposedDeliverables[selectedDeliverableIndex].qualityCheck!.missing_elements && proposedDeliverables[selectedDeliverableIndex].qualityCheck!.missing_elements.length > 0 && (
                                                            <div className="mt-4 space-y-3">
                                                                <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                                                                    <XCircle className="w-3.5 h-3.5" /> Missing Elements
                                                                </p>
                                                                <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-2 pl-1">
                                                                    {proposedDeliverables[selectedDeliverableIndex].qualityCheck!.missing_elements.map((issue: string, idx: number) => (
                                                                        <li key={idx} className="flex items-start gap-3 bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-red-100 dark:border-red-900/20">
                                                                            <span className="text-red-500 mt-0.5">•</span> {issue}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {proposedDeliverables[selectedDeliverableIndex].qualityCheck!.feedback && (
                                                            <div className="mt-6 space-y-3">
                                                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                                                                    <Info className="w-3.5 h-3.5" /> AI Feedback
                                                                </p>
                                                                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white/60 dark:bg-slate-900/60 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20">
                                                                    {proposedDeliverables[selectedDeliverableIndex].qualityCheck!.feedback}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-center p-10 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-sm flex flex-col items-center gap-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-900">
                                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-1">
                                                            <ShieldCheck className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                                                        </div>
                                                        <p>Run AI check to validate this deliverable before assigning.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 relative">
                                        <div className="absolute inset-0 bg-slate-50/30 dark:bg-slate-900/30 pattern-grid-lg opacity-50" />
                                        <div className="relative z-10 flex flex-col items-center">
                                            <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center mb-6 ring-4 ring-slate-50 dark:ring-slate-900">
                                                <Layout className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-display">Select a Deliverable</h4>
                                            <p className="text-sm max-w-xs text-center text-slate-500 dark:text-slate-400 leading-relaxed">
                                                Click on an item from the list to view and edit details, or create a new one to get started.
                                            </p>
                                            <Button variant="outline" className="mt-8 rounded-xl h-12 px-8 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 shadow-sm" onClick={addProposedDeliverable}>
                                                <Plus className="w-4 h-4 mr-2" /> Create New Deliverable
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="research" className="m-0 space-y-8 animate-in fade-in duration-500">
                        <div className="flex items-end justify-between mb-8 border-b border-slate-200/60 dark:border-slate-800/60 pb-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-widest">
                                    <Search className="w-3 h-3" />
                                    Deep Dive
                                </div>
                                <div>
                                    <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter font-display">Research & Insights</h3>
                                    <p className="text-base text-slate-500 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed font-light">
                                        Gather intelligence to inform your strategy. Analyze URLs, extract assets, and chat with AI to uncover opportunities.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* AI Research Assistant */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-8 rounded-3xl shadow-xl shadow-blue-900/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                            
                            <div className="relative z-10">
                                <h4 className="text-2xl font-bold text-white mb-3 flex items-center gap-3 font-display">
                                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl shadow-lg border border-white/10">
                                        <Sparkles className="w-5 h-5 text-blue-50" />
                                    </div>
                                    AI Strategy Copilot
                                </h4>
                                <p className="text-blue-100 mb-8 max-w-2xl leading-relaxed font-light text-lg">
                                    Your dedicated research assistant. Chat to generate content pillars, analyze competitor strategies, and brainstorm campaign angles based on real-time data.
                                </p>
                                <div className="w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden ring-1 ring-black/5">
                                    <AIResearchAssistant 
                                        client={campaign.client} 
                                        activeCampaigns={[campaign]} 
                                        context={{ activeSlide, allSlides: slides, competitors }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* URL Analyzer */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm hover:shadow-xl transition-all duration-500 group/card">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl group-hover/card:scale-110 transition-transform duration-500">
                                            <Globe className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-slate-900 dark:text-white font-display">URL Analyzer</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-light">Extract insights and assets from any webpage</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3 mb-8">
                                        <div className="relative flex-1 group/input">
                                            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-2xl opacity-0 group-hover/input:opacity-100 transition-opacity duration-500" />
                                            <Input 
                                                placeholder="https://competitor.com/campaign" 
                                                value={researchUrl}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResearchUrl(e.target.value)}
                                                className="h-14 pl-12 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl transition-all relative text-base shadow-inner font-light text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                            />
                                            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within/input:text-blue-500 transition-colors" />
                                        </div>
                                        <Button 
                                            size="lg" 
                                            onClick={handleAnalyzeUrl} 
                                            disabled={isAnalyzing}
                                            className="h-14 px-8 bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 rounded-2xl transition-all shadow-lg shadow-slate-200 dark:shadow-blue-900/20 text-base font-medium hover:scale-105 active:scale-95"
                                        >
                                            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                        </Button>
                                    </div>

                                    {/* Analysis Result */}
                                    {analysisResult && (
                                        <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                                                <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                    <Sparkles className="w-4 h-4" /> AI Insights
                                                </span>
                                                <Button size="sm" variant="ghost" className="h-9 text-xs hover:bg-white dark:hover:bg-slate-800 rounded-full px-4" onClick={() => {
                                                    const currentContent = activeSlide.content;
                                                    updateSlide(activeSlide._key, { content: currentContent + "\n\n" + analysisResult });
                                                    toast.success("Added to slide");
                                                }}>
                                                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add to Slide
                                                </Button>
                                            </div>
                                            <div className="prose dark:prose-invert prose-sm max-w-none max-h-80 overflow-y-auto pr-2 custom-scrollbar font-light leading-relaxed">
                                                <ReactMarkdown>{analysisResult}</ReactMarkdown>
                                            </div>
                                        </div>
                                    )}

                                    {/* Extracted Images */}
                                    {extractedImages.length > 0 && (
                                        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                                            <Label className="text-sm font-bold text-slate-900 dark:text-white mb-6 block uppercase tracking-wider flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4 text-blue-500" />
                                                Extracted Assets
                                            </Label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                {extractedImages.map((src, i) => (
                                                    <div 
                                                        key={i} 
                                                        className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer hover:ring-4 hover:ring-blue-500/20 hover:border-blue-500 dark:hover:border-blue-400 relative group transition-all shadow-sm hover:shadow-xl"
                                                        onClick={() => {
                                                            setMoodboard([...moodboard, { _key: Math.random().toString(36), type: "image", url: src, note: "From " + researchUrl }]);
                                                            toast.success("Added to Moodboard");
                                                        }}
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={src} alt="Extracted" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                        <div className="absolute inset-0 bg-blue-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 backdrop-blur-[2px]">
                                                            <div className="bg-white p-3 rounded-full shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300">
                                                                <Plus className="w-5 h-5 text-blue-600" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Client Context Sidebar */}
                            <div className="space-y-6">
                                <div className="bg-white dark:bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm h-full hover:shadow-xl transition-all duration-500">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl">
                                            <Briefcase className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-900 dark:text-white font-display">Client Context</h4>
                                    </div>
                                    
                                    <div className="space-y-8">
                                        <div className="space-y-3 group/item">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover/item:text-blue-500 transition-colors flex items-center gap-2">
                                                <Target className="w-3.5 h-3.5" /> Creative Goal
                                            </Label>
                                            <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm group-hover/item:shadow-md group-hover/item:border-blue-100 dark:group-hover/item:border-blue-900/50 transition-all relative overflow-hidden group-hover/item:bg-white dark:group-hover/item:bg-slate-900">
                                                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover/item:scale-150 duration-700" />
                                                <div className="relative font-light">
                                                    {campaign.client.creativeGoal || "Not defined"}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3 group/item">
                                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-400 group-hover/item:text-blue-500 transition-colors flex items-center gap-2">
                                                <Layers className="w-3.5 h-3.5" /> Content Pillars
                                            </Label>
                                            <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm group-hover/item:shadow-md group-hover/item:border-blue-100 dark:group-hover/item:border-blue-900/50 transition-all relative overflow-hidden group-hover/item:bg-white dark:group-hover/item:bg-slate-900">
                                                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover/item:scale-150 duration-700" />
                                                <div className="relative font-light">
                                                    {campaign.client.contentPillars || "Not defined"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                                <Info className="w-3.5 h-3.5" />
                                                <span>Context pulled from Client Profile</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="competitors" className="m-0 space-y-8 animate-in fade-in duration-500">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                            <div>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-50 font-display tracking-tight">Competitor Analysis</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl leading-relaxed">
                                    Track and analyze competitor strategies. Monitor their live feeds and generate comparison slides.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button 
                                    variant="outline" 
                                    size="lg"
                                    onClick={generateCompetitorSlide} 
                                    disabled={competitors.length === 0}
                                    className="h-12 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
                                >
                                    <Layout className="w-5 h-5 mr-2 text-slate-400" /> 
                                    Generate Slide
                                </Button>
                                <Button 
                                    size="lg" 
                                    onClick={addCompetitor}
                                    className="h-12 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl shadow-lg shadow-slate-200 dark:shadow-none transition-all"
                                >
                                    <Plus className="w-5 h-5 mr-2" /> Add Competitor
                                </Button>
                            </div>
                        </div>

                        {/* AI Competitor Insights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { title: "Market Positioning", icon: Target, desc: "Analyze how competitors position their brand vs. yours." },
                                { title: "Content Strategy", icon: Layers, desc: "Identify top-performing content themes and formats." },
                                { title: "Engagement Analysis", icon: Activity, desc: "Compare audience engagement rates across channels." }
                            ].map((insight, i) => (
                                <div key={i} className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 p-4 rounded-xl flex items-start gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer group">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                        <insight.icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-bold text-slate-900 dark:text-blue-100 mb-1">{insight.title}</h5>
                                        <p className="text-xs text-slate-500 dark:text-blue-200/70 leading-relaxed">{insight.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {competitors.map((comp, idx) => (
                                <div key={comp._key || idx} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 group">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-4 flex-1">
                                                    <Input 
                                                        placeholder="Competitor Name" 
                                                        className="text-lg font-bold border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 px-0 h-auto py-1 bg-transparent placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-900 dark:text-white"
                                                        value={comp.name}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCompetitor(idx, 'name', e.target.value)}
                                                    />
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1 max-w-md">
                                                            <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                                            <Input 
                                                                placeholder="https://competitor.com" 
                                                                className="pl-9 h-10 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                                                value={comp.url}
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateCompetitor(idx, 'url', e.target.value)}
                                                            />
                                                        </div>
                                                        <Button 
                                                            size="icon" 
                                                            variant="outline" 
                                                            className="h-10 w-10 shrink-0 border-slate-200 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400" 
                                                            disabled={analyzingCompetitor === idx || !comp.url}
                                                            onClick={() => handleAnalyzeCompetitor(idx, comp.url)}
                                                            title="Analyze Competitor with AI"
                                                        >
                                                            {analyzingCompetitor === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full opacity-0 group-hover:opacity-100 transition-all" onClick={() => removeCompetitor(idx)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            
                                            <div className="relative">
                                                <Textarea 
                                                    placeholder="Add notes about their strategy, strengths, and weaknesses..." 
                                                    className="min-h-[100px] bg-slate-50/50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 rounded-xl resize-none focus:ring-blue-500/20 p-4 text-sm text-slate-700 dark:text-slate-300"
                                                    value={comp.notes}
                                                    onChange={(e) => updateCompetitor(idx, 'notes', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 flex flex-col">
                                            <div className="flex items-center justify-between mb-4">
                                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                    <Activity className="w-3.5 h-3.5 text-blue-500" /> Live Feed
                                                </h5>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    className="h-6 text-[10px] px-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                                                    onClick={() => handleRefreshFeed(idx, comp.name)}
                                                    disabled={refreshingFeed[idx]}
                                                >
                                                    {refreshingFeed[idx] ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3 mr-1" />}
                                                    Refresh
                                                </Button>
                                            </div>
                                            
                                            <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 rounded-xl p-1 overflow-hidden min-h-[150px]">
                                                {comp.feed && comp.feed.length > 0 ? (
                                                    <div className="space-y-1 h-full overflow-y-auto custom-scrollbar p-1">
                                                        {comp.feed.map((item: any, fIdx: number) => (
                                                            <a 
                                                                key={fIdx} 
                                                                href={item.url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="block p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all group/item shadow-sm"
                                                            >
                                                                <div className="text-xs font-medium line-clamp-2 text-slate-700 dark:text-slate-300 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 mb-1.5 leading-snug">
                                                                    {item.title}
                                                                </div>
                                                                <div className="flex justify-between text-[10px] text-slate-400">
                                                                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{item.source}</span>
                                                                    <span>{item.date}</span>
                                                                </div>
                                                            </a>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 italic text-xs p-4 text-center">
                                                        <Newspaper className="w-6 h-6 mb-2 opacity-20" />
                                                        No recent news found.
                                                        <br/>Try refreshing the feed.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {competitors.length === 0 && (
                                <div className="text-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 animate-in fade-in">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No competitors added</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mb-6">
                                        Add competitors to track their strategies, monitor news, and find differentiation opportunities.
                                    </p>
                                    <Button onClick={addCompetitor} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
                                        <Plus className="w-4 h-4 mr-2" /> Add First Competitor
                                    </Button>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="moodboard" className="m-0 space-y-6 animate-in fade-in duration-500 h-full">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                            <div>
                                <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-50 font-display tracking-tight">Visual Moodboard</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl leading-relaxed">
                                    Curate the visual direction. Upload images or drag from assets.
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-2 mr-4">
                                    {collaborators.map((c, i) => (
                                        <div key={i} className={`w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white ${c.color}`} title={c.name}>
                                            {c.name.charAt(0)}
                                        </div>
                                    ))}
                                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] text-slate-500">
                                        +2
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowMoodboardCanvas(!showMoodboardCanvas)}
                                    className={cn(
                                        "h-10 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                                        showMoodboardCanvas && "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                                    )}
                                >
                                    {showMoodboardCanvas ? <Layout className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
                                    {showMoodboardCanvas ? "Grid View" : "Canvas Mode"}
                                </Button>
                                {showMoodboardCanvas && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsMoodboardFullScreen(!isMoodboardFullScreen)}
                                        className={cn(
                                            "h-10 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                                            isMoodboardFullScreen && "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                                        )}
                                    >
                                        {isMoodboardFullScreen ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
                                        {isMoodboardFullScreen ? "Exit Full Screen" : "Full Screen"}
                                    </Button>
                                )}
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="moodboard-upload"
                                        className="hidden"
                                        multiple
                                        accept="image/*"
                                        onChange={handleAssetUpload}
                                        ref={assetInputRef}
                                    />
                                    <Button 
                                        variant="default" 
                                        size="lg"
                                        className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 shadow-lg px-6 rounded-xl transition-all"
                                        onClick={() => assetInputRef.current?.click()}
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Assets
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {showMoodboardCanvas ? (
                            <div className={cn(
                                "relative bg-slate-50 dark:bg-slate-900/50 overflow-hidden group/canvas cursor-crosshair transition-all duration-500",
                                isMoodboardFullScreen 
                                    ? "fixed inset-0 z-[100] w-screen h-screen rounded-none m-0" 
                                    : "h-[600px] rounded-2xl border border-slate-200 dark:border-slate-800"
                            )}>
                                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                                
                                {isMoodboardFullScreen && (
                                    <div className="absolute top-6 right-6 z-[110] flex gap-2">
                                        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            {collaborators.length + 1} viewing
                                        </div>
                                        <Button 
                                            size="sm" 
                                            variant="secondary"
                                            className="shadow-lg bg-white dark:bg-slate-800"
                                            onClick={() => setIsMoodboardFullScreen(false)}
                                        >
                                            <Minimize2 className="w-4 h-4 mr-2" /> Exit
                                        </Button>
                                    </div>
                                )}

                                <AnimatePresence>
                                    {moodboard.map((item, index) => (
                                        <motion.div
                                            key={item._key || index}
                                            drag
                                            dragMomentum={false}
                                            initial={{ opacity: 0, scale: 0.8, x: Math.random() * 400, y: Math.random() * 300 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ scale: 1.05, zIndex: 10, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
                                            whileDrag={{ scale: 1.1, zIndex: 50, cursor: "grabbing" }}
                                            className="absolute w-48 rounded-lg overflow-hidden shadow-md bg-white dark:bg-slate-800 p-2 pb-8 rotate-1 cursor-grab"
                                            style={{ left: 50 + (index * 50) % 500, top: 50 + (index * 30) % 300 }}
                                        >
                                            <div className="relative aspect-[4/5] w-full overflow-hidden rounded bg-slate-100 dark:bg-slate-900">
                                                <img 
                                                    src={item.url} 
                                                    alt="Moodboard item" 
                                                    className="w-full h-full object-cover pointer-events-none" 
                                                />
                                            </div>
                                            <div className="absolute bottom-2 left-2 right-2">
                                                <p className="text-[10px] font-medium text-slate-500 truncate">Image {index + 1}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {/* Mock Cursors */}
                                {collaborators.map((c, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute pointer-events-none z-50 flex items-start gap-1"
                                        animate={{ 
                                            x: [c.x, c.x + (Math.random() * 100 - 50), c.x - (Math.random() * 50)],
                                            y: [c.y, c.y + (Math.random() * 100 - 50), c.y - (Math.random() * 50)]
                                        }}
                                        transition={{ 
                                            duration: 5 + i, 
                                            repeat: Infinity, 
                                            repeatType: "reverse",
                                            ease: "easeInOut" 
                                        }}
                                    >
                                        <MousePointer2 className={`w-4 h-4 ${c.color.replace('bg-', 'text-')} fill-current`} />
                                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${c.color} shadow-sm`}>
                                            {c.name}
                                        </div>
                                    </motion.div>
                                ))}
                                
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    Canvas Mode Active • {collaborators.length + 1} viewing
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                <div 
                                    className="aspect-[4/5] rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 group"
                                    onClick={() => assetInputRef.current?.click()}
                                >
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-500 group-hover:text-slate-900 dark:group-hover:text-slate-200">Add Image</span>
                                </div>
                                {moodboard.map((item, index) => (
                                    <div key={item._key || index} className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                                        <img 
                                            src={item.url} 
                                            alt="Moodboard" 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                            <div className="flex gap-2 justify-end">
                                                <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm border-0">
                                                    <Maximize2 className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="destructive" 
                                                    className="h-8 w-8 rounded-full bg-red-500/80 hover:bg-red-600 backdrop-blur-sm border-0"
                                                    onClick={() => {
                                                        const newMoodboard = [...moodboard];
                                                        newMoodboard.splice(index, 1);
                                                        setMoodboard(newMoodboard);
                                                        setHasUnsavedChanges(true);
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="assets" className="m-0 space-y-6 h-full overflow-y-auto p-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                                <h4 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">Brand Assets</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-light mt-1">Centralized library for client logos, typography, and media.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input 
                                        placeholder="Search assets..." 
                                        value={assetSearch}
                                        onChange={(e) => setAssetSearch(e.target.value)}
                                        className="pl-9 w-40 md:w-56 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-9 text-sm rounded-full focus-visible:ring-blue-500"
                                    />
                                </div>
                                <Select value={assetFilter} onValueChange={setAssetFilter}>
                                    <SelectTrigger className="w-32 h-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-full text-sm">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="image">Images</SelectItem>
                                        <SelectItem value="font">Fonts</SelectItem>
                                        <SelectItem value="document">Docs</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block" />
                                <input type="file" ref={assetInputRef} className="hidden" onChange={handleAssetUpload} />
                                <Button size="sm" onClick={() => assetInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-full px-5 h-9 transition-all hover:scale-105 active:scale-95">
                                    <Upload className="w-3.5 h-3.5 mr-2" /> Upload
                                </Button>
                            </div>
                        </div>

                        {clientAssets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/50 dark:bg-slate-900/50">
                                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-6">
                                    <FolderOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h5 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No assets yet</h5>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs text-center mb-6">Upload logos, fonts, or images to use in the strategy.</p>
                                <Button variant="outline" onClick={() => assetInputRef.current?.click()}>
                                    Upload First Asset
                                </Button>
                            </div>
                        ) : filteredAssets.length === 0 ? (
                             <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <Search className="w-10 h-10 mb-4 opacity-20" />
                                <p className="text-sm">No assets match your search.</p>
                                <Button variant="link" onClick={() => {setAssetSearch(""); setAssetFilter("all");}}>Clear filters</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 pb-10">
                                {filteredAssets.map((asset: any, i: number) => (
                                    <div 
                                        key={i} 
                                        className="group relative aspect-square bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
                                        onClick={() => setViewAsset(asset)}
                                    >
                                        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse" />
                                        {asset.url || asset.file?.asset?.url ? (
                                            <img src={asset.url || asset.file?.asset?.url} alt="Asset" className="absolute inset-0 w-full h-full object-contain p-4 transition-transform group-hover:scale-105" />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                <FolderOpen className="w-10 h-10 opacity-50" />
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between">
                                            <p className="text-white text-xs font-medium truncate flex-1 mr-2">{asset.title || asset.name || "Unnamed Asset"}</p>
                                        </div>
                                        {asset.tags && asset.tags.length > 0 && (
                                            <div className="absolute top-2 right-2">
                                                <Badge variant="secondary" className="bg-black/50 hover:bg-black/70 text-white backdrop-blur-md border-0 text-[10px] h-5 px-1.5">
                                                    {asset.tags.length} tags
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <Dialog open={!!viewAsset} onOpenChange={(open) => !open && setViewAsset(null)}>
                            <DialogContent className="max-w-3xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 overflow-hidden">
                                <div className="relative aspect-video bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-8">
                                    {viewAsset && (viewAsset.url || viewAsset.file?.asset?.url) && (
                                        <img src={viewAsset.url || viewAsset.file?.asset?.url} alt="Asset Preview" className="max-w-full max-h-full object-contain shadow-2xl" />
                                    )}
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-slate-500 hover:text-white backdrop-blur-sm"
                                        onClick={() => setViewAsset(null)}
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                                <div className="p-6 bg-white dark:bg-slate-950 flex flex-col gap-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100">{viewAsset?.title || viewAsset?.name || "Asset Details"}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                                                {viewAsset?._key || "ID: ..."}
                                            </p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button variant="outline" onClick={() => window.open(viewAsset?.url || viewAsset?.file?.asset?.url, '_blank')}>
                                                <Download className="w-4 h-4 mr-2" /> Download
                                            </Button>
                                            <Button variant="destructive" onClick={() => handleDeleteAsset(viewAsset?._key)}>
                                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold uppercase text-slate-500">Tags</Label>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {viewAsset?.tags?.map((tag: string, i: number) => (
                                                    <Badge key={i} variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 pr-1 gap-1">
                                                        {tag}
                                                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500 rounded-full p-0.5 transition-colors">
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                                {(!viewAsset?.tags || viewAsset.tags.length === 0) && (
                                                    <p className="text-sm text-slate-400 italic">No tags added</p>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <Input 
                                                    value={newTag} 
                                                    onChange={(e) => setNewTag(e.target.value)} 
                                                    placeholder="Add tag..." 
                                                    className="h-8 text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                                />
                                                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={handleAddTag}>
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        
                                        {viewAsset?.aiSuggestedTags && viewAsset.aiSuggestedTags.length > 0 && (
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold uppercase text-blue-500 flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" /> AI Suggestions
                                                </Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {viewAsset.aiSuggestedTags.map((tag: string, i: number) => (
                                                        <Badge key={i} variant="outline" className="border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>

                    <TabsContent value="comments" className="m-0 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold uppercase text-slate-500">
                                    Slide Comments ({activeSlide.comments?.length || 0})
                                </Label>
                            </div>
                            
                            {(activeSlide.comments || []).length === 0 ? (
                                <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50">
                                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                    <p className="text-sm font-medium">No comments yet</p>
                                    <p className="text-xs text-slate-500 mt-1">Comments from the client or team will appear here.</p>
                                    <div className="flex gap-2 mt-4 w-full max-w-sm">
                                        <Input 
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Type a note..."
                                            className="text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                                        />
                                        <Button size="sm" onClick={handlePostComment}>Post</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activeSlide.comments?.map((comment, idx) => (
                                        <div key={idx} className={`p-3 rounded border text-sm shadow-sm ${comment.resolved ? 'bg-slate-50 dark:bg-slate-800 opacity-70' : 'bg-white dark:bg-slate-900'}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">{comment.author}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-400">
                                                        {new Date(comment.date).toLocaleDateString()}
                                                    </span>
                                                    {comment.resolved ? (
                                                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                            <Check className="w-3 h-3" /> Resolved
                                                        </span>
                                                    ) : (
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="h-6 text-xs px-2" 
                                                            onClick={() => handleResolveComment(activeSlide._key, comment._key)}
                                                        >
                                                            Resolve
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300">{comment.text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                </div>
            </div>
        </Tabs>
      </div>

      {/* Full Screen Moodboard Canvas Overlay */}
      {showMoodboardCanvas && (
        <div className="fixed inset-0 z-50 bg-slate-100 dark:bg-slate-900 flex flex-col animate-in fade-in duration-300">
            {/* Toolbar */}
            <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between px-4 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Layout className="w-5 h-5 text-blue-600" />
                        Moodboard Canvas
                    </h3>
                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Users className="w-3 h-3" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">2 Collaborators Live</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <ImagePlus className="w-4 h-4 mr-2" /> Add Image
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowMoodboardCanvas(false)}>
                        Close
                    </Button>
                    <Button size="sm" className="bg-blue-600 text-white" onClick={() => setShowMoodboardCanvas(false)}>
                        Done
                    </Button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 overflow-hidden relative bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-slate-50 dark:bg-slate-900/50 cursor-grab active:cursor-grabbing">
                 {/* Mock Collaborator Cursors */}
                 {collaborators.map((c, i) => (
                    <motion.div
                        key={i}
                        className="absolute pointer-events-none z-20 flex items-start gap-1"
                        initial={{ x: c.x, y: c.y, opacity: 0 }}
                        animate={{ 
                            x: [c.x, c.x + (Math.random() * 100 - 50), c.x - (Math.random() * 50)], 
                            y: [c.y, c.y + (Math.random() * 100 - 50), c.y - (Math.random() * 50)],
                            opacity: 1
                        }}
                        transition={{ 
                            repeat: Infinity, 
                            repeatType: "reverse", 
                            duration: 3 + i,
                            ease: "easeInOut"
                        }}
                    >
                        <MousePointer2 className={`w-4 h-4 ${c.color.replace('bg-', 'text-')}`} />
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${c.color}`}>
                            {c.name}
                        </span>
                    </motion.div>
                 ))}

                 {/* Draggable Moodboard Images */}
                 {moodboard.map((item, i) => (
                    <motion.div
                        key={item._key}
                        drag
                        dragMomentum={false}
                        className="absolute w-64 bg-white dark:bg-slate-800 p-2 shadow-xl rounded-lg border border-slate-200 dark:border-slate-700 group cursor-grab active:cursor-grabbing"
                        style={{ 
                            left: 100 + (i % 4) * 280, 
                            top: 100 + Math.floor(i / 4) * 300,
                            rotate: (i % 2 === 0 ? 2 : -2)
                        }}
                        whileHover={{ scale: 1.05, zIndex: 10, rotate: 0 }}
                        whileDrag={{ scale: 1.1, zIndex: 20, cursor: "grabbing" }}
                    >
                        <div className="aspect-square bg-slate-100 dark:bg-slate-900 rounded overflow-hidden mb-2 pointer-events-none">
                            {item.url ? (
                                <img src={item.url} alt="Moodboard" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                    <ImageIcon className="w-8 h-8" />
                                </div>
                            )}
                        </div>
                        {item.note && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-handwriting">{item.note}</p>
                        )}
                        
                        {/* Hover Actions */}
                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button 
                                size="icon" 
                                variant="destructive" 
                                className="h-6 w-6 rounded-full shadow-sm" 
                                onClick={() => {
                                    const newM = [...moodboard];
                                    newM.splice(i, 1);
                                    setMoodboard(newM);
                                    setHasUnsavedChanges(true);
                                }}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                    </motion.div>
                 ))}

                 {moodboard.length === 0 && (
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div className="text-center opacity-30">
                             <Layout className="w-24 h-24 mx-auto mb-4" />
                             <h2 className="text-2xl font-bold">Empty Canvas</h2>
                             <p>Upload images to start brainstorming</p>
                         </div>
                     </div>
                 )}
            </div>
        </div>
      )}

      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
         <DialogContent>
             <DialogHeader>
                 <DialogTitle>Convert to Deliverables</DialogTitle>
                 <DialogDescription>
                     This will create {proposedDeliverables.length} new deliverables in the &quot;Briefs&quot; tab based on your plan. You can then assign them to creators.
                 </DialogDescription>
             </DialogHeader>
             <DialogFooter>
                 <Button variant="ghost" onClick={() => setShowConvertDialog(false)}>Cancel</Button>
                 <Button 
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleConvertToDeliverables}
                    disabled={generatingDeliverables}
                >
                    {generatingDeliverables ? "Converting..." : "Yes, Convert"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Submit for Review</DialogTitle>
                <DialogDescription>
                    Are you sure you want to submit this strategy deck to the client? They will be able to view the presentation and provide feedback.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
                <Button 
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={handleSubmit}
                    disabled={isSaving}
                >
                    {isSaving ? "Submitting..." : "Yes, Submit"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
