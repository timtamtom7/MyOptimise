import { motion } from "framer-motion";
import { Slide } from "./campaign-strategy-tab";
import { cn } from "@/lib/utils";
import { Plus, Image as ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TemplateProps {
  slide: Slide;
  isEditable?: boolean;
  onUpdate?: (updates: Partial<Slide>) => void;
  onImageUpload?: (file: File) => void;
  onGalleryUpload?: (files: FileList) => void;
}

// 1. PERSONA TEMPLATE
export function PersonaSlide({ slide, isEditable, onUpdate, onImageUpload }: TemplateProps) {
  return (
    <div className="h-full w-full flex bg-slate-50 dark:bg-slate-950 overflow-hidden relative transition-colors duration-300">
      <div className="w-1/3 bg-blue-600 h-full flex items-center justify-center relative overflow-hidden">
        {slide.imageAssetId ? (
          <img 
            src={slide.imageUrl || slide.imageAssetId} 
            alt="Persona" 
            className="w-full h-full object-cover opacity-90"
          />
        ) : (
          <div className="text-blue-100 flex flex-col items-center gap-2">
            <ImageIcon className="w-12 h-12 opacity-50" />
            <span className="text-sm font-medium uppercase tracking-wider">Persona Image</span>
            {isEditable && onImageUpload && (
                <div className="mt-4">
                    <label htmlFor="persona-upload" className="cursor-pointer bg-white text-blue-600 px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-blue-50 transition-colors">
                        Upload Photo
                    </label>
                    <input 
                        id="persona-upload" 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0])} 
                    />
                </div>
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent" />
      </div>
      
      <div className="w-2/3 p-12 flex flex-col justify-center">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h3 className="text-blue-600 dark:text-blue-400 font-mono text-sm uppercase tracking-widest mb-4">Target Persona</h3>
            {isEditable ? (
                 <input 
                    value={slide.title}
                    onChange={(e) => onUpdate?.({ title: e.target.value })}
                    className="text-4xl font-bold text-slate-900 dark:text-slate-50 bg-transparent border-none focus:ring-0 p-0 w-full mb-6 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                    placeholder="Persona Name"
                 />
            ) : (
                <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-6">{slide.title}</h2>
            )}
            
            <div className="prose prose-slate dark:prose-invert max-w-none">
                {isEditable ? (
                    <textarea 
                        value={slide.content}
                        onChange={(e) => onUpdate?.({ content: e.target.value })}
                        className="w-full h-64 bg-transparent border-none resize-none focus:ring-0 text-lg leading-relaxed text-slate-600 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-700"
                        placeholder="Describe the persona, their goals, frustrations, and demographics..."
                    />
                ) : (
                    <div className="text-lg leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                        {slide.content}
                    </div>
                )}
            </div>
        </motion.div>
      </div>
    </div>
  );
}

// 2. MOCKUP TEMPLATE
export function MockupSlide({ slide, isEditable, onUpdate, onImageUpload }: TemplateProps) {
    return (
        <div className="h-full w-full flex items-center justify-center bg-slate-950 relative overflow-hidden">
            {/* Background Blob */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            
            <div className="flex w-full max-w-5xl gap-12 items-center z-10 px-12">
                <div className="flex-1">
                    <motion.div
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ duration: 0.6 }}
                    >
                         {isEditable ? (
                            <input 
                                value={slide.title}
                                onChange={(e) => onUpdate?.({ title: e.target.value })}
                                className="text-5xl font-bold text-white bg-transparent border-none focus:ring-0 p-0 w-full mb-6 placeholder:text-slate-600"
                                placeholder="Feature Highlight"
                            />
                        ) : (
                            <h2 className="text-5xl font-bold text-white mb-6">{slide.title}</h2>
                        )}
                        
                        {isEditable ? (
                            <textarea 
                                value={slide.content}
                                onChange={(e) => onUpdate?.({ content: e.target.value })}
                                className="w-full h-40 bg-transparent border-none resize-none focus:ring-0 text-xl text-slate-400 leading-relaxed placeholder:text-slate-700"
                                placeholder="Describe the feature or design choice shown in the mockup..."
                            />
                        ) : (
                            <p className="text-xl text-slate-400 leading-relaxed">{slide.content}</p>
                        )}
                    </motion.div>
                </div>
                
                <div className="flex-1 flex justify-center">
                    <div className="relative w-[300px] h-[600px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden">
                        {slide.imageAssetId ? (
                            <img 
                                src={slide.imageAssetId} 
                                alt="Mockup" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8" />
                                </div>
                                <span className="text-sm font-medium">App Screen</span>
                                {isEditable && onImageUpload && (
                                    <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-full text-xs font-bold hover:bg-blue-500 transition-colors">
                                        Upload Screen
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0])} />
                                    </label>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// 3. STATEMENT TEMPLATE
export function StatementSlide({ slide, isEditable, onUpdate }: TemplateProps) {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-16 text-center relative transition-colors duration-300">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent dark:from-blue-950/20" />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7 }}
                className="max-w-4xl z-10"
            >
                <div className="w-20 h-1 bg-blue-600 mx-auto mb-12" />
                
                {isEditable ? (
                    <textarea 
                        value={slide.content}
                        onChange={(e) => onUpdate?.({ content: e.target.value })}
                        className="w-full h-auto min-h-[200px] text-5xl md:text-6xl font-bold text-slate-900 dark:text-white bg-transparent border-none text-center resize-none focus:ring-0 leading-tight placeholder:text-slate-200 dark:placeholder:text-slate-800"
                        placeholder="Enter a powerful statement..."
                    />
                ) : (
                    <h2 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white leading-tight">
                        {slide.content}
                    </h2>
                )}
                
                <div className="mt-12 text-slate-500 dark:text-slate-400 font-mono uppercase tracking-widest text-sm">
                     {isEditable ? (
                        <input 
                            value={slide.title}
                            onChange={(e) => onUpdate?.({ title: e.target.value })}
                            className="bg-transparent border-none text-center focus:ring-0 w-full placeholder:text-slate-300 dark:placeholder:text-slate-700 text-slate-500 dark:text-slate-400"
                            placeholder="Supporting Text / Author"
                        />
                    ) : slide.title}
                </div>
            </motion.div>
        </div>
    );
}

// 4. GALLERY TEMPLATE
export function GallerySlide({ slide, isEditable, onUpdate, onGalleryUpload }: TemplateProps & { onGalleryUpload?: (files: FileList) => void }) {
    // Assuming galleryImages is an array of objects with assetId/url
    const images = slide.galleryImages || [];

    return (
        <div className="h-full w-full bg-slate-50 dark:bg-slate-900 p-8 overflow-y-auto">
            <div className="max-w-6xl mx-auto h-full flex flex-col">
                 <div className="flex items-center justify-between mb-8">
                    {isEditable ? (
                        <input 
                            value={slide.title}
                            onChange={(e) => onUpdate?.({ title: e.target.value })}
                            className="text-3xl font-bold text-slate-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-400"
                            placeholder="Gallery Title"
                        />
                    ) : (
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{slide.title}</h2>
                    )}
                    
                    {isEditable && onGalleryUpload && (
                         <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <Plus className="w-4 h-4" />
                            Add Images
                            <input 
                                type="file" 
                                className="hidden" 
                                multiple 
                                accept="image/*" 
                                onChange={(e) => e.target.files && onGalleryUpload(e.target.files)} 
                            />
                        </label>
                    )}
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1 auto-rows-[200px]">
                    {images.map((img: any, idx: number) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className={cn(
                                "relative rounded-2xl overflow-hidden group shadow-sm hover:shadow-lg transition-all",
                                idx % 3 === 0 ? "md:col-span-2 md:row-span-2" : ""
                            )}
                        >
                            <img 
                                src={img.url || img.assetId} 
                                alt={`Gallery ${idx}`} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {isEditable && (
                                <button 
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                    onClick={() => {
                                        const newImages = [...images];
                                        newImages.splice(idx, 1);
                                        onUpdate?.({ galleryImages: newImages });
                                    }}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </motion.div>
                    ))}
                    
                    {images.length === 0 && (
                        <div className="col-span-full h-[400px] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-4">
                            <ImageIcon className="w-16 h-16 opacity-50" />
                            <p>No images added yet</p>
                            {isEditable && onGalleryUpload && (
                                <label className="cursor-pointer px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                                    Upload Images
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        multiple 
                                        accept="image/*" 
                                        onChange={(e) => e.target.files && onGalleryUpload(e.target.files)} 
                                    />
                                </label>
                            )}
                        </div>
                    )}
                 </div>
            </div>
        </div>
    );
}
