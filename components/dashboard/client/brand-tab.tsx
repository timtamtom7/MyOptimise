"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Image as ImageIcon, Sparkles, Type } from "lucide-react";
import { UpsellCard } from "./upsell-card";

interface BrandTabProps {
  account: any;
  actions?: {
    suggestBrandAssetTags?: (formData: FormData) => Promise<void>;
  };
  canWrite?: boolean;
}

export function BrandTab({ account, actions, canWrite }: BrandTabProps) {
  const assets = account.brandAssets || [];
  const logos = assets.filter((a: any) => a.type === "logo");
  const fonts = assets.filter((a: any) => a.type === "font");
  const guidelines = assets.filter((a: any) => a.type === "guidelines");

  const renderAsset = (asset: any, icon: any) => {
    const tags: string[] = Array.isArray(asset.tags) ? asset.tags : [];
    const aiTags: string[] = Array.isArray(asset.aiTags) ? asset.aiTags : [];
    const hasTags = tags.length > 0;
    const hasAiTags = aiTags.length > 0;
    const canSuggest = Boolean(actions?.suggestBrandAssetTags) && canWrite !== false;

    return (
      <div className="space-y-2">
        <a
          href={asset.fileUrl || asset.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <div className="border rounded-lg p-6 flex flex-col items-center justify-center gap-4 hover:border-primary transition-colors bg-card h-32">
            {icon}
            <span className="font-medium text-sm text-center truncate w-full">
              {asset.title}
            </span>
          </div>
        </a>

        {(hasTags || hasAiTags) && (
          <div className="flex flex-wrap gap-1">
            {hasTags &&
              tags.map((t, i) => (
                <Badge key={`tag-${i}`} variant="outline" className="text-xs">
                  {t}
                </Badge>
              ))}
            {!hasTags &&
              hasAiTags &&
              aiTags.map((t, i) => (
                <Badge key={`aitag-${i}`} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
          </div>
        )}

        {canSuggest && asset._key && (
          <form
            action={actions?.suggestBrandAssetTags}
            className="mt-1 flex flex-wrap gap-2"
          >
            <input type="hidden" name="accountId" value={String(account._id || "")} />
            <input type="hidden" name="assetKey" value={String(asset._key)} />
            <input type="hidden" name="assetTitle" value={String(asset.title || "")} />
            <input type="hidden" name="assetType" value={String(asset.type || "")} />
            <input
              type="hidden"
              name="assetUrl"
              value={String(asset.fileUrl || asset.url || "")}
            />
            <Button type="submit" size="sm" variant="outline">
              <Sparkles className="mr-1 h-3 w-3" />
              Suggest tags
            </Button>
          </form>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Assets</CardTitle>
              <CardDescription>Official assets for use in content creation.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="logos">
                <TabsList>
                  <TabsTrigger value="logos">Logos</TabsTrigger>
                  <TabsTrigger value="fonts">Fonts</TabsTrigger>
                  <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
                </TabsList>
                <TabsContent value="logos" className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {logos.length === 0 && (
                      <p className="text-muted-foreground text-sm py-8">
                        No logos uploaded.
                      </p>
                    )}
                    {logos.map((logo: any, i: number) => (
                      <div key={i}>{renderAsset(logo, <ImageIcon className="h-8 w-8 text-primary" />)}</div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="fonts" className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {fonts.length === 0 && (
                      <p className="text-muted-foreground text-sm py-8">
                        No fonts uploaded.
                      </p>
                    )}
                    {fonts.map((font: any, i: number) => (
                      <div key={i}>{renderAsset(font, <Type className="h-8 w-8 text-primary" />)}</div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="guidelines" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {guidelines.length === 0 && (
                      <p className="text-muted-foreground text-sm py-8">
                        No guidelines uploaded.
                      </p>
                    )}
                    {guidelines.map((g: any, i: number) => (
                      <div key={i}>{renderAsset(g, <FileText className="h-8 w-8 text-primary" />)}</div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        <div className="w-full md:w-80 space-y-6">
          <UpsellCard account={account} />
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {account.serviceScope ? account.serviceScope.split("-")[0] : "Standard Plan"}
              </div>
              <p className="text-sm text-muted-foreground">
                {account.serviceScope?.split("-")[1] || "$2,000/mo"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
