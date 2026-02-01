
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Plus, Trash2, Image as ImageIcon, Sparkles, ArrowRight, Loader2, Upload, Target, Search, Users, Palette, Globe, Briefcase, Info, Activity, Newspaper, Layers, CheckCircle, ShieldCheck, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { uploadMoodboardImage, generateDeliverablePlan } from "@/app/actions/campaigns";
import { analyzeUrl, refreshCompetitorFeed, checkDeliverableQuality } from "@/app/actions/research-tools";
import { useCampaignContext, ProposedDeliverable } from "./campaign-provider";
import { urlFor } from "@/sanity/lib/image";

export function CampaignPlanTab() {
  const { 
    campaign, 
    competitors, 
    setCompetitors, 
    moodboard, 
    setMoodboard, 
    proposedDeliverables, 
    setProposedDeliverables, 
    targetAudience, 
    setTargetAudience, 
    toneOfVoice, 
    setToneOfVoice, 
    strategicPillars, 
    setStrategicPillars, 
    slides,
    setHasUnsavedChanges,
    handleSave,
    isSaving 
  } = useCampaignContext();

  const [activeTab, setActiveTab] = useState("context");
  
  // Local loading states
  const [analyzingCompetitor, setAnalyzingCompetitor] = useState<number | null>(null);
  const [refreshingFeed, setRefreshingFeed] = useState<Record<number, boolean>>({});
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [checkingQuality, setCheckingQuality] = useState<Record<number, boolean>>({});
  const [planError, setPlanError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Moodboard Actions
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
        if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const removeMoodboardItem = (index: number) => {
      const newMoodboard = [...moodboard];
      newMoodboard.splice(index, 1);
      setMoodboard(newMoodboard);
      setHasUnsavedChanges(true);
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

    try {
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
            toast.success("AI generated a plan!");
            
            // Trigger quality check for new items if needed (optional, skipping for now to save tokens/time)
        } else {
            setPlanError(res.message || "Failed to generate plan");
            toast.error(res.message || "Plan generation failed");
        }
    } catch (e) {
        toast.error("Error generating plan");
    } finally {
        setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
           <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
               <TabsTrigger value="context" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Context & Pillars</TabsTrigger>
               <TabsTrigger value="competitors" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Competitors</TabsTrigger>
               <TabsTrigger value="moodboard" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Moodboard</TabsTrigger>
               <TabsTrigger value="deliverables" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Deliverables Plan</TabsTrigger>
           </TabsList>

           <div className="mt-6">
               <TabsContent value="context" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    Target Audience
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea 
                                    value={targetAudience}
                                    onChange={(e) => { setTargetAudience(e.target.value); setHasUnsavedChanges(true); }}
                                    placeholder="Who are we talking to? (e.g. Gen Z, Fashion Conscious...)"
                                    className="min-h-[150px]"
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Target className="w-4 h-4 text-purple-500" />
                                    Tone of Voice
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea 
                                    value={toneOfVoice}
                                    onChange={(e) => { setToneOfVoice(e.target.value); setHasUnsavedChanges(true); }}
                                    placeholder="How do we sound? (e.g. Witty, Professional, Empathetic...)"
                                    className="min-h-[150px]"
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Layers className="w-4 h-4 text-green-500" />
                                Strategic Pillars
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea 
                                value={strategicPillars}
                                onChange={(e) => { setStrategicPillars(e.target.value); setHasUnsavedChanges(true); }}
                                placeholder="Core themes or pillars for this campaign..."
                                className="min-h-[200px]"
                            />
                        </CardContent>
                    </Card>
               </TabsContent>

               <TabsContent value="competitors" className="space-y-6">
                   <div className="flex justify-end">
                       <Button onClick={addCompetitor} size="sm">
                           <Plus className="w-4 h-4 mr-2" />
                           Add Competitor
                       </Button>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4">
                       {competitors.map((comp, i) => (
                           <Card key={comp._key}>
                               <CardContent className="p-4 space-y-4">
                                   <div className="flex gap-4">
                                       <div className="flex-1 space-y-2">
                                           <Label>Name</Label>
                                           <Input 
                                               value={comp.name} 
                                               onChange={(e) => updateCompetitor(i, 'name', e.target.value)} 
                                           />
                                       </div>
                                       <div className="flex-1 space-y-2">
                                           <Label>Website / Social URL</Label>
                                           <div className="flex gap-2">
                                               <Input 
                                                   value={comp.url} 
                                                   onChange={(e) => updateCompetitor(i, 'url', e.target.value)} 
                                                   placeholder="https://..."
                                               />
                                               <Button 
                                                   variant="outline" 
                                                   size="icon" 
                                                   onClick={() => handleAnalyzeCompetitor(i, comp.url)}
                                                   disabled={analyzingCompetitor === i}
                                               >
                                                   {analyzingCompetitor === i ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                               </Button>
                                           </div>
                                       </div>
                                       <div className="flex items-end">
                                            <Button variant="ghost" size="icon" onClick={() => removeCompetitor(i)} className="text-red-500 hover:text-red-600">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                       </div>
                                   </div>
                                   
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                       <div className="space-y-2">
                                           <Label>Analysis / Notes</Label>
                                           <Textarea 
                                               value={comp.notes} 
                                               onChange={(e) => updateCompetitor(i, 'notes', e.target.value)}
                                               className="min-h-[100px]"
                                           />
                                       </div>
                                       <div className="space-y-2">
                                           <div className="flex items-center justify-between">
                                                <Label>Recent Activity Feed</Label>
                                                <Button variant="ghost" size="sm" onClick={() => handleRefreshFeed(i, comp.name)} disabled={refreshingFeed[i]}>
                                                    {refreshingFeed[i] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3 mr-1" />}
                                                    Refresh
                                                </Button>
                                           </div>
                                           <div className="h-[100px] border rounded-md p-2 overflow-y-auto bg-slate-50 dark:bg-slate-900 text-xs text-slate-500">
                                               {comp.feed ? (
                                                   <ul className="space-y-1">
                                                       {comp.feed.map((item: any, k: number) => (
                                                           <li key={k} className="flex gap-2">
                                                               <Newspaper className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                               <span>{item.title}</span>
                                                           </li>
                                                       ))}
                                                   </ul>
                                               ) : (
                                                   <p className="italic">No feed data available. Click refresh.</p>
                                               )}
                                           </div>
                                       </div>
                                   </div>
                               </CardContent>
                           </Card>
                       ))}
                   </div>
               </TabsContent>

               <TabsContent value="moodboard" className="space-y-6">
                   <div className="flex justify-between items-center">
                       <h3 className="text-lg font-semibold">Visual Inspiration</h3>
                       <div>
                           <input 
                               type="file" 
                               ref={fileInputRef} 
                               className="hidden" 
                               accept="image/*" 
                               onChange={handleMoodboardUpload} 
                           />
                           <Button onClick={() => fileInputRef.current?.click()}>
                               <Upload className="w-4 h-4 mr-2" />
                               Upload Image
                           </Button>
                       </div>
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                       {moodboard.map((item, i) => (
                           <div key={item._key} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                               <img src={item.url} alt={item.note} className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                                   <p className="text-white text-xs truncate mb-2">{item.note}</p>
                                   <Button variant="destructive" size="sm" className="w-full h-8" onClick={() => removeMoodboardItem(i)}>
                                       Remove
                                   </Button>
                               </div>
                           </div>
                       ))}
                   </div>
               </TabsContent>

               <TabsContent value="deliverables" className="space-y-6">
                   <div className="flex flex-col md:flex-row justify-between gap-4 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/20">
                       <div>
                           <h3 className="font-semibold text-blue-900 dark:text-blue-200">AI Plan Generator</h3>
                           <p className="text-sm text-blue-700 dark:text-blue-300">Generate a deliverable plan based on your strategy slides and context.</p>
                       </div>
                       <Button onClick={handleGeneratePlan} disabled={isGeneratingPlan} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
                           {isGeneratingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                           Generate Plan
                       </Button>
                   </div>

                   {planError && (
                       <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                           {planError}
                       </div>
                   )}

                   <div className="space-y-4">
                       {proposedDeliverables.map((item, i) => (
                           <Card key={item._key} className="overflow-hidden">
                               <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3 items-center gap-3">
                                   <div className="p-2 bg-white dark:bg-slate-800 rounded-md border shadow-sm">
                                       <Palette className="w-4 h-4 text-slate-500" />
                                   </div>
                                   <div className="flex-1">
                                       <Input 
                                           value={item.title} 
                                           onChange={(e) => updateProposedDeliverable(i, 'title', e.target.value)}
                                           className="h-8 font-medium bg-transparent border-transparent hover:border-slate-200 focus:bg-white px-2"
                                       />
                                   </div>
                                   <Select value={item.platform} onValueChange={(val) => updateProposedDeliverable(i, 'platform', val)}>
                                       <SelectTrigger className="w-32 h-8 text-xs">
                                           <SelectValue />
                                       </SelectTrigger>
                                       <SelectContent>
                                           <SelectItem value="instagram">Instagram</SelectItem>
                                           <SelectItem value="linkedin">LinkedIn</SelectItem>
                                           <SelectItem value="tiktok">TikTok</SelectItem>
                                           <SelectItem value="email">Email</SelectItem>
                                       </SelectContent>
                                   </Select>
                                   <Button variant="ghost" size="icon" onClick={() => removeProposedDeliverable(i)} className="h-8 w-8 text-slate-400 hover:text-red-500">
                                       <X className="w-4 h-4" />
                                   </Button>
                               </div>
                               
                               <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <div className="space-y-4">
                                       <div className="space-y-2">
                                           <Label className="text-xs font-semibold text-slate-500 uppercase">Concept / Visual Direction</Label>
                                           <Textarea 
                                               value={item.description} 
                                               onChange={(e) => updateProposedDeliverable(i, 'description', e.target.value)}
                                               className="min-h-[80px] text-sm"
                                               placeholder="Describe the visual concept..."
                                           />
                                       </div>
                                       <div className="space-y-2">
                                           <Label className="text-xs font-semibold text-slate-500 uppercase">Caption / Copy</Label>
                                           <Textarea 
                                               value={item.caption} 
                                               onChange={(e) => updateProposedDeliverable(i, 'caption', e.target.value)}
                                               className="min-h-[80px] text-sm"
                                               placeholder="Draft caption..."
                                           />
                                       </div>
                                   </div>

                                   <div className="space-y-4">
                                       <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 space-y-3">
                                           <div className="flex justify-between items-center">
                                               <h4 className="text-sm font-medium flex items-center gap-2">
                                                   <ShieldCheck className="w-4 h-4 text-blue-500" />
                                                   Quality Check
                                               </h4>
                                               <Button size="sm" variant="outline" onClick={() => handleQualityCheck(i)} disabled={checkingQuality[i]}>
                                                   {checkingQuality[i] ? <Loader2 className="w-3 h-3 animate-spin" /> : "Run Check"}
                                               </Button>
                                           </div>
                                           
                                           {item.qualityCheck ? (
                                               <div className={`text-xs p-3 rounded border ${item.qualityCheck.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                                   <div className="flex items-center gap-2 font-semibold mb-1">
                                                       {item.qualityCheck.status === 'approved' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                                       Score: {item.qualityCheck.score}/100
                                                   </div>
                                                   <p>{item.qualityCheck.feedback}</p>
                                                   {item.qualityCheck.missing_elements?.length > 0 && (
                                                       <div className="mt-2">
                                                           <strong>Missing:</strong> {item.qualityCheck.missing_elements.join(", ")}
                                                       </div>
                                                   )}
                                               </div>
                                           ) : (
                                               <p className="text-xs text-slate-400 italic">Not checked yet.</p>
                                           )}
                                       </div>

                                       {item.assets && item.assets.length > 0 && (
                                           <div className="space-y-2">
                                               <Label className="text-xs font-semibold text-slate-500 uppercase">Suggested Assets</Label>
                                               <div className="flex flex-wrap gap-2">
                                                   {item.assets.map((asset: any, k: number) => (
                                                       <div key={k} className="w-12 h-12 rounded border overflow-hidden">
                                                           <img src={urlFor(asset).url()} alt="" className="w-full h-full object-cover" />
                                                       </div>
                                                   ))}
                                               </div>
                                           </div>
                                       )}
                                   </div>
                               </div>
                           </Card>
                       ))}

                       <Button variant="outline" onClick={addProposedDeliverable} className="w-full border-dashed">
                           <Plus className="w-4 h-4 mr-2" />
                           Add Manual Item
                       </Button>
                   </div>
               </TabsContent>
           </div>
       </Tabs>
       
       <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-slate-800">
           <Button onClick={handleSave} disabled={isSaving}>
               {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
               Save Changes
           </Button>
       </div>
    </div>
  );
}
