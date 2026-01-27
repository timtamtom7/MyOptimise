"use server";

import { sanityFetch } from "@/sanity/lib/live";
import { groq } from "next-sanity";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface Insight {
  id: string;
  type: "risk" | "opportunity" | "neutral";
  category: "stuck_brief" | "quiet_client" | "workload" | "other";
  title: string;
  description: string;
  entityId?: string;
  entityType?: "brief" | "client";
  severity: "high" | "medium" | "low";
  actionLabel?: string;
  actionUrl?: string;
}

export interface InsightsResult {
  insights: Insight[];
  aiSummary?: string;
}

export async function generateAdminInsights(): Promise<InsightsResult> {
  const insights: Insight[] = [];

  // 1. Detect Stuck Briefs
  // Logic: Briefs in 'client_review' or 'in_review' that haven't been updated in > 5 days
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const { data: stuckBriefs } = await supabaseAdmin
    .from("briefs")
    .select("id, title, status, updated_at, assignee_id")
    .in("status", ["client_review", "in_review"])
    .lt("updated_at", fiveDaysAgo.toISOString());

  if (stuckBriefs && stuckBriefs.length > 0) {
    stuckBriefs.forEach((brief) => {
      const daysStuck = Math.floor(
        (new Date().getTime() - new Date(brief.updated_at).getTime()) /
          (1000 * 3600 * 24)
      );
      
      insights.push({
        id: `stuck-brief-${brief.id}`,
        type: "risk",
        category: "stuck_brief",
        title: `Brief Stuck in ${brief.status === 'client_review' ? 'Client Review' : 'Review'}`,
        description: `"${brief.title}" has been stagnant for ${daysStuck} days.`,
        entityId: brief.id,
        entityType: "brief",
        severity: daysStuck > 10 ? "high" : "medium",
        actionLabel: "View Brief",
        actionUrl: `/dashboard/business/briefs?id=${brief.id}`, // Placeholder URL logic
      });
    });
  }

  // 2. Detect Quiet Clients
  // Logic: Clients with NO requests in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

  // Fetch all active clients
  const allClientsQuery = groq`*[_type == "account" && type == "client" && status == "active"] {
    _id,
    businessName,
    email
  }`;

  // Fetch clients with recent activity
  const activeClientIdsQuery = groq`array::unique(
    *[_type in ["clientRequest", "serviceRequest"] && createdAt > $thirtyDaysAgo].clientAccount._ref
  )`;

  const [allClients, activeClientIds] = await Promise.all([
    sanityFetch({ query: allClientsQuery }),
    sanityFetch({ query: activeClientIdsQuery, params: { thirtyDaysAgo: thirtyDaysAgoIso } }),
  ]);

  const activeClientIdSet = new Set(activeClientIds.data);

  const quietClients = allClients.data.filter(
    (client: any) => !activeClientIdSet.has(client._id)
  );

  quietClients.forEach((client: any) => {
    insights.push({
      id: `quiet-client-${client._id}`,
      type: "risk",
      category: "quiet_client",
      title: "Quiet Client Risk",
      description: `${client.businessName || client.email} hasn't made a request in over 30 days.`,
      entityId: client._id,
      entityType: "client",
      severity: "medium",
      actionLabel: "View Client",
      actionUrl: `/dashboard/business/${client._id}`,
    });
  });

  // 3. AI Analysis (DeepSeek)
  let aiSummary = undefined;
  if (process.env.DEEPSEEK_API_KEY && insights.length > 0) {
    try {
      const prompt = `
        You are an operations manager for a creative agency. 
        Analyze the following risks and provide a 2-sentence summary and 1 key recommendation.
        
        Risks:
        ${JSON.stringify(insights.map(i => ({ title: i.title, desc: i.description, severity: i.severity })))}
      `;

      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 150,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        aiSummary = data.choices[0]?.message?.content;
      }
    } catch (error) {
      console.error("DeepSeek API failed:", error);
      // Fail silently for AI summary, show raw insights
    }
  }

  // Sort by severity (High first)
  const severityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return { insights, aiSummary };
}
