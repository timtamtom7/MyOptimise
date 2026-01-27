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
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <header className="mb-12 flex items-end justify-between">
        <div>
            <h1 className="text-4xl font-display font-medium text-slate-900 dark:text-slate-50 mb-2">
            Strategy Deck
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-sans">
            Manage your active campaigns and reviews.
            </p>
        </div>
        <div className="flex gap-3">
             <NewStrategyDialog clients={clients} managerId={user.id} />
        </div>
      </header>

      <div className="space-y-12">
        {clientGroups.map((group) => (
          <div key={group.client._id} className="relative p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 shadow-sm">
            
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-4">
                  {group.client.avatar ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                      <Image 
                        src={urlFor(group.client.avatar).width(100).url()} 
                        alt={group.client.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-500 font-bold text-xl shadow-sm">
                      {group.client.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-display text-slate-900 dark:text-slate-100">
                      {group.client.name}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
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
        "h-full transition-all duration-300 hover:shadow-lg border-slate-200 dark:border-slate-800",
        hasReviewItems ? "ring-1 ring-amber-500/20 bg-amber-50/10" : "bg-white dark:bg-slate-900"
      )}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Campaign</p>
              <h3 className="text-xl font-display text-slate-900 dark:text-slate-50 group-hover:text-blue-600 transition-colors">
                 {campaign.title}
              </h3>
            </div>
            {hasReviewItems && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none">
                    {campaign.needsReview} to Review
                </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 py-2">
             <div className="flex flex-col">
                <span className="text-2xl font-display text-slate-900 dark:text-slate-50">
                    {campaign.activeBriefs}
                </span>
                <span className="text-xs text-slate-500">Active Briefs</span>
             </div>
             <div className="flex flex-col">
                <span className="text-2xl font-display text-slate-900 dark:text-slate-50">
                    {campaign.totalBriefs}
                </span>
                <span className="text-xs text-slate-500">Total Created</span>
             </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2 pb-6 border-t border-slate-100 dark:border-slate-800 mt-2">
            <div className="flex items-center text-sm font-medium text-slate-600 group-hover:text-blue-600 transition-colors w-full justify-between">
                <span>Open Deck</span>
                <ArrowRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
