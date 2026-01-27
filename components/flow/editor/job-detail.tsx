"use client";

import { Brief } from "@/types/briefs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, AlertCircle, Clock, DollarSign, Target, Lightbulb, Link as LinkIcon, AlertTriangle, Tag, Download, FileText, History, ShieldCheck, CheckSquare, FileVideo, CheckCircle2, X, FolderOpen, FileType, BookOpen, Image as ImageIcon, Search, Copy } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

interface JobDetailProps {
  brief: Brief | null;
  open: boolean;
  onClose: () => void;
  onStatusChange?: (status: string) => Promise<void>;
  onUpload?: (formData: FormData) => Promise<void>;
  onClaim?: (formData: FormData) => Promise<void>;
}

function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const diff = target - now;

      if (diff < 0) {
        setIsOverdue(true);
        setTimeLeft("Overdue");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, [deadline]);

  return (
    <div className={`flex items-center gap-2 font-mono text-sm ${isOverdue ? "text-red-600 font-bold" : "text-slate-500"}`}>
      <Clock className="h-4 w-4" />
      {timeLeft}
    </div>
  );
}

export function JobDetail({ brief, open, onClose, onStatusChange, onUpload, onClaim }: JobDetailProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [assetSearchQuery, setAssetSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // QA State
  const [qaChecklist, setQaChecklist] = useState({
    aspectRatio: false,
    audioSync: false,
    safeZones: false,
    highQuality: false,
    briefRequirements: false
  });

  const allQaPassed = Object.values(qaChecklist).every(Boolean);

  if (!brief) return null;

  const isUnclear = !brief.script || !brief.hook || !brief.visual_direction;
  const isClaimed = !!brief.assignee_id;
  const meta = (brief.metadata || {}) as any;
  const brandTags = Array.isArray(meta.brandTags)
    ? (meta.brandTags as unknown[]).filter(
        (tag) => typeof tag === "string" && tag.trim(),
      ) as string[]
    : [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setSelectedFile(file);
      setSubmissionUrl(""); // Clear URL if file selected

      // Automated QA Checks
      if (file.type.startsWith('video/')) {
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => {
              window.URL.revokeObjectURL(video.src);
              const ratio = video.videoWidth / video.videoHeight;
              const isVertical = ratio < 1; // Approx 9:16 is 0.5625
              const isHorizontal = ratio > 1; // Approx 16:9 is 1.77
              
              const targetIsVertical = brief.platform === 'Reels' || brief.platform === 'TikTok' || brief.platform === 'Shorts';
              
              const isCorrectRatio = targetIsVertical ? isVertical : isHorizontal;
              const isHighRes = video.videoWidth >= 1080 || video.videoHeight >= 1080;
              
              setQaChecklist(prev => ({
                  ...prev,
                  aspectRatio: isCorrectRatio,
                  highQuality: isHighRes
              }));

              if (!isCorrectRatio) {
                  toast.warning(`Aspect ratio mismatch. Expected ${targetIsVertical ? 'Vertical (9:16)' : 'Horizontal (16:9)'}.`);
              }
              if (!isHighRes) {
                  toast.warning("Video resolution is below 1080p.");
              }
          };
          video.src = URL.createObjectURL(file);
      } else if (file.type.startsWith('image/')) {
          const img = new Image();
          img.onload = () => {
              window.URL.revokeObjectURL(img.src);
              const isHighRes = img.width >= 1080 || img.height >= 1080;
              setQaChecklist(prev => ({ ...prev, highQuality: isHighRes }));
          };
          img.src = URL.createObjectURL(file);
      }
  };

  const handleSubmitLink = async () => {
      if (!onUpload) return;
      if (!submissionUrl && !selectedFile) {
          toast.error("Please provide a URL or upload a file");
          return;
      }

      try {
          setIsUploading(true);
          const formData = new FormData();
          formData.append("id", brief.id);
          
          if (selectedFile) {
              formData.append("file", selectedFile);
          } else {
              formData.append("url", submissionUrl);
          }

          await onUpload(formData);
          toast.success("Submission received successfully");
          setSubmissionUrl("");
          setSelectedFile(null);
          onClose();
      } catch (e) {
          toast.error("Failed to submit");
          console.error(e);
      } finally {
          setIsUploading(false);
      }
  };

  const handleClaim = async () => {
      if (!onClaim) return;
      try {
          setIsUpdating(true);
          const formData = new FormData();
          formData.append("id", brief.id);
          await onClaim(formData);
          toast.success("Job claimed successfully");
          onClose();
      } catch(e) {
          toast.error("Failed to claim job");
          console.error(e);
      } finally {
          setIsUpdating(false);
      }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 p-0 gap-0">
        <DialogHeader className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mr-8">
            <div className="space-y-1">
                <DialogTitle className="text-2xl font-display font-medium">{brief.title}</DialogTitle>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    {brief.platform && <Badge variant="outline" className="font-normal">{brief.platform}</Badge>}
                    {brief.format && <Badge variant="outline" className="font-normal">{brief.format}</Badge>}
                    {brief.difficulty && <Badge variant={brief.difficulty === 'high' ? 'destructive' : 'secondary'} className="font-normal">{brief.difficulty} Difficulty</Badge>}
                </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                <Badge variant={brief.status === "assigned" ? "default" : "secondary"} className="uppercase tracking-wide text-xs">
                  {brief.status.replace("_", " ")}
                </Badge>
                {brief.deadline && <CountdownTimer deadline={brief.deadline} />}
            </div>
          </div>
          <DialogDescription className="sr-only">
             Job details for {brief.title}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <TabsList className="bg-transparent p-0 h-auto">
              <TabsTrigger value="details" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-0 py-3 mr-6 font-medium text-slate-500 data-[state=active]:text-slate-900 text-sm shadow-none transition-none">Details</TabsTrigger>
              <TabsTrigger value="assets" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-0 py-3 mr-6 font-medium text-slate-500 data-[state=active]:text-slate-900 text-sm shadow-none transition-none flex items-center gap-2">
                Assets
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent px-0 py-3 font-medium text-slate-500 data-[state=active]:text-slate-900 text-sm shadow-none transition-none flex items-center gap-2">
                History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
            <div className="space-y-6 max-w-2xl mx-auto">
            
            {/* Alerts */}
            {isUnclear && !isClaimed && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Unclear Brief</AlertTitle>
                    <AlertDescription>
                        This brief is missing key details (Script, Hook, or Visual Direction). Please verify with the strategist before claiming.
                    </AlertDescription>
                </Alert>
            )}

            {/* Pay Info */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <span className="font-semibold text-xl text-green-700 dark:text-green-400 block leading-none mb-1">${brief.price || 0}</span>
                        <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">Pay upon approval</span>
                    </div>
                </div>
                {brief.claimed_at && (
                    <div className="text-sm text-slate-500 text-right">
                        Claimed on <br/>
                        <span className="font-medium text-slate-900 dark:text-slate-50">{new Date(brief.claimed_at).toLocaleDateString()}</span>
                    </div>
                )}
            </div>

            {/* Strategy Context */}
            {(brief.target_audience || brief.tone_of_voice || (brief.strategy_pillars && brief.strategy_pillars.length > 0)) && (
                <div className="grid gap-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                    <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        <Target className="h-4 w-4" /> Strategy Context
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        {brief.target_audience && (
                            <div>
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">Target Audience</span>
                                <p className="text-slate-800 dark:text-slate-200">{brief.target_audience}</p>
                            </div>
                        )}
                        {brief.tone_of_voice && (
                            <div>
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">Tone of Voice</span>
                                <p className="text-slate-800 dark:text-slate-200">{brief.tone_of_voice}</p>
                            </div>
                        )}
                    </div>
                    {brief.strategy_pillars && brief.strategy_pillars.length > 0 && (
                        <div>
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">Strategic Pillars</span>
                            <div className="flex flex-wrap gap-2">
                                {brief.strategy_pillars.map((pillar, i) => (
                                    <Badge key={i} variant="secondary" className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-blue-100 dark:border-blue-900">
                                        {pillar}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Strategy / Concept Section */}
            {(brief.creative_goal || brief.content_concept) && (
                <div className="grid gap-4">
                    {brief.creative_goal && (
                        <div className="space-y-2">
                            <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50 flex items-center gap-2"><Target className="h-4 w-4 text-slate-400" /> Creative Goal</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">{brief.creative_goal}</p>
                        </div>
                    )}
                    {brief.content_concept && (
                        <div className="space-y-2">
                            <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-slate-400" /> Concept</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">{brief.content_concept}</p>
                        </div>
                    )}
                </div>
            )}

            {brandTags.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-slate-400" /> Brand tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {brandTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs font-normal bg-white dark:bg-slate-900">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50">Hook</h3>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm text-sm text-slate-700 dark:text-slate-300">
                {brief.hook || "No hook provided"}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50">Script</h3>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                {brief.script || "No script provided"}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50">Visual Direction</h3>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {brief.visual_direction || "No visual direction provided"}
              </div>
            </div>

            {/* Assets & References */}
            <div className="grid md:grid-cols-2 gap-4">
                {(brief.assets_url || (brief.required_assets && brief.required_assets.length > 0)) && (
                    <div className="space-y-2">
                        <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50 flex items-center gap-2"><LinkIcon className="h-4 w-4 text-slate-400" /> Required Assets</h3>
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            {brief.assets_url && (
                                <a 
                                    href={brief.assets_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-slate-600 hover:text-blue-600 hover:bg-slate-50 p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-sm transition-colors"
                                >
                                    <Download className="h-4 w-4" />
                                    Download Assets Bundle
                                </a>
                            )}
                            {brief.required_assets?.map((asset, i) => (
                                <a 
                                    key={i}
                                    href={asset.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-slate-600 hover:text-blue-600 hover:bg-slate-50 p-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-sm transition-colors last:border-0"
                                >
                                    {asset.type === 'file' ? <FileText className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                                    {asset.name || `Asset ${i + 1}`}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
                {brief.references && brief.references.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50">References</h3>
                        <ul className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            {brief.references.map((ref, i) => (
                                <li key={i}>
                                    <a href={ref} target="_blank" rel="noopener noreferrer" className="block p-3 border-b border-slate-100 dark:border-slate-800 text-sm text-blue-600 hover:underline last:border-0">
                                        Reference Link {i + 1}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-800 my-4" />
            
            <div className="pt-2">
              <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50 mb-3">Submission</h3>
              
              {brief.video_url && (
                  <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-black shadow-sm">
                      <video 
                        src={brief.video_url} 
                        controls 
                        className="w-full max-h-[400px]" 
                      />
                  </div>
              )}

              {brief.feedback && (
                 <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                    <p className="font-semibold mb-1 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Feedback from Strategist:</p>
                    {brief.feedback}
                 </div>
              )}
              
              {/* File Specs Card */}
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white dark:bg-slate-950 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-800">
                       <FileVideo className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                       <h4 className="text-sm font-medium text-slate-900 dark:text-slate-50">File Specifications</h4>
                       <p className="text-xs text-slate-500">
                          {brief.platform === 'Reels' || brief.platform === 'TikTok' ? '9:16 Vertical' : '16:9 Horizontal'} • 4K/1080p • {brief.format || 'MP4'}
                       </p>
                    </div>
                 </div>
                 <Badge variant="outline" className="bg-white dark:bg-slate-950 font-mono text-xs">
                    Target: {brief.platform}
                 </Badge>
              </div>

              {(brief.status === 'assigned' || brief.status === 'in_review') && onUpload && (
                  <div className="flex flex-col gap-6 p-6 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                      
                      {/* Automated QA Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                           <ShieldCheck className="h-5 w-5 text-emerald-600" />
                           <h4 className="font-medium text-slate-900 dark:text-slate-50">Pre-Submission Quality Check</h4>
                        </div>
                        
                        <div className="grid gap-3">
                           <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="qa-aspect" 
                                checked={qaChecklist.aspectRatio}
                                onCheckedChange={(c) => setQaChecklist(prev => ({ ...prev, aspectRatio: !!c }))}
                              />
                              <label htmlFor="qa-aspect" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                 Aspect Ratio is correct ({brief.platform === 'Reels' || brief.platform === 'TikTok' ? '9:16' : '16:9'})
                              </label>
                           </div>
                           <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="qa-audio" 
                                checked={qaChecklist.audioSync}
                                onCheckedChange={(c) => setQaChecklist(prev => ({ ...prev, audioSync: !!c }))}
                              />
                              <label htmlFor="qa-audio" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                 Audio is clear, leveled, and synced
                              </label>
                           </div>
                           <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="qa-safe" 
                                checked={qaChecklist.safeZones}
                                onCheckedChange={(c) => setQaChecklist(prev => ({ ...prev, safeZones: !!c }))}
                              />
                              <label htmlFor="qa-safe" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                 Safe zones respected (no text on edges/under UI)
                              </label>
                           </div>
                           <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="qa-quality" 
                                checked={qaChecklist.highQuality}
                                onCheckedChange={(c) => setQaChecklist(prev => ({ ...prev, highQuality: !!c }))}
                              />
                              <label htmlFor="qa-quality" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                 High quality export (1080p/4k, high bitrate)
                              </label>
                           </div>
                           <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="qa-reqs" 
                                checked={qaChecklist.briefRequirements}
                                onCheckedChange={(c) => setQaChecklist(prev => ({ ...prev, briefRequirements: !!c }))}
                              />
                              <label htmlFor="qa-reqs" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                 All specific brief instructions met
                              </label>
                           </div>
                        </div>

                        {!allQaPassed && (
                           <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3" />
                              Complete all QA checks to enable submission.
                           </div>
                        )}
                      </div>

                      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-slate-50">Submit Deliverable</label>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div 
                                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${selectedFile ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                                  onClick={() => fileInputRef.current?.click()}
                              >
                                  <input 
                                      type="file" 
                                      ref={fileInputRef}
                                      className="hidden" 
                                      accept="video/*,image/*"
                                      onChange={handleFileSelect}
                                  />
                                  {selectedFile ? (
                                      <>
                                          <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 text-center truncate w-full px-2">{selectedFile.name}</p>
                                          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                          <Button variant="ghost" size="sm" className="mt-2 h-6 text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                                              <X className="h-3 w-3 mr-1" /> Remove
                                          </Button>
                                      </>
                                  ) : (
                                      <>
                                          <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Upload File</p>
                                          <p className="text-xs text-slate-400 mt-1">Drag & drop or click</p>
                                      </>
                                  )}
                              </div>

                              <div className="flex flex-col justify-center gap-2">
                                  <div className="relative">
                                      <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                      <input
                                          type="url"
                                          placeholder="Or paste external link..."
                                          className="w-full pl-9 h-10 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                          value={submissionUrl}
                                          onChange={(e) => {
                                              setSubmissionUrl(e.target.value);
                                              setSelectedFile(null);
                                          }}
                                          disabled={!!selectedFile}
                                      />
                                  </div>
                                  <p className="text-xs text-slate-500">
                                      Supports Google Drive, Dropbox, WeTransfer, Frame.io
                                  </p>
                              </div>
                          </div>

                          <Button 
                              onClick={handleSubmitLink} 
                              disabled={isUploading || (!submissionUrl && !selectedFile) || !allQaPassed}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                          >
                              {isUploading ? (
                                  <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      {selectedFile ? 'Uploading...' : 'Submitting...'}
                                  </>
                              ) : (
                                  <>
                                      <CheckSquare className="mr-2 h-4 w-4" />
                                      Submit for Review
                                  </>
                              )}
                          </Button>
                      </div>
                  </div>
              )}
            </div>
            </div>
          </TabsContent>

          <TabsContent value="assets" className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Required Assets */}
                <div className="space-y-4">
                    <h3 className="text-lg font-display font-medium text-slate-900 dark:text-slate-50 flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-blue-500" />
                        Required for this Brief
                    </h3>
                    
                    {(!brief.required_assets || brief.required_assets.length === 0) && !brief.assets_url ? (
                        <p className="text-sm text-slate-500 italic">No specific assets required for this brief.</p>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {brief.assets_url && (
                                <a href={brief.assets_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors group">
                                    <div className="h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                        <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-slate-50">Download Bundle</p>
                                        <p className="text-xs text-slate-500">All required assets</p>
                                    </div>
                                </a>
                            )}
                            {brief.required_assets?.map((asset, i) => (
                                <a key={i} href={asset.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-500 transition-colors group">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                                        {asset.type === 'file' ? <FileText className="h-5 w-5 text-slate-600 dark:text-slate-400" /> : <LinkIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-slate-900 dark:text-slate-50 truncate">{asset.name || `Asset ${i + 1}`}</p>
                                        <p className="text-xs text-slate-500 capitalize">{asset.type}</p>
                                    </div>
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-800" />

                {/* Client Content Database */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-display font-medium text-slate-900 dark:text-slate-50 flex items-center gap-2">
                            <FolderOpen className="h-5 w-5 text-amber-500" />
                            Client Content Database
                        </h3>
                        <Badge variant="outline" className="font-normal text-xs">{brief.client_assets?.length || 0} items</Badge>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search assets by name or tag..."
                            className="w-full pl-9 h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 dark:focus:ring-slate-300"
                            value={assetSearchQuery}
                            onChange={(e) => setAssetSearchQuery(e.target.value)}
                        />
                    </div>

                    {!brief.client_assets || brief.client_assets.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                            <p className="text-slate-500">No client assets available.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {brief.client_assets
                                .filter(asset => {
                                    if (!assetSearchQuery) return true;
                                    const query = assetSearchQuery.toLowerCase();
                                    return (
                                        asset.title.toLowerCase().includes(query) ||
                                        asset.tags?.some(tag => tag.toLowerCase().includes(query)) ||
                                        asset.type.toLowerCase().includes(query)
                                    );
                                })
                                .map((asset, i) => (
                                <div 
                                    key={i} 
                                    className="flex flex-col p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition-all hover:shadow-sm group relative"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                                            {asset.type === 'logo' ? <Target className="h-5 w-5 text-amber-600" /> : 
                                             asset.type === 'font' ? <FileType className="h-5 w-5 text-amber-600" /> :
                                             asset.type === 'guidelines' ? <BookOpen className="h-5 w-5 text-amber-600" /> :
                                             <ImageIcon className="h-5 w-5 text-amber-600" />}
                                        </div>
                                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{asset.type}</Badge>
                                    </div>
                                    <a 
                                        href={asset.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="font-medium text-slate-900 dark:text-slate-50 truncate mb-1 hover:text-blue-600 hover:underline block" 
                                        title={asset.title}
                                    >
                                        {asset.title}
                                    </a>
                                    <div className="flex flex-wrap gap-1 mt-auto pt-2 mb-2">
                                        {asset.tags?.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                        {(asset.tags?.length || 0) > 3 && (
                                            <span className="text-[10px] text-slate-400 px-1.5 py-0.5">+{(asset.tags?.length || 0) - 3}</span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-7 px-2 text-xs flex-1 text-slate-500 hover:text-slate-900"
                                            onClick={() => copyToClipboard(asset.url)}
                                        >
                                            <Copy className="h-3 w-3 mr-1.5" />
                                            Copy Link
                                        </Button>
                                        <a 
                                            href={asset.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex-1"
                                        >
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-7 px-2 text-xs w-full text-slate-500 hover:text-slate-900"
                                            >
                                                <Download className="h-3 w-3 mr-1.5" />
                                                Download
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
             <div className="max-w-2xl mx-auto space-y-8">
              {!brief.status_history || brief.status_history.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No history available for this job.</p>
                </div>
              ) : (
                <div className="relative border-l border-slate-200 dark:border-slate-800 ml-3 space-y-8">
                  {[...brief.status_history].reverse().map((item: any, i: number) => (
                    <div key={i} className="relative pl-8">
                      <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-slate-50 dark:ring-slate-950" />
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                          Changed status to <Badge variant="outline" className="ml-1 font-normal bg-white dark:bg-slate-900">{item.toStatus?.replace("_", " ") || "Unknown"}</Badge>
                        </div>
                        {item.fromStatus && (
                          <div className="text-xs text-slate-500">
                            Previous status: {item.fromStatus.replace("_", " ")}
                          </div>
                        )}
                        {item.notes && (
                           <div className="text-xs bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 mt-1 text-slate-600 dark:text-slate-300">
                              {item.notes}
                           </div>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
             </div>
          </TabsContent>

          {/* Action Footer */}
          {!isClaimed && (
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto">
              <Button 
                onClick={handleClaim} 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium h-12 text-lg" 
                disabled={isUpdating || !onClaim}
              >
                {isUpdating ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {!onClaim ? "Claiming Unavailable (Check Penalties)" : "Claim this Job"}
              </Button>
            </div>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
