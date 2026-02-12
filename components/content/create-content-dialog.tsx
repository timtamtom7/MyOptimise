"use client";

import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createContentItem } from "@/app/actions/content";
import { generateContentCaption } from "@/app/actions/ai-content";
import { Plus, Loader2, Eye, Sparkles, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { InstagramPreview } from "./previews/InstagramPreview";
import { TikTokPreview } from "./previews/TikTokPreview";
import { LinkedInPreview } from "./previews/LinkedInPreview";
import { InstagramStoryPreview } from "./previews/InstagramStoryPreview";
import { MediaLibraryDialog } from "./media-library-dialog";
import Image from "next/image";

interface Client {
  _id: string;
  name: string;
  businessName?: string;
  avatar?: any;
}

interface CreateContentDialogProps {
  clients: Client[];
}

export function CreateContentDialog({ clients }: CreateContentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    clientId: "",
    platform: "instagram",
    postType: "post",
    title: "",
    caption: "",
    scheduledAt: "",
  });

  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [mediaItems, setMediaItems] = useState<{
    id: string;
    file: File | null;
    url: string | null;
    assetId: string | null;
    type: 'image' | 'video';
  }[]>([]);

  // Helper to add an item
  const addMediaItem = (item: { file: File | null, url: string | null, assetId: string | null, type: 'image' | 'video' }) => {
      setMediaItems(prev => [...prev, { ...item, id: crypto.randomUUID() }]);
  };

  const removeMediaItem = (id: string) => {
      setMediaItems(prev => prev.filter(item => item.id !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
        Array.from(files).forEach(file => {
            const url = URL.createObjectURL(file);
            const type = file.type.startsWith('video/') ? 'video' : 'image';
            addMediaItem({ file, url, assetId: null, type });
        });
    }
  };

  const handleLibrarySelect = (url: string, assetId: string, type: 'image' | 'video') => {
      addMediaItem({ file: null, url, assetId, type });
  };

  const selectedClient = clients.find(c => c._id === formData.clientId);
  const clientName = selectedClient?.businessName || selectedClient?.name || "Optimise Agency";

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateCaption = async () => {
    if (!formData.title || !formData.clientId) {
        toast.error("Please select a client and enter a title first.");
        return;
    }
    
    setIsGenerating(true);
    try {
        const result = await generateContentCaption({
            clientName,
            platform: formData.platform,
            title: formData.title,
            postType: formData.postType
        });
        
        if (result.success && result.caption) {
            let newCaption = result.caption;
            if (result.hashtags && result.hashtags.length > 0) {
                newCaption += `\n\n${result.hashtags.join(" ")}`;
            }
            handleInputChange("caption", newCaption);
            toast.success("Caption generated!");
        } else {
            toast.error("Failed to generate caption");
        }
    } catch (e) {
        console.error(e);
        toast.error("Error generating caption");
    } finally {
        setIsGenerating(false);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
          if (value) submitData.append(key, value);
      });
      
      if (mediaItems.length > 0) {
          mediaItems.forEach((item, index) => {
              if (item.file) {
                  submitData.append(`files`, item.file); // Backend needs to handle array of files
                  // We need to map which file corresponds to which item if we mix types, but simpler to just send all files
                  // Actually, to preserve order and mix of existing/new, we might need a more complex structure or JSON
                  // For now, let's assume we upload all new files, and send existing IDs.
                  // BUT, we need to know the ORDER.
                  // Let's create a JSON manifest for the media order
                  submitData.append('mediaManifest', JSON.stringify({
                      type: item.file ? 'new' : 'existing',
                      index: index,
                      assetId: item.assetId
                  }));
              } else if (item.assetId) {
                  submitData.append('mediaManifest', JSON.stringify({
                      type: 'existing',
                      index: index,
                      assetId: item.assetId
                  }));
              }
          });
      }
      
      await createContentItem(submitData);
      toast.success("Content created successfully");
      setOpen(false);
      // Reset form
      setFormData({
        clientId: "",
        platform: "instagram",
        postType: "post",
        title: "",
        caption: "",
        scheduledAt: "",
      });
      setMediaItems([]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create content");
    } finally {
      setLoading(false);
    }
  }

  const renderPreview = () => {
    const commonProps = {
        username: clientName.toLowerCase().replace(/\s+/g, '_'),
        userImage: undefined, // TODO: Map avatar url
        caption: formData.caption || "Write a caption to see it here...",
        image: mediaItems[0]?.url || undefined,
        mediaType: mediaItems[0]?.type,
        mediaItems: mediaItems.length > 0 ? mediaItems.map(item => ({ url: item.url!, type: item.type })) : undefined
    };

    if (formData.platform === 'linkedin') {
        return <LinkedInPreview {...commonProps} userTitle="Marketing Team" />;
    }
    
    if (formData.platform === 'tiktok') {
        return <TikTokPreview {...commonProps} />;
    }

    if (formData.platform === 'instagram') {
        if (formData.postType === 'story') {
            return <InstagramStoryPreview {...commonProps} />;
        }
        return <InstagramPreview {...commonProps} />;
    }

    // Default fallback
    return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
            <Eye className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm font-medium">Preview not available for {formData.platform}</p>
        </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants(), "h-12 px-6 rounded-[1.5rem] font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30")}>
          <Plus className="mr-2 h-5 w-5" /> Create
      </DialogTrigger>
      <DialogContent className="rounded-[3rem] p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-950 max-w-6xl w-[95vw] h-[90vh] flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 h-full">
            {/* LEFT COLUMN: FORM */}
            <div className="lg:col-span-5 flex flex-col h-full border-r border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-950 z-10">
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800/50">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 dark:text-slate-100">Create Content</DialogTitle>
                        <DialogDescription className="text-base font-medium mt-1">
                        Plan and preview your post.
                        </DialogDescription>
                    </DialogHeader>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <form id="create-content-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <Label htmlFor="client" className="text-sm font-bold ml-1 text-slate-700 dark:text-slate-300">Client</Label>
                            <Select name="clientId" required value={formData.clientId} onValueChange={(v) => handleInputChange('clientId', v)}>
                                <SelectTrigger className="h-14 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium px-5">
                                    <SelectValue placeholder="Select client" />
                                </SelectTrigger>
                                <SelectContent className="rounded-[2rem] p-2 shadow-xl">
                                    {clients.map((client) => (
                                        <SelectItem key={client._id} value={client._id} className="rounded-xl py-3 px-4 font-medium cursor-pointer">
                                            {client.name} {client.businessName ? `(${client.businessName})` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label htmlFor="platform" className="text-sm font-bold ml-1 text-slate-700 dark:text-slate-300">Platform</Label>
                                <Select name="platform" required value={formData.platform} onValueChange={(v) => handleInputChange('platform', v)}>
                                    <SelectTrigger className="h-14 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium px-5">
                                        <SelectValue placeholder="Platform" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[2rem] p-2 shadow-xl">
                                        <SelectItem value="instagram" className="rounded-xl py-3 px-4 font-medium cursor-pointer">Instagram</SelectItem>
                                        <SelectItem value="tiktok" className="rounded-xl py-3 px-4 font-medium cursor-pointer">TikTok</SelectItem>
                                        <SelectItem value="linkedin" className="rounded-xl py-3 px-4 font-medium cursor-pointer">LinkedIn</SelectItem>
                                        <SelectItem value="youtube" className="rounded-xl py-3 px-4 font-medium cursor-pointer">YouTube</SelectItem>
                                        <SelectItem value="facebook" className="rounded-xl py-3 px-4 font-medium cursor-pointer">Facebook</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="postType" className="text-sm font-bold ml-1 text-slate-700 dark:text-slate-300">Post Type</Label>
                                <Select name="postType" value={formData.postType} onValueChange={(v) => handleInputChange('postType', v)}>
                                    <SelectTrigger className="h-14 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium px-5">
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-[2rem] p-2 shadow-xl">
                                        <SelectItem value="post" className="rounded-xl py-3 px-4 font-medium cursor-pointer">Post</SelectItem>
                                        <SelectItem value="reel" className="rounded-xl py-3 px-4 font-medium cursor-pointer">Reel</SelectItem>
                                        <SelectItem value="story" className="rounded-xl py-3 px-4 font-medium cursor-pointer">Story</SelectItem>
                                        <SelectItem value="carousel" className="rounded-xl py-3 px-4 font-medium cursor-pointer">Carousel</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <Label className="text-sm font-bold ml-1 text-slate-700 dark:text-slate-300">Media Assets</Label>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {/* Upload Button */}
                                <div className="relative aspect-square">
                                    <input 
                                        type="file" 
                                        id="file-upload" 
                                        className="hidden" 
                                        accept="image/*,video/*"
                                        multiple
                                        onChange={handleFileChange}
                                    />
                                    <Label 
                                        htmlFor="file-upload" 
                                        className="flex flex-col items-center justify-center w-full h-full rounded-[1.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                                    >
                                        <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                                        <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200">Upload</span>
                                    </Label>
                                </div>
                                
                                {/* Library Button */}
                                <Button 
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        if (!formData.clientId) {
                                            toast.error("Please select a client first");
                                            return;
                                        }
                                        setMediaLibraryOpen(true);
                                    }}
                                    className="flex flex-col items-center justify-center w-full h-full aspect-square rounded-[1.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                >
                                    <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                                    <span className="text-xs font-bold text-slate-500">Library</span>
                                </Button>

                                {/* Selected Items */}
                                {mediaItems.map((item, index) => (
                                    <div key={item.id} className="relative rounded-[1.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 group aspect-square bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                                        {item.type === 'video' ? (
                                            <video src={item.url!} className="w-full h-full object-cover" />
                                        ) : (
                                            <Image 
                                                src={item.url!} 
                                                alt="Selected media" 
                                                fill 
                                                className="object-cover" 
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button 
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => removeMediaItem(item.id)}
                                                className="rounded-full w-10 h-10"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                                            {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <Label htmlFor="title" className="text-sm font-bold ml-1 text-slate-700 dark:text-slate-300">Internal Title</Label>
                            <Input 
                                name="title" 
                                placeholder="e.g. Summer Campaign Launch Video" 
                                required 
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                className="h-14 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium px-5"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="scheduledAt" className="text-sm font-bold ml-1 text-slate-700 dark:text-slate-300">Schedule (Optional)</Label>
                            <Input 
                                name="scheduledAt" 
                                type="datetime-local" 
                                value={formData.scheduledAt}
                                onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                                className="h-14 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium px-5"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="caption" className="text-sm font-bold ml-1 text-slate-700 dark:text-slate-300">Caption / Copy</Label>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={handleGenerateCaption}
                                    disabled={isGenerating}
                                    className="h-8 px-3 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold text-xs"
                                >
                                    {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                                    AI Assist
                                </Button>
                            </div>
                            <Textarea 
                                name="caption" 
                                placeholder="Write your caption here..." 
                                value={formData.caption}
                                onChange={(e) => handleInputChange('caption', e.target.value)}
                                className="min-h-[160px] rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium p-5 resize-none"
                            />
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800/50 bg-white dark:bg-slate-950 flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-14 px-6 rounded-[1.5rem] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800">
                        Cancel
                    </Button>
                    <Button form="create-content-form" type="submit" disabled={loading} className="h-14 px-8 rounded-[1.5rem] font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 min-w-[140px]">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Plan"}
                    </Button>
                </div>
            </div>

            {/* RIGHT COLUMN: PREVIEW */}
            <div className="lg:col-span-7 bg-slate-50/50 dark:bg-slate-900/20 relative overflow-hidden flex flex-col">
                 <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-transparent dark:from-blue-900/10 pointer-events-none" />
                 
                 <div className="flex-1 overflow-y-auto p-12 flex items-center justify-center min-h-0">
                    <div className="relative w-full flex flex-col items-center">
                        <div className="mb-6 flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 rounded-full shadow-sm border border-slate-100 dark:border-slate-800">
                            <Eye className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Live Preview</span>
                        </div>
                        <div className="scale-[0.85] sm:scale-100 transition-transform duration-500 ease-out origin-top">
                            {renderPreview()}
                        </div>
                    </div>
                 </div>
            </div>
        </div>
      </DialogContent>

      <MediaLibraryDialog 
        open={mediaLibraryOpen} 
        onOpenChange={setMediaLibraryOpen}
        clientId={formData.clientId}
        onSelect={handleLibrarySelect}
      />
    </Dialog>
  );
}
