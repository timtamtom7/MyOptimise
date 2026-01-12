"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, ExternalLink, FileText, Image, Type } from "lucide-react";
import { UpsellCard } from "./upsell-card";

interface BrandTabProps {
  account: any;
}

export function BrandTab({ account }: BrandTabProps) {
  const assets = account.brandAssets || [];
  const logos = assets.filter((a: any) => a.type === "logo");
  const fonts = assets.filter((a: any) => a.type === "font");
  const guidelines = assets.filter((a: any) => a.type === "guidelines");
  const other = assets.filter((a: any) => !["logo", "font", "guidelines"].includes(a.type));

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
                                {logos.length === 0 && <p className="text-muted-foreground text-sm py-8">No logos uploaded.</p>}
                                {logos.map((logo: any, i: number) => (
                                    <AssetCard key={i} asset={logo} icon={<Image className="h-8 w-8 text-primary" />} />
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="fonts" className="pt-4">
                             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {fonts.length === 0 && <p className="text-muted-foreground text-sm py-8">No fonts uploaded.</p>}
                                {fonts.map((font: any, i: number) => (
                                    <AssetCard key={i} asset={font} icon={<Type className="h-8 w-8 text-primary" />} />
                                ))}
                            </div>
                        </TabsContent>
                         <TabsContent value="guidelines" className="pt-4">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {guidelines.length === 0 && <p className="text-muted-foreground text-sm py-8">No guidelines uploaded.</p>}
                                {guidelines.map((g: any, i: number) => (
                                    <AssetCard key={i} asset={g} icon={<FileText className="h-8 w-8 text-primary" />} />
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
        <div className="w-full md:w-80 space-y-6">
             <UpsellCard account={account} />
             {/* Account Details */}
             <Card>
                 <CardHeader>
                     <CardTitle className="text-sm font-medium">Subscription</CardTitle>
                 </CardHeader>
                 <CardContent>
                     <div className="text-2xl font-bold">{account.serviceScope ? account.serviceScope.split('-')[0] : 'Standard Plan'}</div>
                     <p className="text-sm text-muted-foreground">{account.serviceScope?.split('-')[1] || '$2,000/mo'}</p>
                 </CardContent>
             </Card>
        </div>
      </div>
    </div>
  );
}

function AssetCard({ asset, icon }: { asset: any, icon: any }) {
    return (
        <a href={asset.fileUrl || asset.url} target="_blank" rel="noopener noreferrer" className="block group">
            <div className="border rounded-lg p-6 flex flex-col items-center justify-center gap-4 hover:border-primary transition-colors bg-card h-32">
                {icon}
                <span className="font-medium text-sm text-center truncate w-full">{asset.title}</span>
            </div>
        </a>
    )
}
