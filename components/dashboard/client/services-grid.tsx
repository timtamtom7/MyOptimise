"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Globe, Mail, BarChart, Megaphone } from "lucide-react";

interface ClientService {
  _id: string;
  title: string;
  serviceType: string;
  status: string;
  clientEnabled: boolean;
  clientCanToggle: boolean;
}

interface ServicesGridProps {
  services: ClientService[];
  toggleAction: (formData: FormData) => Promise<void>;
}

export function ServicesGrid({ services, toggleAction }: ServicesGridProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "instagram": return <Instagram className="h-5 w-5" />;
      case "facebook": return <Facebook className="h-5 w-5" />;
      case "website": return <Globe className="h-5 w-5" />;
      case "email": return <Mail className="h-5 w-5" />;
      case "ads": return <Megaphone className="h-5 w-5" />;
      case "seo": return <BarChart className="h-5 w-5" />;
      default: return <BarChart className="h-5 w-5" />;
    }
  };

  return (
    <Card className="h-full border-none shadow-none">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-xl">Active Services</CardTitle>
        <CardDescription>Manage your subscribed services.</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {services.length === 0 ? (
           <div className="text-sm text-muted-foreground py-8 text-center border rounded-lg bg-muted/20">No active services.</div>
        ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map(svc => (
                 <div key={svc._id} className="relative group overflow-hidden rounded-xl border bg-card p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                       <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
                         svc.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                       }`}>
                          {getIcon(svc.serviceType)}
                       </div>
                       <Badge variant={svc.status === "active" ? "default" : "secondary"} className="capitalize">
                          {svc.status}
                       </Badge>
                    </div>
                    
                    <div className="space-y-1">
                       <div className="font-semibold text-lg leading-tight">{svc.title}</div>
                       <div className="text-sm text-muted-foreground capitalize">{svc.serviceType}</div>
                    </div>

                    {svc.clientCanToggle && (
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <form action={toggleAction}>
                             <input type="hidden" name="id" value={svc._id} />
                             <input type="hidden" name="enabled" value={svc.clientEnabled ? "off" : "on"} />
                             <Button variant={svc.clientEnabled ? "destructive" : "default"} size="sm" className="h-8 text-xs">
                               {svc.clientEnabled ? "Disable" : "Enable"}
                             </Button>
                          </form>
                      </div>
                    )}
                 </div>
              ))}
           </div>
        )}
      </CardContent>
    </Card>
  );
}
