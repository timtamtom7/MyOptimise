import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-formatting";
import { Instagram, Smartphone, Facebook, Linkedin, Youtube, Film, Image as ImageIcon, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ContentGridProps {
  items: any[];
  onPostClick?: (post: any) => void;
  capabilities?: {
    canWrite: boolean;
    canViewServices: boolean;
    canManageConnections?: boolean;
  };
}

export function ContentGrid({ items, onPostClick }: ContentGridProps) {
  if (!items || items.length === 0) return <div className="text-center text-muted-foreground py-8">No content scheduled.</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card
            key={item._id}
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onPostClick?.(item)}
          >
            {item.firstAssetUrl && (
              <div className="relative w-full h-36 bg-muted/50">
                <Image
                  src={item.firstAssetUrl}
                  alt={item.title}
                  fill
                  className="absolute inset-0 object-cover"
                />
              </div>
            )}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/20">
              <CardTitle className="text-sm font-medium truncate max-w-[150px]" title={item.title}>{item.title}</CardTitle>
              <PlatformIcon platform={item.platform} />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <PostTypeIcon type={item.postType} />
                    <span className="capitalize">{item.postType?.replace('_', ' ')}</span>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                
                {item.scheduledAt ? (
                  <div className="text-xs text-muted-foreground border-t pt-2 mt-1">
                    Scheduled for <br/>
                    <span className="font-medium text-foreground">{formatDate(item.scheduledAt, "MMM d, yyyy @ h:mm a")}</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground border-t pt-2 mt-1 italic">
                    Unscheduled
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
  );
}

export function PlatformIcon({ platform, className }: { platform: string, className?: string }) {
  switch (platform) {
    case 'instagram': return <Instagram className={cn("h-4 w-4 text-pink-500", className)} />;
    case 'facebook': return <Facebook className={cn("h-4 w-4 text-blue-600", className)} />;
    case 'linkedin': return <Linkedin className={cn("h-4 w-4 text-blue-700", className)} />;
    case 'tiktok': return <div className={cn("font-bold text-[10px] bg-black text-white px-1 rounded", className)}>Tk</div>;
    case 'youtube_shorts': return <Youtube className={cn("h-4 w-4 text-red-600", className)} />;
    default: return <Smartphone className={cn("h-4 w-4 text-gray-500", className)} />;
  }
}

export function PostTypeIcon({ type }: { type: string }) {
    switch (type) {
        case 'reel': return <Film className="h-3 w-3" />;
        case 'story': return <Smartphone className="h-3 w-3" />;
        case 'carousel': return <Layers className="h-3 w-3" />;
        default: return <ImageIcon className="h-3 w-3" />;
    }
}

export function StatusBadge({ status }: { status: string }) {
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    let className = "";

    switch (status) {
        case 'published': 
            variant = "default"; 
            className = "bg-green-600 hover:bg-green-700";
            break;
        case 'scheduled': 
            variant = "secondary"; 
            className = "bg-blue-100 text-blue-800 hover:bg-blue-200";
            break;
        case 'client_review':
            variant = "secondary";
            className = "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
            break;
        case 'draft':
            variant = "outline";
            break;
    }

    return <Badge variant={variant} className={className}>{status?.replace('_', ' ')}</Badge>;
}
