"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createConnection, disconnectConnection } from "@/app/actions/social";
import { toast } from "sonner";
import { Instagram, Linkedin, Facebook, Video, Link2, Trash2, RefreshCw, Smartphone } from "lucide-react";

interface SocialConnectionsProps {
  connections: any[];
  clientId: string;
  canWrite: boolean;
}

export function SocialConnections({ connections, clientId, canWrite }: SocialConnectionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [platform, setPlatform] = useState("instagram");
  const [pageName, setPageName] = useState("");
  const [accessToken, setAccessToken] = useState("");

  const handleConnect = async () => {
    if (!pageName) {
      toast.error("Please enter a page name");
      return;
    }
    setLoading(true);
    try {
      // In a real app, this would trigger an OAuth flow.
      // Here we simulate it or take a manual token.
      const tokenToSave = accessToken || `mock_token_${Date.now()}`; 
      
      await createConnection(clientId, platform, tokenToSave, `page_${Date.now()}`, pageName);
      toast.success(`${platform} connected successfully!`);
      setIsOpen(false);
      setPageName("");
      setAccessToken("");
    } catch (e) {
      toast.error("Failed to connect account");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm("Are you sure you want to disconnect this account?")) return;
    try {
      await disconnectConnection(id);
      toast.success("Account disconnected");
    } catch (e) {
      toast.error("Failed to disconnect");
    }
  };

  const getIcon = (p: string) => {
    switch (p) {
      case "instagram": return <Instagram className="h-5 w-5 text-pink-600" />;
      case "facebook": return <Facebook className="h-5 w-5 text-blue-600" />;
      case "linkedin": return <Linkedin className="h-5 w-5 text-blue-700" />;
      case "tiktok": return <Video className="h-5 w-5 text-black" />; // No tiktok icon in standard lucide yet? Use Video
      case "youtube_shorts": return <Video className="h-5 w-5 text-red-600" />;
      default: return <Link2 className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Connected Accounts</h2>
          <p className="text-sm text-muted-foreground">Manage social media connections for publishing.</p>
        </div>
        {canWrite && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                <Link2 className="mr-2 h-4 w-4" /> Connect Account
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Connect Social Account</DialogTitle>
                <CardDescription>
                    Select a platform to connect. In this demo, enter a Page Name to simulate connection.
                </CardDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="youtube_shorts">YouTube Shorts</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Page / Account Name</Label>
                    <Input 
                        placeholder="@username or Page Name" 
                        value={pageName} 
                        onChange={(e) => setPageName(e.target.value)} 
                    />
                </div>
                <div className="space-y-2">
                    <Label>Access Token (Optional / Developer)</Label>
                    <Input 
                        type="password"
                        placeholder="Paste long-lived token here" 
                        value={accessToken} 
                        onChange={(e) => setAccessToken(e.target.value)} 
                    />
                    <p className="text-[10px] text-muted-foreground">Leave empty to auto-generate a mock token.</p>
                </div>
                </div>
                <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleConnect} disabled={loading}>
                    {loading ? "Connecting..." : "Connect"}
                </Button>
                </DialogFooter>
            </DialogContent>
            </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connections.map((conn) => (
          <Card key={conn._id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {conn.platform.replace('_', ' ')}
              </CardTitle>
              {getIcon(conn.platform)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold truncate" title={conn.pageName}>{conn.pageName}</div>
              <div className="flex items-center justify-between mt-4">
                <Badge variant={conn.status === 'active' ? 'default' : 'secondary'}>
                    {conn.status}
                </Badge>
                {canWrite && (
                    <Button variant="ghost" size="icon" onClick={() => handleDisconnect(conn._id)} className="h-8 w-8 text-muted-foreground hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {connections.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-muted/50 text-muted-foreground">
                <Link2 className="h-8 w-8 mb-2 opacity-50" />
                <p>No accounts connected yet.</p>
            </div>
        )}
      </div>
    </div>
  );
}
