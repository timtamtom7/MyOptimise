
import { Brief } from "@/types/briefs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, AlertCircle, Clock, DollarSign, Target, Lightbulb, Link as LinkIcon, AlertTriangle, Tag, Download, FileText, History } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface JobDetailProps {
  brief: Brief | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (briefId: string, status: string) => Promise<void>;
  onUpload?: (briefId: string, videoUrl: string) => Promise<void>;
  createUploadUrl?: (path: string) => Promise<{ signedUrl: string; token: string; path: string } | null>;
  onClaim?: (briefId: string) => Promise<void>;
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
    <div className={`flex items-center gap-2 font-mono text-sm ${isOverdue ? "text-red-600 font-bold" : "text-muted-foreground"}`}>
      <Clock className="h-4 w-4" />
      {timeLeft}
    </div>
  );
}

export function JobDetail({ brief, isOpen, onClose, onStatusUpdate, onUpload, createUploadUrl, onClaim }: JobDetailProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [submissionUrl, setSubmissionUrl] = useState("");

  if (!brief) return null;

  const isUnclear = !brief.script || !brief.hook || !brief.visual_direction;
  const isClaimed = !!brief.assignee_id;
  const meta = (brief.metadata || {}) as any;
  const brandTags = Array.isArray(meta.brandTags)
    ? (meta.brandTags as unknown[]).filter(
        (tag) => typeof tag === "string" && tag.trim(),
      ) as string[]
    : [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0 || !onUpload || !createUploadUrl) return;
      const file = e.target.files[0];
      
      try {
          setIsUploading(true);
          const filename = `${brief.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          
          const uploadData = await createUploadUrl(filename);
          if (!uploadData?.signedUrl) throw new Error("Failed to get upload URL");
          
          const res = await fetch(uploadData.signedUrl, {
              method: 'PUT',
              body: file,
              headers: {
                  'Content-Type': file.type
              }
          });
          
          if (!res.ok) throw new Error("Failed to upload file");
          
          // Construct public URL
          // Assuming NEXT_PUBLIC_SUPABASE_URL is available
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/deliverables/${filename}`;
              
          await onUpload(brief.id, publicUrl);
          toast.success("Draft uploaded successfully");
      } catch (error) {
          console.error(error);
          toast.error("Failed to upload draft");
      } finally {
          setIsUploading(false);
      }
  };


  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      await onStatusUpdate(brief.id, newStatus);
      toast.success("Status updated successfully");
      onClose();
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
            <div className="space-y-1">
                <DialogTitle className="text-2xl">{brief.title}</DialogTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {brief.platform && <Badge variant="outline">{brief.platform}</Badge>}
                    {brief.format && <Badge variant="outline">{brief.format}</Badge>}
                    {brief.difficulty && <Badge variant={brief.difficulty === 'high' ? 'destructive' : 'secondary'}>{brief.difficulty} Difficulty</Badge>}
                </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                <Badge variant={brief.status === "assigned" ? "default" : "secondary"}>
                {brief.status.replace("_", " ")}
                </Badge>
                {brief.deadline && <CountdownTimer deadline={brief.deadline} />}
            </div>
          </div>
          <DialogDescription>
             Created on {brief.created_at ? new Date(brief.created_at).toLocaleDateString() : 'Unknown date'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
            
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

            {/* Top Bar: Pay and Status */}
            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border">
                <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-lg text-green-700">${brief.price || 0}</span>
                    <span className="text-sm text-muted-foreground">Pay upon approval</span>
                </div>
                {brief.claimed_at && (
                    <div className="text-sm text-muted-foreground">
                        Claimed on {new Date(brief.claimed_at).toLocaleDateString()}
                    </div>
                )}
            </div>

            {/* Strategy / Concept Section */}
            {(brief.creative_goal || brief.content_concept) && (
                <div className="grid md:grid-cols-2 gap-4">
                    {brief.creative_goal && (
                        <div className="space-y-2">
                            <h3 className="font-semibold flex items-center gap-2"><Target className="h-4 w-4" /> Creative Goal</h3>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{brief.creative_goal}</p>
                        </div>
                    )}
                    {brief.content_concept && (
                        <div className="space-y-2">
                            <h3 className="font-semibold flex items-center gap-2"><Lightbulb className="h-4 w-4" /> Concept</h3>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">{brief.content_concept}</p>
                        </div>
                    )}
                </div>
            )}

            {brandTags.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold mb-1 flex items-center gap-2">
                  <Tag className="h-4 w-4" /> Brand tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {brandTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Hook</h3>
              <div className="bg-muted p-3 rounded-md text-sm">
                {brief.hook || "No hook provided"}
              </div>
            </div>

            <div className="h-px bg-border" />

            <div>
              <h3 className="font-semibold mb-2">Script</h3>
              <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                {brief.script || "No script provided"}
              </div>
            </div>

            <div className="h-px bg-border" />

            <div>
              <h3 className="font-semibold mb-2">Visual Direction</h3>
              <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">
                {brief.visual_direction || "No visual direction provided"}
              </div>
            </div>

            {/* Assets & References */}
            <div className="grid md:grid-cols-2 gap-4">
                {(brief.assets_url || (brief.required_assets && brief.required_assets.length > 0)) && (
                    <div>
                        <h3 className="font-semibold mb-2 flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Required Assets</h3>
                        <div className="space-y-2">
                            {brief.assets_url && (
                                <a 
                                    href={brief.assets_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline break-all text-sm block bg-muted/50 p-2 rounded flex items-center gap-2"
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
                                    className="text-primary hover:underline break-all text-sm block bg-muted/50 p-2 rounded flex items-center gap-2"
                                >
                                    {asset.type === 'file' ? <FileText className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
                                    {asset.name || `Asset ${i + 1}`}
                                </a>
                            ))}
                        </div>
                    </div>
                )}
                {brief.references && brief.references.length > 0 && (
                    <div>
                        <h3 className="font-semibold mb-2">References</h3>
                        <ul className="space-y-1">
                            {brief.references.map((ref, i) => (
                                <li key={i}>
                                    <a href={ref} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                        Reference Link {i + 1}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <div className="h-px bg-border" />
            <div className="pt-2">
              <h3 className="font-semibold mb-3">Deliverable</h3>
              
              {brief.video_url && (
                  <div className="mb-4 rounded-md overflow-hidden border bg-black">
                      <video 
                        src={brief.video_url} 
                        controls 
                        className="w-full max-h-[300px]" 
                      />
                  </div>
              )}

              {brief.feedback && (
                 <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Feedback:</p>
                    {brief.feedback}
                 </div>
              )}
              
              {(brief.status === 'assigned' || brief.status === 'in_review') && onUpload && (
                  <div className="flex flex-col gap-4 mt-4 p-4 border rounded-lg bg-muted/20">
                      <div className="space-y-2">
                          <h4 className="font-medium text-sm">Upload File</h4>
                          <div className="flex items-center gap-4">
                              <Button disabled={isUploading} asChild className="w-full sm:w-auto">
                                  <label className="cursor-pointer">
                                      {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                      {brief.video_url ? "Upload New Version" : "Upload Video File"}
                                      <input 
                                          type="file" 
                                          className="hidden" 
                                          accept="video/*"
                                          onChange={handleFileUpload}
                                          disabled={isUploading}
                                      />
                                  </label>
                              </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Uploading will automatically submit this brief for review.
                          </p>
                      </div>

                      <div className="relative flex items-center">
                          <div className="flex-grow border-t border-muted-foreground/20"></div>
                          <span className="flex-shrink-0 mx-2 text-muted-foreground text-xs uppercase">OR</span>
                          <div className="flex-grow border-t border-muted-foreground/20"></div>
                      </div>

                      <div className="space-y-2">
                          <h4 className="font-medium text-sm">Submit External Link</h4>
                          <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="Paste link (Loom, Google Drive, Frame.io)" 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={submissionUrl}
                                onChange={(e) => setSubmissionUrl(e.target.value)}
                                disabled={isUploading}
                              />
                              <Button 
                                disabled={!submissionUrl || isUploading} 
                                onClick={async () => {
                                    try {
                                        setIsUploading(true);
                                        await onUpload(brief.id, submissionUrl);
                                        toast.success("Link submitted successfully");
                                        setSubmissionUrl("");
                                        onClose();
                                    } catch (e) {
                                        toast.error("Failed to submit link");
                                        console.error(e);
                                    } finally {
                                        setIsUploading(false);
                                    }
                                }}
                              >
                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
                              </Button>
                          </div>
                      </div>
                  </div>
              )}
            </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto p-6">
             <div className="max-w-2xl mx-auto space-y-8">
              {!brief.status_history || brief.status_history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No history available for this job.</p>
                </div>
              ) : (
                <div className="relative border-l border-slate-200 ml-3 space-y-8">
                  {[...brief.status_history].reverse().map((item: any, i: number) => (
                    <div key={i} className="relative pl-8">
                      <span className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-slate-300 ring-4 ring-white" />
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-medium">
                          Changed status to <Badge variant="outline" className="ml-1">{item.toStatus?.replace("_", " ") || "Unknown"}</Badge>
                        </div>
                        {item.fromStatus && (
                          <div className="text-xs text-muted-foreground">
                            Previous status: {item.fromStatus.replace("_", " ")}
                          </div>
                        )}
                        {item.notes && (
                           <div className="text-xs bg-muted p-2 rounded mt-1">
                             {item.notes}
                           </div>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(item.changedAt).toLocaleString()}</span>
                          {item.changedBy && (
                            <>
                              <span>•</span>
                              <span>by {item.changedBy.name || item.changedBy.email || "Unknown User"}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4 gap-2 sm:gap-0 px-6 pb-6">
          {onClaim && !brief.assignee_id && (
             <Button onClick={async () => {
                try {
                    setIsUpdating(true);
                    await onClaim(brief.id);
                    toast.success("Job claimed successfully");
                    onClose();
                } catch(e) {
                    toast.error("Failed to claim job");
                    console.error(e);
                } finally {
                    setIsUpdating(false);
                }
             }} disabled={isUpdating} className="mr-auto">
               {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Claim Job
             </Button>
          )}

          <Button variant="outline" onClick={onClose} disabled={isUpdating}>
            Close
          </Button>
          
          {brief.status === "assigned" && !onUpload && (
            <Button onClick={() => handleStatusChange("in_review")} disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for Review
            </Button>
          )}

          {brief.status === "in_review" && (
             <Button disabled variant="secondary">
                In Review
             </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
