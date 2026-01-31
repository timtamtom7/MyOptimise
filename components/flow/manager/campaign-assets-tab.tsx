"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, Trash2, Tag, Search, Filter, MoreVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { uploadClientAsset, deleteClientAsset, updateClientAssetTags } from "@/app/actions/campaigns";
import Image from "next/image";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface CampaignAssetsTabProps {
  campaign: any;
  user: any;
}

export function CampaignAssetsTab({ campaign, user }: CampaignAssetsTabProps) {
  const [assets, setAssets] = useState(campaign.client.brandAssets || []);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filteredAssets = assets.filter((asset: any) => {
    const matchesSearch = asset.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asset.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = selectedTag ? asset.tags?.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  const allTags = Array.from(new Set(assets.flatMap((a: any) => a.tags || []))) as string[];

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsUploading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("clientId", campaign.client._id); // Assuming client has _id

    try {
      const res = await uploadClientAsset(formData);
      if (res.success) {
        toast.success("Asset uploaded successfully");
        // Optimistically update or re-fetch (for now assuming res.asset is returned)
        if (res.asset) {
          setAssets([...assets, res.asset]);
        }
      } else {
        toast.error("Failed to upload asset");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(assetId: string) {
    if (!confirm("Are you sure you want to delete this asset?")) return;
    
    try {
        const res = await deleteClientAsset(campaign.client._id, assetId);
        if (res.success) {
            toast.success("Asset deleted");
            setAssets(assets.filter((a: any) => a._key !== assetId && a._id !== assetId));
        } else {
            toast.error("Failed to delete asset");
        }
    } catch (error) {
        toast.error("Error deleting asset");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {allTags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSelectedTag(null)}>
                  All Tags
                </DropdownMenuItem>
                {allTags.map(tag => (
                  <DropdownMenuItem key={tag} onClick={() => setSelectedTag(tag)}>
                    {tag}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Asset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Brand Asset</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Asset Title</Label>
                <Input id="title" name="title" required placeholder="e.g., Logo Dark Mode" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input id="file" name="file" type="file" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input id="tags" name="tags" placeholder="logo, dark, vector" />
              </div>
              <Button type="submit" className="w-full" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredAssets.map((asset: any) => (
          <Card key={asset._id || asset._key} className="overflow-hidden group">
            <div className="aspect-square relative bg-muted/20">
              {asset.url && (
                <Image
                  src={asset.url}
                  alt={asset.title || "Asset"}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              )}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(asset._key || asset._id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <CardContent className="p-3">
              <div className="font-medium truncate" title={asset.title}>{asset.title || "Untitled"}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {asset.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0 h-5">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredAssets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
          <Upload className="mx-auto h-12 w-12 opacity-20 mb-4" />
          <p>No assets found</p>
        </div>
      )}
    </div>
  );
}
