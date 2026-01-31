"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, User, Star, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { findMatchingEditors, assignEditor, EditorMatch } from "@/app/actions/talent";

interface AssignEditorDialogProps {
  deliverableId: string;
  currentAssignee?: { name: string; avatar?: any };
  onAssignSuccess?: () => void;
}

export function AssignEditorDialog({ deliverableId, currentAssignee, onAssignSuccess }: AssignEditorDialogProps) {
  const [open, setOpen] = useState(false);
  const [editors, setEditors] = useState<EditorMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEditorId, setSelectedEditorId] = useState<string | null>(null);
  const [isAssigning, startTransition] = useTransition();

  const loadEditors = () => {
    if (!deliverableId) return;
    setLoading(true);
    findMatchingEditors(deliverableId)
      .then((result) => {
        if (result.error) {
          toast.error(result.error);
        } else {
          setEditors(result.editors);
          if (result.editors.length > 0) {
            setSelectedEditorId(result.editors[0].id);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  const handleAssign = () => {
    if (!deliverableId || !selectedEditorId) return;

    startTransition(async () => {
      const result = await assignEditor(deliverableId, selectedEditorId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Editor assigned successfully");
        onAssignSuccess?.();
        setOpen(false);
      }
    });
  };

  if (currentAssignee) {
      return (
          <>
            <div 
                className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer rounded-full pl-1 pr-3 py-0.5 transition-colors" 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
            >
                <Avatar className="w-5 h-5">
                    <AvatarImage src={currentAssignee.avatar?.asset?.url} />
                    <AvatarFallback>{currentAssignee.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[100px]">{currentAssignee.name}</span>
            </div>
            {/* We duplicate the dialog here to support re-assigning */}
            <Dialog 
              open={open} 
              onOpenChange={(val) => {
                setOpen(val);
                if (val) loadEditors();
              }}
            >
                <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>Re-assign Editor</DialogTitle>
                    <DialogDescription>
                    Select a new editor for this deliverable.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2 min-h-[300px]">
                    {loading ? (
                    <div className="flex h-[300px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    </div>
                ) : editors.length === 0 ? (
                    <div className="flex h-[300px] flex-col items-center justify-center text-slate-500">
                    <User className="h-12 w-12 mb-2 opacity-20" />
                    <p>No matching editors found.</p>
                    </div>
                ) : (
                    <div className="space-y-3 p-1">
                    {editors.map((editor) => (
                        <div
                        key={editor.id}
                        onClick={() => setSelectedEditorId(editor.id)}
                        className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedEditorId === editor.id
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-600"
                            : "border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700"
                        }`}
                        >
                        <Avatar className="h-12 w-12 border border-slate-200">
                            <AvatarImage src={editor.avatar?.asset?.url} />
                            <AvatarFallback>{editor.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">{editor.name}</h4>
                            {editor.matchScore > 0 && (
                                <Badge variant={editor.matchScore > 30 ? "default" : "secondary"} className="gap-1">
                                <Star className="h-3 w-3 fill-current" />
                                {editor.matchScore}% Match
                                </Badge>
                            )}
                            </div>
                            
                            <div className="text-sm text-slate-500 mb-2">{editor.email}</div>
                            
                            {editor.matchReasons.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {editor.matchReasons.map((reason, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                                    <Check className="h-3 w-3 mr-1" />
                                    {reason}
                                </span>
                                ))}
                            </div>
                            )}
                            
                            <div className="flex flex-wrap gap-1">
                            {(editor.skills || []).slice(0, 5).map((skill, i) => (
                                <Badge key={i} variant="outline" className="text-xs font-normal text-slate-500 border-slate-200">
                                {skill}
                                </Badge>
                            ))}
                            {(editor.skills || []).length > 5 && (
                                <span className="text-xs text-slate-400 px-1">+{(editor.skills || []).length - 5} more</span>
                            )}
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleAssign} disabled={!selectedEditorId || isAssigning || loading}>
                    {isAssigning ? (
                        <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Assigning...
                        </>
                    ) : (
                        "Re-assign Selected Editor"
                    )}
                    </Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
          </>
      )
  }

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 text-xs text-slate-500 hover:text-blue-600 px-2 -ml-2"
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
        }}
      >
        <UserPlus className="w-3.5 h-3.5 mr-1.5" />
        Assign Editor
      </Button>

      <Dialog 
        open={open} 
        onOpenChange={(val) => {
          setOpen(val);
          if (val) loadEditors();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Assign Editor</DialogTitle>
            <DialogDescription>
              AI-matched editors based on skills and style.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2 -mr-2 min-h-[300px]">
             {loading ? (
            <div className="flex h-[300px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : editors.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center text-slate-500">
              <User className="h-12 w-12 mb-2 opacity-20" />
              <p>No matching editors found.</p>
            </div>
          ) : (
            <div className="space-y-3 p-1">
              {editors.map((editor) => (
                <div
                  key={editor.id}
                  onClick={() => setSelectedEditorId(editor.id)}
                  className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedEditorId === editor.id
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-600"
                      : "border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700"
                  }`}
                >
                  <Avatar className="h-12 w-12 border border-slate-200">
                    <AvatarImage src={editor.avatar?.asset?.url} />
                    <AvatarFallback>{editor.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">{editor.name}</h4>
                      {editor.matchScore > 0 && (
                        <Badge variant={editor.matchScore > 30 ? "default" : "secondary"} className="gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          {editor.matchScore}% Match
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm text-slate-500 mb-2">{editor.email}</div>
                    
                    {editor.matchReasons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {editor.matchReasons.map((reason, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800">
                            <Check className="h-3 w-3 mr-1" />
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      {(editor.skills || []).slice(0, 5).map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-xs font-normal text-slate-500 border-slate-200">
                          {skill}
                        </Badge>
                      ))}
                      {(editor.skills || []).length > 5 && (
                         <span className="text-xs text-slate-400 px-1">+{(editor.skills || []).length - 5} more</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedEditorId || isAssigning || loading}>
              {isAssigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Selected Editor"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
