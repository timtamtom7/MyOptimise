"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, Trash2, Layout, Image as ImageIcon, Sparkles, Globe, ArrowRight, Loader2, Presentation, ArrowUp, ArrowDown, Upload, ImagePlus, Eye, MessageSquare, Check, Bold, Italic, List, Heading1, Heading2, ListOrdered, Grid2X2, Type, Columns2, AlignLeft, BookOpen, Target, Search, Users, Palette, Printer, Package, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { updateCampaignDeck, uploadMoodboardImage, submitStrategy, resolveStrategySlideComment, generateDeliverablePlan, generateContextSuggestions } from "@/app/actions/campaigns";
import { motion, AnimatePresence } from "framer-motion";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { analyzeUrl, generateSlideContent, refreshCompetitorFeed, predictDeliverableSuccess } from "@/app/actions/research-tools";
import { generateDeliverablesFromStrategy } from "@/app/actions/campaign-automation";
import { AIResearchAssistant } from "@/components/dashboard/employee/ai-research-assistant";
import { StrategyPresentation } from "@/components/flow/client/strategy-presentation";
import ReactMarkdown from "react-markdown";
import { urlFor } from "@/sanity/lib/image";
import { RefreshCcw, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface Slide {
  _key: string;
  title: string;
  layout: "title" | "text" | "split" | "grid" | "image" | "quote" | "stats" | "comparison";
  content: string;
  notes?: string;
  imageUrl?: string;
  imageAssetId?: string;
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
        label: "Timeline",
        icon: ListOrdered,
        slide: {
            title: "Project Timeline",
            layout: "text" as const,
            content: "## Phase 1: Launch\n- [ ] Week 1: Setup\n- [ ] Week 2: Go Live\n\n## Phase 2: Growth\n- [ ] Month 1: Optimization\n- [ ] Month 2: Scale"
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
  user: any;
}

export function CampaignStrategyTab({ campaign, user }: CampaignStrategyTabProps) {
  // Initial state from campaign or default
  const [slides, setSlides] = useState<Slide[]>(
    campaign.strategyDeck?.slides?.map((s: any) => ({
        ...s,
        imageUrl: s.image ? urlFor(s.image).url() : s.imageUrl,
        imageAssetId: s.image?.asset?._ref
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

  // Strategy Context State
  const [targetAudience, setTargetAudience] = useState(campaign.strategyDeck?.targetAudience || "");
  const [toneOfVoice, setToneOfVoice] = useState(campaign.strategyDeck?.toneOfVoice || "");
  const [strategicPillars, setStrategicPillars] = useState<string[]>(campaign.strategyDeck?.strategicPillars || []);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatingDeliverables, setGeneratingDeliverables] = useState(false);
  const [planError, setPlanError] = useState("");
  const [activeTab, setActiveTab] = useState("context");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

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
  const [predictingDeliverable, setPredictingDeliverable] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slideFileInputRef = useRef<HTMLInputElement>(null);

  const handleConvertToDeliverables = async () => {
    if (!confirm("This will create actual Deliverable documents in the database based on this plan. Continue?")) return;
    
    setGeneratingDeliverables(true);
    try {
        const result = await generateDeliverablesFromStrategy(campaign._id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(`Successfully created ${result.count} deliverables!`);
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
  async function handlePredictSuccess(index: number) {
      const deliverable = proposedDeliverables[index];
      setPredictingDeliverable(prev => ({ ...prev, [index]: true }));
      try {
          const context = { targetAudience, toneOfVoice, strategicPillars };
          const res = await predictDeliverableSuccess(context, deliverable);
          if (res.success && res.prediction) {
              updateProposedDeliverable(index, 'prediction', res.prediction);
              toast.success("Prediction generated");
          } else {
              toast.error("Failed to predict success");
          }
      } catch (e) {
          toast.error("Error generating prediction");
      } finally {
          setPredictingDeliverable(prev => ({ ...prev, [index]: false }));
      }
  }

  const addSlideWithTemplate = (templateId: string) => {
    const template = SLIDE_TEMPLATES.find(t => t.id === templateId)?.slide || SLIDE_TEMPLATES[0].slide;
    const newSlide: Slide = {
        _key: Math.random().toString(36).substr(2, 9),
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
          _key: Math.random().toString(36).substr(2, 9),
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
            _key: Math.random().toString(36).substr(2, 9), 
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

  // Moodboard Actions
  const addMoodboardItem = () => {
    setMoodboard([...moodboard, { _key: Math.random().toString(36), type: "image", url: "", note: "" }]);
    setHasUnsavedChanges(true);
  };

  const updateMoodboardItem = (index: number, field: string, value: string) => {
    const newMoodboard = [...moodboard];
    newMoodboard[index] = { ...newMoodboard[index], [field]: value };
    setMoodboard(newMoodboard);
    setHasUnsavedChanges(true);
  };

  const removeMoodboardItem = (index: number) => {
    const newMoodboard = [...moodboard];
    newMoodboard.splice(index, 1);
    setMoodboard(newMoodboard);
    setHasUnsavedChanges(true);
  };

  // Pillar Actions
  const addPillar = () => {
    setStrategicPillars([...strategicPillars, ""]);
    setHasUnsavedChanges(true);
  };

  const updatePillar = (index: number, value: string) => {
    const newPillars = [...strategicPillars];
    newPillars[index] = value;
    setStrategicPillars(newPillars);
    setHasUnsavedChanges(true);
  };

  const removePillar = (index: number) => {
    const newPillars = [...strategicPillars];
    newPillars.splice(index, 1);
    setStrategicPillars(newPillars);
    setHasUnsavedChanges(true);
  };

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
        research: [], // TODO: If we store research items, pass them here
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
                _key: Math.random().toString(36).substr(2, 9),
                ...d,
                assets: mappedAssets
            };
        });
        setProposedDeliverables([...proposedDeliverables, ...newItems]);
        setHasUnsavedChanges(true);
        toast.success("AI generated a plan!");
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
        } : undefined
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
      strategicPillars: strategicPillars.filter(p => p.trim()),
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
      if (!confirm("Submit strategy for client review?")) return;
      setIsSaving(true);
      
      // Save content first
      await handleSave();

      const formData = new FormData();
      formData.append("campaignId", campaign._id);
      
      try {
          const res = await submitStrategy(formData);
          if (res.success) {
              toast.success("Submitted for review");
          } else {
              toast.error("Failed to submit");
          }
      } catch (e) {
          toast.error("Error submitting");
      } finally {
          setIsSaving(false);
      }
  }

  const [isGeneratingContext, setIsGeneratingContext] = useState(false);

  async function handleGenerateContextSuggestions() {
      setIsGeneratingContext(true);
      try {
          const res = await generateContextSuggestions(campaign.client.name, campaign.client.industry || "General");
          if (res.success && res.suggestions) {
              if (!targetAudience) setTargetAudience(res.suggestions.targetAudience);
              if (!toneOfVoice) setToneOfVoice(res.suggestions.toneOfVoice);
              if (strategicPillars.length === 0) setStrategicPillars(res.suggestions.pillars);
              toast.success("Context suggestions applied!");
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
    <div className="h-[calc(100vh-200px)] flex flex-col lg:flex-row gap-6">
      
      {/* Hidden inputs for file uploads */}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleMoodboardUpload} />
      <input type="file" ref={slideFileInputRef} className="hidden" accept="image/*" onChange={handleSlideImageUpload} />

      {/* LEFT: Slide List */}
      <div className="w-full lg:w-64 flex flex-col border-r border-slate-200 dark:border-slate-800 pr-6">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-slate-500 text-sm uppercase tracking-wider">Slides</h3>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline"><Plus className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {SLIDE_TEMPLATES.map(template => (
                        <DropdownMenuItem key={template.id} onClick={() => addSlideWithTemplate(template.id)}>
                            <template.icon className="w-4 h-4 mr-2" />
                            {template.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div className="space-y-2 overflow-y-auto flex-1 pr-2">
            {slides.map((slide, idx) => (
                <div 
                    key={slide._key}
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        idx === activeSlideIndex 
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500" 
                        : "border-slate-200 dark:border-slate-800 hover:border-blue-300"
                    }`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-mono text-slate-400">#{idx + 1}</span>
                        <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-4 w-4" onClick={(e) => { e.stopPropagation(); moveSlide(idx, 'up'); }} disabled={idx === 0}>
                                <ArrowUp className="w-3 h-3 text-slate-400" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-4 w-4" onClick={(e) => { e.stopPropagation(); moveSlide(idx, 'down'); }} disabled={idx === slides.length - 1}>
                                <ArrowDown className="w-3 h-3 text-slate-400" />
                            </Button>
                            {slides.length > 1 && (
                                <Trash2 className="w-3 h-3 text-slate-300 hover:text-red-500 ml-1" onClick={(e) => {
                                    e.stopPropagation();
                                    removeSlide(idx);
                                }} />
                            )}
                        </div>
                    </div>
                    <p className="text-sm font-medium truncate">{slide.title}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-[10px] h-5">{slide.layout}</Badge>
                        {(slide.comments?.length || 0) > 0 && (
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-red-50 text-red-600 border-red-200 gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {slide.comments?.length}
                            </Badge>
                        )}
                    </div>
                </div>
            ))}
        </div>
        <div className="pt-4 border-t mt-4 space-y-2">
             <div className="grid grid-cols-2 gap-2">
                 <Button className="w-full" onClick={() => setShowPreview(true)} variant="outline">
                    <Eye className="w-4 h-4 mr-2" /> Preview
                 </Button>
                 <Button className="w-full" onClick={() => setShowPrintPreview(true)} variant="outline">
                    <Printer className="w-4 h-4 mr-2" /> Export Pitch Deck
                 </Button>
             </div>
             <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Deck
             </Button>
             {campaign.strategyDeck?.status !== "review" && campaign.strategyDeck?.status !== "approved" && (
                <Button className="w-full" variant="secondary" onClick={handleSubmit} disabled={isSaving}>
                    <Presentation className="w-4 h-4 mr-2" />
                    Submit for Review
                </Button>
             )}
        </div>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0 border-none bg-transparent shadow-none">
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
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0 border-none bg-transparent shadow-none">
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
      <div className="flex-1 flex flex-col min-w-0">
         <Card className="flex-1 flex flex-col border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="border-b p-4 flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex-1">
                    <Label className="text-xs text-slate-500 mb-1 block">Slide Title</Label>
                    <Input 
                        value={activeSlide.title} 
                        onChange={(e) => updateSlide(activeSlide._key, { title: e.target.value })}
                        className="font-display text-lg bg-transparent border-transparent hover:border-slate-200 focus:border-blue-500 px-2 -ml-2 h-auto py-1"
                    />
                </div>
                <div>
                    <Label className="text-xs text-slate-500 mb-1 block">Layout</Label>
                    <Select 
                        value={activeSlide.layout} 
                        onValueChange={(val: any) => updateSlide(activeSlide._key, { layout: val })}
                    >
                        <SelectTrigger className="w-[140px]">
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
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-slate-100/50 dark:bg-slate-950/50">
                {/* Visual Preview / Edit Area */}
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border p-8 min-h-[400px] h-full relative group">
                     <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleGenerateContent}
                     >
                        <Sparkles className="w-4 h-4 mr-2 text-purple-500" /> AI Write
                     </Button>

                     {activeSlide.layout === 'title' && (
                         <div className="h-full flex flex-col justify-center items-center text-center space-y-4">
                             <h1 className="text-4xl font-bold">{activeSlide.title}</h1>
                             <div className="w-full max-w-lg text-left">
                                <MarkdownToolbar onInsert={handleMarkdownInsert} />
                                <Textarea 
                                    ref={editorRef}
                                    value={activeSlide.content}
                                    onChange={(e) => updateSlide(activeSlide._key, { content: e.target.value })}
                                    className="text-center border-none shadow-none resize-none focus-visible:ring-0 text-slate-500 text-xl"
                                    rows={4}
                                />
                             </div>
                         </div>
                     )}

                     {(activeSlide.layout === 'text' || activeSlide.layout === 'grid') && (
                         <div className="h-full flex flex-col">
                             <h2 className="text-3xl font-bold mb-6">{activeSlide.title}</h2>
                             <div className="flex-1 flex flex-col">
                                <MarkdownToolbar onInsert={handleMarkdownInsert} />
                                <Textarea 
                                    ref={editorRef}
                                    value={activeSlide.content}
                                    onChange={(e) => updateSlide(activeSlide._key, { content: e.target.value })}
                                    className="flex-1 border-none shadow-none resize-none focus-visible:ring-0 text-slate-700 text-lg leading-relaxed font-sans"
                                    placeholder="# Heading 1..."
                                />
                             </div>
                         </div>
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
                                        onChange={(e) => updateSlide(activeSlide._key, { content: e.target.value })}
                                        className="flex-1 border-none shadow-none resize-none focus-visible:ring-0 text-slate-700 text-base leading-relaxed"
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
                             <MessageSquare className="w-12 h-12 text-purple-200 mb-6" />
                             <div className="w-full">
                                <MarkdownToolbar onInsert={handleMarkdownInsert} />
                                <Textarea 
                                    ref={editorRef}
                                    value={activeSlide.content}
                                    onChange={(e) => updateSlide(activeSlide._key, { content: e.target.value })}
                                    className="text-center border-none shadow-none resize-none focus-visible:ring-0 text-slate-700 text-2xl font-serif italic leading-relaxed"
                                    rows={6}
                                    placeholder="Enter quote here..."
                                />
                             </div>
                         </div>
                     )}

                     {activeSlide.layout === 'stats' && (
                         <div className="h-full flex flex-col">
                             <h2 className="text-2xl font-bold mb-8 text-center">{activeSlide.title}</h2>
                             <div className="flex-1 flex flex-col justify-center">
                                <MarkdownToolbar onInsert={handleMarkdownInsert} />
                                <Textarea 
                                    ref={editorRef}
                                    value={activeSlide.content}
                                    onChange={(e) => updateSlide(activeSlide._key, { content: e.target.value })}
                                    className="flex-1 border-none shadow-none resize-none focus-visible:ring-0 text-slate-700 text-center text-lg"
                                    placeholder="## 100% \n Label"
                                />
                             </div>
                         </div>
                     )}

                     {activeSlide.layout === 'comparison' && (
                         <div className="h-full flex flex-col">
                             <h2 className="text-2xl font-bold mb-6 text-center">{activeSlide.title}</h2>
                             <div className="flex-1 flex flex-col">
                                <MarkdownToolbar onInsert={handleMarkdownInsert} />
                                <Textarea 
                                    ref={editorRef}
                                    value={activeSlide.content}
                                    onChange={(e) => updateSlide(activeSlide._key, { content: e.target.value })}
                                    className="flex-1 border-none shadow-none resize-none focus-visible:ring-0 text-slate-700 text-base"
                                    placeholder="## Us\n- Good\n\n## Them\n- Bad"
                                />
                             </div>
                         </div>
                     )}
                </div>
            </div>
         </Card>
      </div>

      {/* RIGHT: Research & Tools */}
      <div className="w-full lg:w-[450px] flex flex-col gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-1 rounded-t-lg border-b border-x border-t relative overflow-hidden">
                <TabsList className="w-full grid grid-cols-6 h-auto p-1 bg-transparent relative z-10">
                    {[
                        { id: "context", icon: BookOpen, label: "Context" },
                        { id: "plan", icon: Target, label: "Plan" },
                        { id: "research", icon: Search, label: "Research" },
                        { id: "competitors", icon: Users, label: "Competitors" },
                        { id: "moodboard", icon: Palette, label: "Moodboard" },
                        { id: "assets", icon: FolderOpen, label: "Assets" },
                        { id: "comments", icon: MessageSquare, label: "Comments", hasBadge: (activeSlide.comments?.length || 0) > 0 }
                    ].map((tab) => (
                        <TabsTrigger 
                            key={tab.id}
                            value={tab.id} 
                            className="relative py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none transition-colors duration-200 group"
                            onMouseEnter={() => setHoveredTab(tab.id)}
                            onMouseLeave={() => setHoveredTab(null)}
                        >
                            <tab.icon className="w-4 h-4 z-20 relative transition-colors duration-200 group-hover:text-purple-600 data-[state=active]:text-purple-600" />
                            {tab.hasBadge && (
                                <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full z-20" />
                            )}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-md shadow-sm z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}

                            {hoveredTab === tab.id && activeTab !== tab.id && (
                                <motion.div
                                    layoutId="hoverTab"
                                    className="absolute inset-0 bg-slate-200/50 dark:bg-slate-700/50 rounded-md z-0"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                />
                            )}
                            
                            {/* Hover Tooltip Card */}
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
                                <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap transform translate-y-1 group-hover:translate-y-0">
                                    {tab.label}
                                </div>
                            </div>
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden rounded-t-none border-t-0">
                <CardContent className="p-4 flex-1 overflow-y-auto space-y-6">
                    
                    <TabsContent value="context" className="m-0 space-y-6">
                        <div className="flex justify-end mb-2">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                onClick={handleGenerateContextSuggestions}
                                disabled={isGeneratingContext}
                            >
                                {isGeneratingContext ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                Auto-Fill with AI
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-xs mb-1.5 block">Target Audience</Label>
                                <Textarea 
                                    value={targetAudience}
                                    onChange={(e) => setTargetAudience(e.target.value)}
                                    placeholder="Who are we talking to?"
                                    className="text-sm h-24 resize-none"
                                />
                            </div>
                            
                            <div>
                                <Label className="text-xs mb-1.5 block">Tone of Voice</Label>
                                <Input 
                                    value={toneOfVoice}
                                    onChange={(e) => setToneOfVoice(e.target.value)}
                                    placeholder="e.g. Professional, Witty..."
                                    className="text-sm"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <Label className="text-xs">Strategic Pillars</Label>
                                    <Button size="sm" variant="ghost" className="h-5 px-2 text-xs" onClick={addPillar}>
                                        <Plus className="w-3 h-3 mr-1" /> Add
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {strategicPillars.map((pillar, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <Input 
                                                value={pillar}
                                                onChange={(e) => updatePillar(idx, e.target.value)}
                                                className="text-sm h-8"
                                                placeholder={`Pillar ${idx + 1}`}
                                            />
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                onClick={() => removePillar(idx)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                    {strategicPillars.length === 0 && (
                                        <div className="text-xs text-slate-400 italic text-center py-2 border border-dashed rounded">
                                            No pillars defined
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="plan" className="m-0 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Target className="w-4 h-4 text-purple-500" />
                                <h3 className="text-sm font-semibold">Deliverables Plan</h3>
                        </div>
                        <div className="flex items-center gap-2">
                             <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleConvertToDeliverables} 
                                disabled={generatingDeliverables || proposedDeliverables.length === 0}
                                className="h-8 text-xs"
                            >
                                {generatingDeliverables ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Package className="w-3 h-3 mr-1" />}
                                Convert to Briefs
                            </Button>
                            <Button variant="ghost" size="sm" onClick={addProposedDeliverable}>
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                        <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg border border-purple-100 dark:border-purple-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-sm font-medium">AI Strategy Helper</span>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 dark:bg-purple-900 dark:text-purple-100"
                                    onClick={handleGeneratePlan}
                                    disabled={isGeneratingPlan}
                                >
                                    {isGeneratingPlan ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                                    Generate Plan
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Automatically suggest deliverables based on your strategy context, research, and competitor analysis.
                            </p>
                            {planError && (
                                <div className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
                                    {planError}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Accordion type="single" collapsible className="w-full space-y-2">
                                {proposedDeliverables.map((item, i) => (
                                    <AccordionItem key={item._key} value={item._key} className="border rounded-lg bg-white dark:bg-slate-900 px-3">
                                        <AccordionTrigger className="hover:no-underline py-3">
                                            <div className="flex items-center gap-3 w-full text-left">
                                                <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 text-xs font-bold shrink-0">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">{item.title || "Untitled"}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <span className="capitalize">{item.platform}</span>
                                                        <span>•</span>
                                                        <span className="capitalize">{item.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pt-2 pb-4 space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs">Title</Label>
                                                <Input 
                                                    value={item.title} 
                                                    onChange={(e) => updateProposedDeliverable(i, 'title', e.target.value)}
                                                    className="h-8 text-sm"
                                                    placeholder="e.g. Day in the life"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Platform</Label>
                                                    <Select 
                                                        value={item.platform} 
                                                        onValueChange={(val) => updateProposedDeliverable(i, 'platform', val)}
                                                    >
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="instagram">Instagram</SelectItem>
                                                            <SelectItem value="tiktok">TikTok</SelectItem>
                                                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                                                            <SelectItem value="youtube">YouTube</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Format</Label>
                                                    <Select 
                                                        value={item.type} 
                                                        onValueChange={(val) => updateProposedDeliverable(i, 'type', val)}
                                                    >
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue />
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

                                            <div className="space-y-2">
                                                <Label className="text-xs">Concept Description</Label>
                                                <Textarea 
                                                    value={item.description}
                                                    onChange={(e) => updateProposedDeliverable(i, 'description', e.target.value)}
                                                    className="min-h-[80px] text-sm resize-none"
                                                    placeholder="Describe the content idea..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs">Visual Direction</Label>
                                                <Textarea 
                                                    value={item.visualDirection || ""}
                                                    onChange={(e) => updateProposedDeliverable(i, 'visualDirection', e.target.value)}
                                                    className="min-h-[60px] text-sm resize-none"
                                                    placeholder="Fast paced, dark mode, upbeat music..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-xs">Assets & References</Label>
                                                <div className="grid grid-cols-5 gap-2">
                                                    {moodboard.map((m) => {
                                                        const isSelected = item.assets?.some((a: any) => a._key === m._key);
                                                        return (
                                                            <div 
                                                                key={m._key}
                                                                onClick={() => toggleAssetSelection(i, m)}
                                                                className={cn(
                                                                    "aspect-square rounded-md overflow-hidden relative cursor-pointer border-2 transition-all",
                                                                    isSelected ? "border-purple-500 ring-2 ring-purple-200" : "border-transparent opacity-70 hover:opacity-100"
                                                                )}
                                                            >
                                                                <img src={m.url} alt="Asset thumbnail" className="w-full h-full object-cover" />
                                                                {isSelected && (
                                                                    <div className="absolute top-1 right-1 bg-purple-500 text-white rounded-full p-0.5">
                                                                        <Check className="w-3 h-3" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                     <div 
                                                        className="aspect-square rounded-md border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-purple-300 hover:bg-slate-50 transition-colors" 
                                                        onClick={() => fileInputRef.current?.click()}
                                                     >
                                                        <Upload className="w-4 h-4 text-slate-400 mb-1" />
                                                        <span className="text-[10px] text-slate-400">Upload</span>
                                                    </div>
                                                </div>
                                                {(!moodboard || moodboard.length === 0) && (
                                                    <p className="text-[10px] text-muted-foreground italic">
                                                        No moodboard images found. Upload assets to the Moodboard tab first, or click Upload above.
                                                    </p>
                                                )}
                                            </div>

                                            <div className="pt-4 border-t mt-4">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-semibold uppercase text-slate-500 flex items-center gap-2">
                                                        <Sparkles className="w-3 h-3 text-purple-500" /> Performance Prediction
                                                    </h4>
                                                    {!item.prediction ? (
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost" 
                                                            className="h-6 text-[10px] text-purple-600 hover:bg-purple-50"
                                                            onClick={() => handlePredictSuccess(i)}
                                                            disabled={predictingDeliverable[i]}
                                                        >
                                                            {predictingDeliverable[i] ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : "Predict Success"}
                                                        </Button>
                                                    ) : (
                                                        <div className="relative group">
                                                            <div className={cn(
                                                                "text-sm font-bold px-2 py-1 rounded cursor-help border",
                                                                item.prediction.score >= 80 ? "bg-green-50 text-green-700 border-green-200" :
                                                                item.prediction.score >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                                                                "bg-red-50 text-red-700 border-red-200"
                                                            )}>
                                                                {item.prediction.score}/100
                                                            </div>
                                                            <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-800 text-slate-50 text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                                <div className="font-semibold mb-2 text-slate-200">Optimization Advice:</div>
                                                                <ul className="space-y-1.5">
                                                                    {item.prediction.advice.map((tip, idx) => (
                                                                        <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                                                                            <span className="text-purple-400 mt-0.5">•</span>
                                                                            {tip}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                                <div className="absolute bottom-[-4px] right-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pt-2 flex justify-end">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 text-xs"
                                                    onClick={() => removeProposedDeliverable(i)}
                                                >
                                                    <Trash2 className="w-3 h-3 mr-1" /> Remove
                                                </Button>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                            
                            {proposedDeliverables.length === 0 && (
                                <div className="text-center p-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                    No deliverables planned yet.
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="research" className="m-0 space-y-6">
                        {/* AI Research Assistant */}
                        <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
                            <h4 className="text-xs font-semibold uppercase text-purple-600 mb-2 flex items-center">
                                <Sparkles className="w-3 h-3 mr-1" /> AI Strategy Copilot
                            </h4>
                            <p className="text-xs text-slate-500 mb-3">
                                Chat with AI to generate content pillars, research competitors, and brainstorm campaign ideas.
                            </p>
                            <div className="w-full">
                                <AIResearchAssistant 
                                    client={campaign.client} 
                                    activeCampaigns={[campaign]} 
                                    context={{ activeSlide, allSlides: slides }}
                                />
                            </div>
                        </div>

                        {/* URL Analyzer */}
                        <div className="space-y-3">
                            <Label className="text-xs">Analyze URL</Label>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="https://competitor.com" 
                                    value={researchUrl}
                                    onChange={(e) => setResearchUrl(e.target.value)}
                                    className="text-xs"
                                />
                                <Button size="icon" onClick={handleAnalyzeUrl} disabled={isAnalyzing}>
                                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* Analysis Result */}
                        {analysisResult && (
                            <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-3 text-xs space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold text-purple-600">AI Insights</span>
                                    <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => {
                                        // Append to current slide notes or content
                                        const currentContent = activeSlide.content;
                                        updateSlide(activeSlide._key, { content: currentContent + "\n\n" + analysisResult });
                                        toast.success("Added to slide");
                                    }}>
                                        Add to Slide
                                    </Button>
                                </div>
                                <div className="prose dark:prose-invert prose-xs max-w-none max-h-60 overflow-y-auto">
                                    <ReactMarkdown>{analysisResult}</ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {/* Extracted Images */}
                        {extractedImages.length > 0 && (
                            <div className="space-y-3 pt-4 border-t">
                                <Label className="text-xs">Extracted Images (Click to Add to Moodboard)</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {extractedImages.map((src, i) => (
                                        <div 
                                            key={i} 
                                            className="aspect-square bg-slate-100 rounded border overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 relative group"
                                            onClick={() => {
                                                setMoodboard([...moodboard, { _key: Math.random().toString(36), type: "image", url: src, note: "From " + researchUrl }]);
                                                toast.success("Added to Moodboard");
                                            }}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={src} alt="Extracted" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <Plus className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Context Data */}
                        <div className="space-y-4 pt-4 border-t">
                            <h4 className="text-xs font-semibold uppercase text-slate-500">Client Context</h4>
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded text-xs">
                                <span className="font-semibold block mb-1">Goal:</span>
                                {campaign.client.creativeGoal || "Not defined"}
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded text-xs">
                                <span className="font-semibold block mb-1">Pillars:</span>
                                {campaign.client.contentPillars || "Not defined"}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="competitors" className="m-0 space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-semibold uppercase text-slate-500">Competitor List</h4>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={generateCompetitorSlide} disabled={competitors.length === 0}>
                                    <Layout className="w-3 h-3 mr-1" /> Generate Slide
                                </Button>
                                <Button size="sm" variant="ghost" onClick={addCompetitor}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {competitors.map((comp, idx) => (
                                <div key={comp._key || idx} className="bg-slate-50 dark:bg-slate-900 p-3 rounded border space-y-2">
                                    <div className="flex justify-between gap-2">
                                        <Input 
                                            placeholder="Competitor Name" 
                                            className="h-7 text-xs" 
                                            value={comp.name}
                                            onChange={(e) => updateCompetitor(idx, 'name', e.target.value)}
                                        />
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeCompetitor(idx)}>
                                            <Trash2 className="w-3 h-3 text-red-400" />
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="Website URL" 
                                            className="h-7 text-xs" 
                                            value={comp.url}
                                            onChange={(e) => updateCompetitor(idx, 'url', e.target.value)}
                                        />
                                        <Button 
                                            size="icon" 
                                            variant="outline" 
                                            className="h-7 w-7 shrink-0" 
                                            disabled={analyzingCompetitor === idx || !comp.url}
                                            onClick={() => handleAnalyzeCompetitor(idx, comp.url)}
                                            title="Analyze Competitor with AI"
                                        >
                                            {analyzingCompetitor === idx ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-purple-500" />}
                                        </Button>
                                    </div>
                                    <Textarea 
                                        placeholder="Notes..." 
                                        className="text-xs min-h-[60px]"
                                        value={comp.notes}
                                        onChange={(e) => updateCompetitor(idx, 'notes', e.target.value)}
                                    />
                                    
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <h5 className="text-[10px] font-semibold uppercase text-slate-500 flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" /> Live Feed
                                        </h5>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className="h-5 text-[10px] px-2 text-blue-500 hover:text-blue-600"
                                            onClick={() => handleRefreshFeed(idx, comp.name)}
                                            disabled={refreshingFeed[idx]}
                                        >
                                            {refreshingFeed[idx] ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3 mr-1" />}
                                            Refresh
                                        </Button>
                                    </div>
                                    {comp.feed && comp.feed.length > 0 ? (
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                                            {comp.feed.map((item: any, fIdx: number) => (
                                                <a 
                                                    key={fIdx} 
                                                    href={item.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="block p-2 bg-white dark:bg-slate-800 rounded border hover:border-blue-300 transition-colors group"
                                                >
                                                    <div className="text-[10px] font-medium line-clamp-2 group-hover:text-blue-600 mb-1">
                                                        {item.title}
                                                    </div>
                                                    <div className="flex justify-between text-[8px] text-slate-400">
                                                        <span>{item.source}</span>
                                                        <span>{item.date}</span>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-slate-400 italic">No recent news found.</p>
                                    )}
                                </div>
                            ))}
                            {competitors.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No competitors added.</p>}
                        </div>
                    </TabsContent>

                    <TabsContent value="moodboard" className="m-0 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Moodboard</h4>
                            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                <ImagePlus className="w-4 h-4 mr-2" /> Add Image
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {moodboard.map((item, i) => (
                                <div key={item._key} className="relative group aspect-square bg-slate-100 rounded-lg overflow-hidden">
                                    {item.url ? (
                                        <img src={item.url} alt="Moodboard image" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ImageIcon className="w-8 h-8" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button 
                                            size="icon" 
                                            variant="secondary" 
                                            className="h-8 w-8"
                                            title="Use as Slide Image"
                                            onClick={() => {
                                                if (activeSlide) {
                                                    updateSlide(activeSlide._key, { imageUrl: item.url, imageAssetId: item.assetId });
                                                    toast.success("Set as slide image");
                                                }
                                            }}
                                        >
                                            <ImageIcon className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                            size="icon" 
                                            variant="destructive" 
                                            className="h-8 w-8"
                                            onClick={() => removeMoodboardItem(i)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    {item.note && (
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-white text-[10px] truncate">
                                            {item.note}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="comments" className="m-0 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold uppercase text-slate-500">
                                    Slide Comments ({activeSlide.comments?.length || 0})
                                </Label>
                            </div>
                            
                            {(activeSlide.comments || []).length === 0 ? (
                                <div className="text-center text-slate-400 py-8 text-sm italic">
                                    No comments on this slide.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {activeSlide.comments?.map((comment, idx) => (
                                        <div key={idx} className={`p-3 rounded border text-sm shadow-sm ${comment.resolved ? 'bg-slate-50 opacity-70' : 'bg-white'}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-semibold text-xs text-slate-900">{comment.author}</span>
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
                                            <p className="text-slate-600">{comment.text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                </CardContent>
            </Card>
        </Tabs>
      </div>

    </div>
  );
}
