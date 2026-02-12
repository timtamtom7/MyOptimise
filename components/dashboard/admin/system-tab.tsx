"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2, Activity, Server, Database, AlertTriangle, CheckCircle2, Cpu, Globe } from "lucide-react";

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
      <Card className="rounded-[3rem]">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">You do not have permission to manage system settings.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* System Health Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
            <div className="p-6 flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                    <Activity className="h-7 w-7" />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">System Status</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">Operational</h3>
                </div>
            </div>
            <div className="bg-green-500/10 h-1.5 w-full">
                <div className="bg-green-500 h-full w-full animate-pulse" />
            </div>
        </Card>
        
        <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
            <div className="p-6 flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <Globe className="h-7 w-7" />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">API Uptime</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">99.98%</h3>
                </div>
            </div>
            <div className="bg-blue-500/10 h-1.5 w-full">
                <div className="bg-blue-500 h-full w-[99%]" />
            </div>
        </Card>

        <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
            <div className="p-6 flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                    <Database className="h-7 w-7" />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Database</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">Connected</h3>
                </div>
            </div>
            <div className="bg-purple-500/10 h-1.5 w-full">
                <div className="bg-purple-500 h-full w-full" />
            </div>
        </Card>

        <Card className="rounded-[2.5rem] border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden">
            <div className="p-6 flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                    <Cpu className="h-7 w-7" />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Latency</p>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">24ms</h3>
                </div>
            </div>
            <div className="bg-orange-500/10 h-1.5 w-full">
                <div className="bg-orange-500 h-full w-[20%]" />
            </div>
        </Card>
      </div>

      <Card className="rounded-[3rem] border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <CardHeader className="p-10 pb-0">
          <CardTitle className="text-3xl font-black">Feature Flags</CardTitle>
          <CardDescription className="text-lg">Manage system-wide feature flags and toggles.</CardDescription>
        </CardHeader>
        <CardContent className="p-10 space-y-10">
          {/* Create New Flag */}
          <form action={actions.upsertFeatureFlag} className="rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Server className="h-4 w-4" />
                </div>
                Add Feature Flag
            </h3>
            <div className="flex flex-col xl:flex-row gap-6 items-end">
              <div className="grid gap-3 flex-1 w-full">
                <Label htmlFor="key" className="text-base font-bold ml-2">Key</Label>
                <Input name="key" id="key" placeholder="feature.name" required className="h-14 rounded-2xl bg-white dark:bg-slate-950 px-6 text-lg" />
              </div>
              <div className="grid gap-3 flex-[2] w-full">
                <Label htmlFor="description" className="text-base font-bold ml-2">Description</Label>
                <Input name="description" id="description" placeholder="Description of what this flag controls" className="h-14 rounded-2xl bg-white dark:bg-slate-950 px-6 text-lg" />
              </div>
              <div className="flex items-center gap-4 pb-3 px-2">
                <Switch name="enabled" id="enabled" />
                <Label htmlFor="enabled" className="text-base font-bold">Enabled</Label>
              </div>
              <Button type="submit" className="h-14 rounded-full px-8 text-lg font-bold w-full xl:w-auto">Add Flag</Button>
            </div>
          </form>

          {/* List Flags */}
          <div className="space-y-4">
            {featureFlags.map((flag) => (
              <div key={flag._id} className="flex flex-col md:flex-row items-center justify-between p-6 border border-slate-200 dark:border-slate-800 rounded-[2rem] gap-6 hover:shadow-lg transition-all bg-white dark:bg-slate-900/50">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-lg font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">{flag.key}</span>
                    <Badge variant={flag.enabled ? "default" : "secondary"} className="h-8 px-4 rounded-full text-sm font-bold">
                      {flag.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="text-base text-muted-foreground ml-1">
                    {flag.description || "No description"}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                   <form action={actions.upsertFeatureFlag} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={flag._id} />
                      <input type="hidden" name="key" value={flag.key} />
                      <input type="hidden" name="description" value={flag.description} />
                      <input type="hidden" name="enabled" value={flag.enabled ? "off" : "on"} /> 
                      <Button variant="outline" size="sm" className="h-12 rounded-2xl px-6 font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800">
                        {flag.enabled ? 'Disable' : 'Enable'}
                      </Button>
                   </form>

                  <form action={actions.deleteFeatureFlag}>
                    <input type="hidden" name="id" value={flag._id} />
                    <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </form>
                </div>
              </div>
            ))}
            {featureFlags.length === 0 && (
              <div className="text-center py-12 text-muted-foreground bg-slate-50 dark:bg-slate-900/50 rounded-[2rem]">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium">No feature flags defined.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
