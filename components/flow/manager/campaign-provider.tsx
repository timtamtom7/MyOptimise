
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { updateCampaignDeck, submitStrategy, publishToClient } from "@/app/actions/campaigns";
import { urlFor } from "@/sanity/lib/image";
import { SLIDE_TEMPLATES } from "./slide-templates";

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

export interface ProposedDeliverable {
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

interface CampaignContextType {
  campaign: any;
  user: any;
  slides: Slide[];
  setSlides: (slides: Slide[]) => void;
  activeSlideIndex: number;
  setActiveSlideIndex: (index: number) => void;
  competitors: any[];
  setCompetitors: (competitors: any[]) => void;
  moodboard: any[];
  setMoodboard: (moodboard: any[]) => void;
  proposedDeliverables: ProposedDeliverable[];
  setProposedDeliverables: (deliverables: ProposedDeliverable[]) => void;
  clientAssets: any[];
  setClientAssets: (assets: any[]) => void;
  targetAudience: string;
  setTargetAudience: (text: string) => void;
  toneOfVoice: string;
  setToneOfVoice: (text: string) => void;
  strategicPillars: string;
  setStrategicPillars: (text: string) => void;
  status: string;
  setStatus: (status: string) => void;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (has: boolean) => void;
  isSaving: boolean;
  
  // Actions
  addSlideWithTemplate: (templateId: string) => void;
  updateSlide: (key: string, updates: Partial<Slide>) => void;
  removeSlide: (index: number) => void;
  moveSlide: (index: number, direction: 'up' | 'down') => void;
  handleSave: () => Promise<void>;
  handleSubmit: () => Promise<void>;
  handlePublish: () => Promise<void>;
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined);

export function CampaignProvider({ children, campaign, user }: { children: ReactNode, campaign: any, user: any }) {
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

  const [targetAudience, setTargetAudience] = useState(campaign.strategyDeck?.targetAudience || "");
  const [toneOfVoice, setToneOfVoice] = useState(campaign.strategyDeck?.toneOfVoice || "");
  const [strategicPillars, setStrategicPillars] = useState<string>((campaign.strategyDeck?.strategicPillars || []).join('\n'));

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Debounced Save
  useEffect(() => {
       if (!hasUnsavedChanges) return;

       const timer = setTimeout(() => {
           handleSave();
           setHasUnsavedChanges(false);
       }, 2000);

       return () => clearTimeout(timer);
   }, [hasUnsavedChanges, slides, competitors, moodboard, proposedDeliverables, targetAudience, toneOfVoice, strategicPillars]);

  // Actions
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
      await handleSave();

      const formData = new FormData();
      formData.append("campaignId", campaign._id);
      
      try {
          const res = await submitStrategy(formData);
          if (res.success) {
              setStatus("internal_review"); 
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

  const value = {
    campaign,
    user,
    slides,
    setSlides,
    activeSlideIndex,
    setActiveSlideIndex,
    competitors,
    setCompetitors,
    moodboard,
    setMoodboard,
    proposedDeliverables,
    setProposedDeliverables,
    clientAssets,
    setClientAssets,
    targetAudience,
    setTargetAudience,
    toneOfVoice,
    setToneOfVoice,
    strategicPillars,
    setStrategicPillars,
    status,
    setStatus,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isSaving,
    addSlideWithTemplate,
    updateSlide,
    removeSlide,
    moveSlide,
    handleSave,
    handleSubmit,
    handlePublish
  };

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaignContext() {
  const context = useContext(CampaignContext);
  if (context === undefined) {
    throw new Error("useCampaignContext must be used within a CampaignProvider");
  }
  return context;
}
