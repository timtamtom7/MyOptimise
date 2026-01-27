"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { generateResearch } from "@/app/actions/research";
import { analyzeUrl, searchWeb } from "@/app/actions/research-tools";
import { Sparkles, Loader2, Copy, Plus, Trash2, Globe, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

interface AIResearchAssistantProps {
  client: any;
  activeCampaigns: any[];
  context?: any;
}

export function AIResearchAssistant({ client, activeCampaigns, context }: AIResearchAssistantProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [referenceUrls, setReferenceUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [useWebSearch, setUseWebSearch] = useState(false);

  const suggestions = [
    "Generate 3 campaign ideas for next month",
    "Analyze competitors in this industry",
    "Suggest content pillars based on service scope",
    "Identify potential risks and opportunities",
  ];

  const addUrl = () => {
    if (newUrl && !referenceUrls.includes(newUrl)) {
      setReferenceUrls([...referenceUrls, newUrl]);
      setNewUrl("");
    }
  };

  const removeUrl = (url: string) => {
    setReferenceUrls(referenceUrls.filter(u => u !== url));
  };

  async function handleGenerate() {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setResult(null);

    try {
      // 1. Analyze URLs if any
      let urlContext = "";
      
      if (useWebSearch) {
        toast.info("Searching the web for live data...");
        try {
            const searchRes: any = await searchWeb(prompt);
            if (searchRes.success && searchRes.results) {
                const searchContext = searchRes.results.map((r: any) => 
                    `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`
                ).join("\n\n");
                urlContext += `\n\n=== LIVE WEB SEARCH RESULTS ===\n${searchContext}\n==============================\n`;
            } else if (searchRes.error) {
                toast.error(searchRes.error);
            }
        } catch (e) {
            console.error("Web search failed", e);
        }
      }

      if (referenceUrls.length > 0) {
          toast.info("Analyzing reference URLs...");
          const analyses = await Promise.all(referenceUrls.map(async (url) => {
              try {
                const res: any = await analyzeUrl(url);
                return res.success ? `Source: ${url}\nAnalysis:\n${res.analysis}` : `Source: ${url} (Analysis Failed)`;
              } catch (e) {
                return `Source: ${url} (Error)`;
              }
          }));
          urlContext = "\n\nReference Material:\n" + analyses.join("\n\n");
      }

      const response = await generateResearch(prompt, {
        clientName: client.businessName || client.name,
        industry: client.industry, // Assuming client object has industry
        serviceScope: client.serviceScope,
        recentCampaigns: activeCampaigns.map(c => c.title),
        additionalContext: {
            ...context,
            researchMaterials: urlContext
        },
      });

      if (response.success && response.content) {
        setResult(response.content);
      } else {
        toast.error(response.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("Failed to generate insights");
    } finally {
      setLoading(false);
    }
  }

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      toast.success("Copied to clipboard");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          AI Strategist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Research Assistant
          </DialogTitle>
          <DialogDescription>
            Generate strategic insights, campaign ideas, and research using DeepSeek AI.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!result ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>What do you need help with?</Label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., Suggest a Q3 content strategy focusing on..."
                  className="h-32"
                />
              </div>

              <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
                <Switch 
                    id="web-search" 
                    checked={useWebSearch} 
                    onCheckedChange={setUseWebSearch} 
                />
                <Label htmlFor="web-search" className="flex items-center gap-2 cursor-pointer">
                    <Search className="w-4 h-4 text-blue-500" />
                    Enable Web Search
                    <span className="text-xs text-muted-foreground font-normal">(Finds real-time info via Tavily)</span>
                </Label>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <Globe className="w-3 h-3" /> 
                    Reference URLs (Optional)
                </Label>
                <div className="flex gap-2">
                    <Input 
                        placeholder="https://competitor.com" 
                        value={newUrl} 
                        onChange={(e) => setNewUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addUrl()}
                        className="h-8 text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={addUrl} type="button">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                {referenceUrls.length > 0 && (
                    <div className="space-y-1">
                        {referenceUrls.map((url, i) => (
                            <div key={i} className="flex items-center justify-between text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded">
                                <span className="truncate flex-1">{url}</span>
                                <Button size="icon" variant="ghost" className="h-5 w-5 ml-2" onClick={() => removeUrl(url)}>
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Quick Prompts</Label>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <Badge 
                      key={s} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-secondary/80 py-1"
                      onClick={() => setPrompt(s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg border text-sm prose dark:prose-invert max-w-none">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 mt-auto pt-4 border-t">
          {result ? (
            <>
              <Button variant="ghost" onClick={() => setResult(null)}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button onClick={() => setResult(null)}>
                  Start New
                </Button>
              </div>
            </>
          ) : (
            <div className="flex justify-end w-full">
              <Button onClick={handleGenerate} disabled={loading || !prompt.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Insights"
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
