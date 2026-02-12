"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { History, Save, RotateCcw, Clock, User, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { saveStrategyVersion, restoreStrategyVersion } from "@/app/actions/campaigns";
import { useRouter } from "next/navigation";

interface StrategyVersion {
  _key: string;
  timestamp: string;
  author: string;
  description?: string;
}

interface StrategyHistoryDialogProps {
  campaignId: string;
  history: StrategyVersion[];
}

export function StrategyHistoryDialog({ campaignId, history = [] }: StrategyHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [description, setDescription] = useState("");
  const router = useRouter();

  const handleSave = async () => {
    if (!description.trim()) {
      toast.error("Please add a description for this version");
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("campaignId", campaignId);
      formData.append("description", description);

      const result = await saveStrategyVersion(formData);
      if (result.error) throw new Error(result.error);

      toast.success("Version saved successfully");
      setDescription("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save version");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = async (versionKey: string) => {
    if (!confirm("Are you sure you want to restore this version? Current unsaved changes will be lost.")) {
      return;
    }

    setIsRestoring(true);
    try {
      const formData = new FormData();
      formData.append("campaignId", campaignId);
      formData.append("versionKey", versionKey);

      const result = await restoreStrategyVersion(formData);
      if (result.error) throw new Error(result.error);

      toast.success("Version restored successfully");
      setOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to restore version");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl">
          <History className="h-4 w-4" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Version History</DialogTitle>
          <DialogDescription>
            Save checkpoints of your strategy or restore previous versions.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 items-end py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex-1 space-y-2">
            <Label htmlFor="description">Create New Version</Label>
            <Input
              id="description"
              placeholder="e.g. Before client feedback changes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !description.trim()}
            className="h-10 rounded-xl gap-2"
          >
            {isSaving ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Version
          </Button>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-4">
            {history.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No versions saved yet.</p>
              </div>
            ) : (
              history.map((version) => (
                <div 
                  key={version._key} 
                  className="flex items-start justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="rounded-lg h-6 font-mono text-xs">
                        {format(new Date(version.timestamp), "MMM d, HH:mm")}
                      </Badge>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {version.description || "Manual Save"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pl-1">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {version.author}
                      </span>
                      {/* We could show size or change count if available */}
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestore(version._key)}
                    disabled={isRestoring}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    Restore
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
