"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Image as ImageIcon, Film, File } from "lucide-react";

interface Deliverable {
  _id: string;
  title: string;
  status: string;
  type: string;
  campaignTitle?: string;
  latestAsset?: {
    url: string;
    originalFilename: string;
    mimeType: string;
    extension: string;
  };
}

interface DeliverablesLibraryProps {
  deliverables: Deliverable[];
}

export function DeliverablesLibrary({ deliverables }: DeliverablesLibraryProps) {
  const approvedItems = deliverables.filter(d => d.status === "approved" || d.status === "published");
  
  // Helper to get icon based on type
  const getIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('video') || t.includes('reel')) return <Film className="h-10 w-10 text-muted-foreground" />;
    if (t.includes('image') || t.includes('photo') || t.includes('graphic')) return <ImageIcon className="h-10 w-10 text-muted-foreground" />;
    if (t.includes('pdf') || t.includes('report')) return <FileText className="h-10 w-10 text-muted-foreground" />;
    return <File className="h-10 w-10 text-muted-foreground" />;
  };

  if (approvedItems.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <div className="flex justify-center mb-4">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-medium">No Approved Deliverables Yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
          Once deliverables are approved, they will appear here for you to download and use.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {approvedItems.map((item) => (
        <Card key={item._id} className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <Badge variant="outline" className="mb-2 capitalize">{item.type}</Badge>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Approved</Badge>
            </div>
            <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
            <CardDescription className="line-clamp-1">{item.campaignTitle || "General"}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center py-8 bg-muted/10">
            {/* Thumbnail Placeholder - in production this would be a real image for image types */}
            {item.latestAsset?.mimeType?.startsWith("image/") && item.latestAsset.url ? (
              <Image 
                src={item.latestAsset.url} 
                alt={item.title} 
                width={0}
                height={0}
                sizes="100vw"
                className="max-h-32 w-auto h-auto object-contain rounded-md shadow-sm"
              />
            ) : (
              getIcon(item.type)
            )}
          </CardContent>
          <CardFooter className="pt-4 border-t">
            {item.latestAsset?.url ? (
              <Button className="w-full" asChild variant="outline">
                <a href={item.latestAsset.url + "?dl=" + (item.latestAsset.originalFilename || item.title)} download>
                  <Download className="mr-2 h-4 w-4" /> Download
                </a>
              </Button>
            ) : (
              <Button className="w-full" disabled variant="secondary">
                <File className="mr-2 h-4 w-4" /> Processing...
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
