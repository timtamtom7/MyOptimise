"use server";

import { deepseek } from "@/lib/ai";
import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";

export async function generateResearch(
  prompt: string,
  context: {
    clientName: string;
    industry?: string;
    serviceScope?: string;
    recentCampaigns?: string[];
    additionalContext?: any;
  }
) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) throw new Error("Unauthorized");

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct) throw new Error("Unauthorized");
  
  // Allow admins, managers, and strategists (if role exists)
  if (acct.type !== "admin" && acct.type !== "manager") {
    throw new Error("Insufficient permissions");
  }

  const systemPrompt = `You are an expert digital marketing strategist acting as a copilot for a high-end agency. 
Your goal is to provide actionable, creative, and data-backed research or ideas for the client.
Client: ${context.clientName}
Industry: ${context.industry || "General"}
Service Scope: ${context.serviceScope || "Not defined"}
Recent Campaigns: ${context.recentCampaigns?.join(", ") || "None"}
${context.additionalContext ? `\nAdditional Context:\n${JSON.stringify(context.additionalContext, null, 2)}` : ""}

Focus on high-impact strategies, unique angles, and specific deliverables.
If Reference Material is provided in the context, strictly base your insights on it where relevant, and cite the source URL when using specific facts or data.
If you use general knowledge, state it as such.`;

  try {
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat", // Use deepseek-chat or deepseek-reasoner
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    return {
      success: true,
      content: response.choices[0].message.content,
    };
  } catch (error) {
    console.error("DeepSeek API Error:", error);
    return {
      success: false,
      error: "Failed to generate research. Please try again.",
    };
  }
}
