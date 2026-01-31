"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Check, RefreshCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { generateContextSuggestions, updateClientContext } from "@/app/actions/campaigns";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";

interface CampaignContextTabProps {
  campaign: any;
  user: any;
}

export function CampaignContextTab({ campaign, user }: CampaignContextTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  
  // Local state for context fields, initialized from campaign/client
  const [context, setContext] = useState({
    industry: campaign.client.industry || "",
    audience: campaign.client.audience || "",
    goals: campaign.client.creativeGoal || "",
    tone: campaign.client.brandVoice || ""
  });

  const debouncedContext = useDebounce(context, 1000);

  useEffect(() => {
    // Skip initial mount or if values match server
    if (
      debouncedContext.industry === (campaign.client.industry || "") &&
      debouncedContext.audience === (campaign.client.audience || "") &&
      debouncedContext.goals === (campaign.client.creativeGoal || "") &&
      debouncedContext.tone === (campaign.client.brandVoice || "")
    ) {
      return;
    }

    const save = async () => {
      setIsSaving(true);
      const formData = new FormData();
      formData.append("clientId", campaign.client._id);
      formData.append("industry", debouncedContext.industry);
      formData.append("audience", debouncedContext.audience);
      formData.append("creativeGoal", debouncedContext.goals);
      formData.append("brandVoice", debouncedContext.tone);

      try {
        const res = await updateClientContext(formData);
        if (!res.success) {
            toast.error("Failed to auto-save context");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSaving(false);
      }
    };

    save();
  }, [debouncedContext, campaign.client]);

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const res = await generateContextSuggestions(campaign.client.name, context.industry, context);
      if (res.success && res.suggestions) {
        setSuggestions(res.suggestions);
        toast.success("Suggestions generated");
      } else {
        toast.error("Failed to generate suggestions");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleAccept(key: string, value: any) {
    let stateKey = key;
    let textValue = value;

    if (key === "targetAudience") {
        stateKey = "audience";
    } else if (key === "toneOfVoice") {
        stateKey = "tone";
    } else if (key === "pillars") {
        stateKey = "goals"; // Map pillars to goals for now
        textValue = Array.isArray(value) ? value.join(", ") : value;
    }

    if (Array.isArray(value) && key !== "pillars") {
        textValue = value.join(", ");
    }

    setContext(prev => ({ ...prev, [stateKey]: textValue }));
    toast.success(`Updated ${stateKey}`);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Context</CardTitle>
            <CardDescription>Define the strategic context for this campaign.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Industry / Niche</Label>
              <Textarea 
                value={context.industry} 
                onChange={(e) => setContext({...context, industry: e.target.value})}
                placeholder="e.g. Luxury Real Estate"
              />
            </div>
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Textarea 
                value={context.audience} 
                onChange={(e) => setContext({...context, audience: e.target.value})}
                placeholder="e.g. HNWIs looking for vacation homes"
              />
            </div>
            <div className="space-y-2">
              <Label>Campaign Goals</Label>
              <Textarea 
                value={context.goals} 
                onChange={(e) => setContext({...context, goals: e.target.value})}
                placeholder="e.g. Drive inquiries for new development"
              />
            </div>
            <div className="space-y-2">
              <Label>Brand Voice</Label>
              <Textarea 
                value={context.tone} 
                onChange={(e) => setContext({...context, tone: e.target.value})}
                placeholder="e.g. Sophisticated, minimalist, confident"
              />
            </div>
            
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
              {isGenerating ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate AI Suggestions
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {suggestions ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
              AI Suggestions
            </h3>
            
            {Object.entries(suggestions).map(([key, value]: [string, any]) => {
              if (key.includes("Options")) return null;
              
              return (
              <Card key={key} className="bg-slate-50 dark:bg-slate-900 border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4">
                    {Array.isArray(value) ? (
                        <ul className="list-disc pl-4 space-y-1">
                            {value.map((v: string, i: number) => <li key={i}>{v}</li>)}
                        </ul>
                    ) : (
                        <p>{value}</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleAccept(key, value)}>
                    <Check className="mr-2 h-4 w-4" />
                    Apply
                  </Button>
                </CardContent>
              </Card>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
            <Sparkles className="h-12 w-12 opacity-20 mb-4" />
            <p>Generate suggestions to improve your campaign strategy.</p>
          </div>
        )}
      </div>
    </div>
  );
}
