"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

interface SystemTabProps {
  featureFlags: any[];
  capabilities: {
    canManageFeatureFlags: boolean;
  };
  actions: {
    upsertFeatureFlag: (formData: FormData) => Promise<void>;
    deleteFeatureFlag: (formData: FormData) => Promise<void>;
  };
}

export function SystemTab({ featureFlags, capabilities, actions }: SystemTabProps) {
  if (!capabilities.canManageFeatureFlags) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">You do not have permission to manage system settings.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Manage system-wide feature flags and toggles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create New Flag */}
          <form action={actions.upsertFeatureFlag} className="rounded-lg border p-4 bg-muted/50">
            <h3 className="text-sm font-medium mb-3">Add Feature Flag</h3>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="grid gap-2 flex-1">
                <Label htmlFor="key">Key</Label>
                <Input name="key" id="key" placeholder="feature.name" required />
              </div>
              <div className="grid gap-2 flex-[2]">
                <Label htmlFor="description">Description</Label>
                <Input name="description" id="description" placeholder="Description of what this flag controls" />
              </div>
              <div className="flex items-center gap-2 pb-2">
                <Switch name="enabled" id="enabled" />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
              <Button type="submit">Add Flag</Button>
            </div>
          </form>

          {/* List Flags */}
          <div className="space-y-4">
            {featureFlags.map((flag) => (
              <div key={flag._id} className="flex flex-col md:flex-row items-center justify-between p-4 border rounded-lg gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{flag.key}</span>
                    <Badge variant={flag.enabled ? "default" : "secondary"}>
                      {flag.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {flag.description || "No description"}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <form action={actions.upsertFeatureFlag} className="flex items-center gap-4">
                    <input type="hidden" name="id" value={flag._id} />
                    <input type="hidden" name="key" value={flag.key} />
                    <input type="hidden" name="description" value={flag.description} />
                    <div className="flex items-center gap-2">
                      <Switch 
                        name="enabled" 
                        defaultChecked={flag.enabled} 
                        onCheckedChange={(checked) => {
                          const form = document.getElementById(`update-flag-${flag._id}`) as HTMLFormElement;
                          if (form) form.requestSubmit();
                        }}
                      />
                      <input 
                        type="checkbox" 
                        name="enabled" 
                        checked={flag.enabled} 
                        className="hidden" 
                        readOnly 
                      />
                    </div>
                    {/* We need a separate submit button if we want to change description, but for now just toggle */}
                  </form>
                   
                   {/* Actually, let's make the update explicit */}
                   <form action={actions.upsertFeatureFlag} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={flag._id} />
                      <input type="hidden" name="key" value={flag.key} />
                      <input type="hidden" name="description" value={flag.description} />
                      <input type="hidden" name="enabled" value={flag.enabled ? "off" : "on"} /> 
                      <Button variant="outline" size="sm">
                        Toggle
                      </Button>
                   </form>

                  <form action={actions.deleteFeatureFlag}>
                    <input type="hidden" name="id" value={flag._id} />
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            ))}
            {featureFlags.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">No feature flags defined.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
