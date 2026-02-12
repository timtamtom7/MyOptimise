"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { uploadDocument } from "@/app/actions/documents";
import { Plus, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

interface UploadDocumentDialogProps {
  folders: string[];
  clients: any[]; // Used for sharing, though simple version might skip complex sharing UI for now
}

export function UploadDocumentDialog({ folders, clients }: UploadDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      await uploadDocument(formData);
      toast.success("Document uploaded successfully");
      setOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload document");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-12 px-6 rounded-[1.5rem] font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30">
          <Plus className="mr-2 h-5 w-5" /> Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[3rem] p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-950 sm:max-w-[500px]">
        <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-8 border-b border-slate-100 dark:border-slate-800/50 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
            <DialogHeader>
                <DialogTitle className="text-3xl font-black text-slate-900 dark:text-slate-100">Upload File</DialogTitle>
                <DialogDescription className="text-base font-medium mt-1">
                Add a new document to the secure vault.
                </DialogDescription>
            </DialogHeader>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-bold ml-1 text-slate-700 dark:text-slate-300">Document Title</Label>
                <Input 
                    name="title" 
                    placeholder="e.g. Q3 Financial Report" 
                    required 
                    className="h-14 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium px-5"
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <Label htmlFor="folder" className="text-sm font-bold ml-1 text-slate-700 dark:text-slate-300">Folder</Label>
                    <div className="relative">
                        <Input 
                            name="folder" 
                            list="folderOptions" 
                            placeholder="Select or type..."
                            className="h-14 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium px-5"
                        />
                        <datalist id="folderOptions">
                            {folders.map((f) => (
                                <option key={f} value={f} />
                            ))}
                        </datalist>
                    </div>
                </div>
                
                <div className="space-y-3">
                    <Label htmlFor="visibility" className="text-sm font-bold ml-1 text-slate-700 dark:text-slate-300">Visibility</Label>
                    <Select name="visibility" defaultValue="internal">
                        <SelectTrigger className="h-14 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-medium px-5">
                            <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent className="rounded-[2rem] p-2 shadow-xl">
                            <SelectItem value="internal" className="rounded-xl py-3 px-4 font-medium cursor-pointer">Internal Only</SelectItem>
                            <SelectItem value="client" className="rounded-xl py-3 px-4 font-medium cursor-pointer">Shared with Client</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-3">
                <Label htmlFor="file" className="text-sm font-bold ml-1 text-slate-700 dark:text-slate-300">File</Label>
                <div className="relative group">
                    <input 
                        type="file" 
                        name="file" 
                        id="file-upload" 
                        className="hidden" 
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        required
                    />
                    <label 
                        htmlFor="file-upload" 
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-3 text-slate-400" />
                            <p className="mb-2 text-sm text-slate-500 font-medium">
                                {selectedFile ? (
                                    <span className="text-emerald-600 font-bold">{selectedFile.name}</span>
                                ) : (
                                    <span className="font-semibold">Click to upload</span>
                                )}
                            </p>
                        </div>
                    </label>
                </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-14 px-6 rounded-[1.5rem] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800">
                    Cancel
                </Button>
                <Button type="submit" disabled={loading} className="h-14 px-8 rounded-[1.5rem] font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 bg-emerald-600 hover:bg-emerald-700 min-w-[140px]">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Upload"}
                </Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
