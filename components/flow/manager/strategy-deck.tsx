"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import { NewStrategyDialog } from "./new-strategy-dialog";

interface Campaign {
  _id: string;
  title: string;
  status: string;
  client: {
    _id: string;
    name: string;
    email?: string;
    avatar?: any;
  };
  totalBriefs: number;
  activeBriefs: number;
  needsReview: number;
}

interface Client {
  _id: string;
  name: string;
  avatar?: any;
}

interface StrategyDeckProps {
  user: {
    name: string;
    email: string;
    id: string;
  };
  campaigns: Campaign[];
  clients: Client[];
}

export function StrategyDeck({ user, campaigns, clients }: StrategyDeckProps) {
  // Group campaigns by client
  const groupedCampaigns = campaigns.reduce((acc, campaign) => {
    const clientId = campaign.client._id;
    if (!acc[clientId]) {
      acc[clientId] = {
        client: campaign.client,
        campaigns: []
      };
    }
    acc[clientId].campaigns.push(campaign);
    return acc;
  }, {} as Record<string, { client: Campaign['client'], campaigns: Campaign[] }>);

  // Map clients to their campaigns, ensuring all clients are included
  const clientGroups = clients.map(client => ({
    client,
    campaigns: groupedCampaigns[client._id]?.campaigns || []
  })).sort((a, b) => a.client.name.localeCompare(b.client.name));

  return (
    <div className="container max-w-6xl mx-auto py-16 px-6">
      <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-display font-medium text-foreground mb-3 tracking-tight">
            The Deck
          </h1>
          <p className="text-muted-foreground text-lg font-sans max-w-md leading-relaxed font-normal">
            A high-level overview of active client campaigns and strategic pipelines.
          </p>
        </div>
        <div className="flex gap-3">
          <NewStrategyDialog clients={clients} managerId={user.id} />
        </div>
      </header>

      <div className="space-y-20">
        {clientGroups.map((group) => (
          <div key={group.client._id} className="relative">

            <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-slate-900 pb-6">
              <div className="flex items-center gap-6">
                {group.client.avatar ? (
                  <div className="relative w-14 h-14 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm transition-transform hover:scale-105 duration-300">
                    <Image
                      src={urlFor(group.client.avatar).width(120).url()}
                      alt={group.client.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 font-medium text-xl">
                    {group.client.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-3xl font-display font-medium text-foreground tracking-tight">
                    {group.client.name}
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em] mt-1">
                    {group.campaigns.length} Active {group.campaigns.length === 1 ? 'Campaign' : 'Campaigns'}
                  </p>
                </div>
              </div>

              {group.campaigns.length === 0 && (
                <NewStrategyDialog clients={clients} managerId={user.id} defaultClientId={group.client._id} />
              )}
            </div>

            {group.campaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.campaigns.map((campaign) => (
                  <CampaignCard key={campaign._id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50">
                <p className="text-slate-500 font-medium mb-4">No active strategies for this client.</p>
                <NewStrategyDialog clients={clients} managerId={user.id} defaultClientId={group.client._id} />
              </div>
            )}
          </div>
        ))}

        {clients.length === 0 && (
          <div className="col-span-full py-16 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
            <p className="text-slate-500 text-lg mb-2">No clients assigned.</p>
            <p className="text-slate-400 text-sm">Contact an administrator to get clients assigned to your account.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const hasReviewItems = campaign.needsReview > 0;

  return (
    <Link href={`/flow/manager/${campaign._id}`} className="block group">
      <Card className={cn(
        "h-full transition-all duration-500 hover:shadow-2xl hover:translate-y-[-4px] border-border bg-card shadow-sm overflow-hidden",
        hasReviewItems && "border-slate-900 dark:border-slate-100 border-opacity-20"
      )}>
        <CardHeader className="p-8 pb-4">
          <div className="flex justify-between items-start">
            <div className="space-y-4 w-full">
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground block">
                {hasReviewItems ? "Attention Required" : "Campaign"}
              </span>
              <h3 className="text-3xl font-display text-foreground leading-tight tracking-tight group-hover:underline underline-offset-8 decoration-slate-200 transition-all">
                {campaign.title}
              </h3>
            </div>
            {hasReviewItems && (
              <div className="w-2 h-2 rounded-full bg-slate-900 dark:bg-slate-100 animate-pulse mt-1" />
            )}
          </div>
        </CardHeader>
        <CardContent className="px-8 py-6">
          <div className="flex gap-10">
            <div className="flex flex-col">
              <span className="text-4xl font-display font-medium text-foreground">
                {campaign.activeBriefs}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">Active</span>
            </div>
            <div className="flex flex-col">
              <span className="text-4xl font-display font-medium text-slate-300 dark:text-slate-700">
                {campaign.totalBriefs}
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">Total</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="px-8 pb-8 pt-0 mt-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <div className="flex items-center text-xs font-medium text-foreground tracking-wide font-sans">
            <span>View Strategy Pipeline</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
