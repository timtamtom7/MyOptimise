"use server";

import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com"
});

export async function generateDeliverablePlan(context: any) {
  const session = await safeGetServerSession();
  if (!session) return { error: "Unauthorized" };

  const { strategy, research, competitors, moodboard, clientAssets } = context;

  // Intelligent Check: Is there enough info?
  if ((!strategy || strategy.length < 50) && (!research || research.length === 0)) {
    return { 
      error: "INSUFFICIENT_DATA", 
      message: "I need more information to generate a solid plan. Please add more details to the Strategy Context or conduct some AI Research first." 
    };
  }

  // Format assets for AI context
  const assetsContext = clientAssets?.map((a: any, i: number) => 
    `- Asset ID ${i}: ${a.title} (${a.type}) - Tags: ${a.tags?.join(", ") || "none"}`
  ).join("\n") || "No brand assets available.";

  const prompt = `
    You are an expert Creative Strategist. Based on the following campaign context, propose a concrete list of deliverables (content pieces).
    
    CONTEXT:
    - Target Audience: ${context.targetAudience || "Not specified"}
    - Tone of Voice: ${context.toneOfVoice || "Not specified"}
    - Strategic Pillars: ${context.strategicPillars || "Not specified"}
    - Research Insights: ${JSON.stringify(research || [])}
    - Competitor Info: ${JSON.stringify(competitors || [])}
    - Available Brand Assets:
${assetsContext}

    TASK:
    Generate a JSON array of 3-5 high-impact deliverables.
    Each item must have:
    - title: Catchy title
    - type: "video" | "image" | "carousel" | "story"
    - platform: "instagram" | "tiktok" | "linkedin" | "youtube"
    - description: A specific brief description of the content concept.
    - visualDirection: Brief visual style direction (e.g. "Fast paced, text overlay, upbeat music").
    - hook: A compelling hook or opening line (especially for video/text).
    - script: A rough outline or script for the content.
    - caption: A suggested social media caption.
    - hashtags: A list of 5-10 relevant hashtags.
    - suggestedAssetIndices: An array of Asset IDs (integers) from the "Available Brand Assets" list that should be used in this deliverable.

    Return ONLY the raw JSON array. No markdown, no conversational text.
  `;

  if (!process.env.DEEPSEEK_API_KEY) {
    console.error("DeepSeek API Key missing");
    return { error: "API Key Configuration Error. Please check server logs." };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a creative strategist helper that outputs strict JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    // Clean up markdown if present
    const cleanContent = content?.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const deliverables = JSON.parse(cleanContent || "[]");
    return { success: true, deliverables };
  } catch (error: any) {
    console.error("AI Plan Gen Error:", error);
    return { 
      error: "Failed to generate plan.", 
      message: error.message || "Unknown error occurred"
    };
  }
}

export async function generateContextSuggestions(clientName: string, industry: string, currentContext?: any) {
    const session = await safeGetServerSession();
    if (!session) return { error: "Unauthorized" };
  
    if (!process.env.DEEPSEEK_API_KEY) {
      return { error: "API Key missing" };
    }

    // "Learning": Fetch recent approved strategies to use as style examples
    let examples = [];
    try {
        examples = await client.fetch(`*[_type == "campaign" && strategyDeck.status == "approved" && defined(strategyDeck.targetAudience)][0..2]{
            strategyDeck {
                targetAudience,
                toneOfVoice,
                strategicPillars
            }
        }`);
    } catch (e) {
        console.warn("Failed to fetch examples for AI context", e);
    }

    const examplesText = examples.length > 0 ? 
        `Here are examples of high-quality approved strategies from our agency. Use the same professional tone and depth:\n${examples.map((e: any) => JSON.stringify(e.strategyDeck)).join("\n")}` 
        : "";
  
    const prompt = `
      Client: ${clientName}
      Industry: ${industry}
      ${currentContext ? `Current Draft Context (Refine or provide alternatives to this): ${JSON.stringify(currentContext)}` : ""}

      ${examplesText}
  
      Generate suggested strategic components. Provide multiple options for the user to choose from:
      1. Target Audience: Provide 3 distinct options (1 short sentence each).
      2. Tone of Voice: Provide 3 distinct options (2 adjectives each).
      3. Strategic Pillars: Provide 3 distinct pillars (short phrases).
  
      Return JSON: { 
        "targetAudience": "The best single option...", 
        "targetAudienceOptions": ["Option 1...", "Option 2...", "Option 3..."],
        "toneOfVoice": "The best single option...",
        "toneOfVoiceOptions": ["Option 1...", "Option 2...", "Option 3..."],
        "pillars": ["...", "...", "..."] 
      }
    `;
  
    try {
      const response = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a senior creative strategist at a luxury agency. Output strict JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
      });
  
      const content = response.choices[0].message.content;
      const cleanContent = content?.replace(/```json/g, "").replace(/```/g, "").trim();
      const suggestions = JSON.parse(cleanContent || "{}");
      return { success: true, suggestions };
    } catch (error) {
      console.error("AI Suggestion Error:", error);
      return { error: "Failed" };
    }
}

export async function createCampaign(data: { title: string, clientId: string, managerId: string, description?: string }) {
  const session = await safeGetServerSession();
  if (!session) return { error: "Unauthorized" };

  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) {
      console.error("Missing SANITY_API_WRITE_TOKEN");
      return { error: "Server Configuration Error" };
  }
  
  const writeClient = client.withConfig({ token });

  try {
    const doc = await writeClient.create({
      _type: "campaign",
      title: data.title,
      client: { _type: "reference", _ref: data.clientId },
      manager: { _type: "reference", _ref: data.managerId },
      description: data.description,
      status: "planned",
      startDate: new Date().toISOString(),
      strategyDeck: { slides: [] } // Initialize empty deck
    });
    
    revalidatePath("/flow/manager");
    return { success: true, campaignId: doc._id };
  } catch (error) {
    console.error("Create Campaign Error:", error);
    return { error: "Failed to create campaign" };
  }
}

export async function updateCampaignStrategy(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return { error: "Unauthorized" };

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || (acct.type !== "admin" && acct.type !== "manager" && acct.type !== "strategist")) {
    return { error: "Unauthorized" };
  }

  const campaignId = String(formData.get("campaignId") || "");
  const strategy = String(formData.get("strategy") || "");

  if (!campaignId) return { error: "Missing campaign ID" };

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return { error: "Configuration Error" };
  const writeClient = client.withConfig({ token: writeToken });

  await writeClient
    .patch(campaignId)
    .set({ strategy, updatedAt: new Date().toISOString() })
    .commit();

  revalidatePath(`/flow/manager/${campaignId}`);
  return { success: true };
}

export async function updateCampaignDeck(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return { error: "Unauthorized" };

    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || (acct.type !== "admin" && acct.type !== "manager")) {
        return { error: "Unauthorized" };
    }

    const campaignId = String(formData.get("campaignId") || "");
    const deckJson = String(formData.get("deck") || "{}");
    
    if (!campaignId) return { error: "Missing ID" };

    const deck = JSON.parse(deckJson);

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    const writeClient = client.withConfig({ token: writeToken });

    // Normalize deck data for Sanity
    const sanityDeck = {
        status: deck.status || "drafting",
        slides: deck.slides?.map((s: any) => ({
            _key: s._key || crypto.randomUUID(),
            title: s.title,
            layout: s.layout || "text",
            content: s.content || "",
            notes: s.notes || "",
            image: s.imageAssetId ? { _type: "image", asset: { _ref: s.imageAssetId } } : undefined,
            comments: s.comments || [],
            galleryImages: s.galleryImages?.map((g: any) => ({
                _key: g._key || crypto.randomUUID(),
                url: g.url,
                assetId: g.assetId
            }))
        })) || [],
        competitors: deck.competitors?.map((c: any) => ({
            _key: c._key || crypto.randomUUID(),
            name: c.name,
            url: c.url,
            notes: c.notes,
            feed: c.feed?.map((f: any) => ({
                _key: f._key || crypto.randomUUID(),
                title: f.title,
                url: f.url,
                date: f.date,
                source: f.source
            })) || []
        })) || [],
        moodboard: deck.moodboard?.map((m: any) => ({
            _key: m._key || crypto.randomUUID(),
            url: m.url || "",
            note: m.note || "",
            image: m.imageAssetId ? { _type: "image", asset: { _ref: m.imageAssetId } } : undefined
        })) || [],
        proposedDeliverables: deck.proposedDeliverables?.map((d: any) => ({
            _key: d._key || crypto.randomUUID(),
            title: d.title,
            type: d.type,
            platform: d.platform,
            description: d.description || "",
            visualDirection: d.visualDirection || "",
            assets: d.assets?.map((a: any) => {
                 if (a.assetId) {
                     return {
                         _type: "image",
                         _key: a._key || crypto.randomUUID(),
                         asset: { _type: "reference", _ref: a.assetId }
                     };
                 }
                 return null;
            }).filter(Boolean),
            references: d.references || [],
            prediction: d.prediction ? {
                score: d.prediction.score,
                advice: d.prediction.advice || []
            } : undefined
        })) || [],
        strategicPillars: deck.strategicPillars || [],
        targetAudience: deck.targetAudience || "",
        toneOfVoice: deck.toneOfVoice || "",
        updatedAt: new Date().toISOString()
    };

    await writeClient
        .patch(campaignId)
        .set({ strategyDeck: sanityDeck })
        .commit();

    revalidatePath(`/flow/manager/${campaignId}`);
    return { success: true };
}

export async function updateClientContext(formData: FormData) {
  const session = await safeGetServerSession();
  if (!session) return { error: "Unauthorized" };

  const clientId = String(formData.get("clientId") || "");
  const industry = String(formData.get("industry") || "");
  const audience = String(formData.get("audience") || "");
  const creativeGoal = String(formData.get("creativeGoal") || "");
  const brandVoice = String(formData.get("brandVoice") || "");

  if (!clientId) return { error: "Missing Client ID" };

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  const writeClient = client.withConfig({ token: writeToken });

  try {
    await writeClient.patch(clientId).set({
      industry,
      audience,
      creativeGoal,
      brandVoice
    }).commit();
    
    revalidatePath("/flow/manager");
    return { success: true };
  } catch (error) {
    console.error("Update Client Context Error:", error);
    return { error: "Failed to update context" };
  }
}

export async function submitStrategy(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return { error: "Unauthorized" };

  const campaignId = String(formData.get("campaignId") || "");
  if (!campaignId) return { error: "Missing campaign ID" };

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  const writeClient = client.withConfig({ token: writeToken });

  await writeClient
    .patch(campaignId)
    .set({ "strategyDeck.status": "internal_review" })
    .commit();

  revalidatePath(`/flow/manager/${campaignId}`);
  return { success: true };
}

export async function approveStrategy(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return { error: "Unauthorized" };

    const campaignId = String(formData.get("campaignId") || "");
    if (!campaignId) return { error: "Missing campaign ID" };

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    const writeClient = client.withConfig({ token: writeToken });

    // Fetch account for createdBy reference
    const acct = await fetchSanityAccountByEmail({ email });

    // 1. Fetch current campaign to get proposed deliverables and manager
    const campaign = await client.fetch(`*[_type == "campaign" && _id == $id][0]{
        strategyDeck {
            proposedDeliverables
        },
        deliverablesGenerated,
        manager
    }`, { id: campaignId });

    if (!campaign) return { error: "Campaign not found" };

    const proposedDeliverables = campaign.strategyDeck?.proposedDeliverables || [];
    const campaignManager = campaign.manager;

    // 2. Start transaction
    const transaction = writeClient.transaction();

    // 3. Update campaign status and set flag
    transaction.patch(campaignId, (p) => p
        .set({ "strategyDeck.status": "approved" })
        .set({ deliverablesGenerated: true })
    );

    // 4. Create deliverables and work items from plan (only if not already generated)
    const alreadyGenerated = campaign.deliverablesGenerated === true;

    if (!alreadyGenerated && proposedDeliverables.length > 0) {
        proposedDeliverables.forEach((item: any) => {
            const deliverableId = crypto.randomUUID();
            const deliverableDoc: any = {
                _id: deliverableId,
                _type: "deliverable",
                title: item.title,
                campaign: { _type: "reference", _ref: campaignId },
                type: item.type,
                platform: item.platform,
                description: item.description,
                visualDirection: item.visualDirection,
                assets: item.assets,
                references: item.references,
                difficulty: "medium",
                status: "drafting",
                createdAt: new Date().toISOString(),
            };
            
            if (acct) {
                deliverableDoc.createdBy = { _type: "reference", _ref: acct._id };
            }

            // Create Deliverable
            transaction.create(deliverableDoc);

            // Create Work Item (Task) for the deliverable
            const workItemDoc: any = {
                _type: "workItem",
                title: `Create: ${item.title}`,
                description: item.description || `Production task for ${item.title}`,
                status: "todo",
                priority: "medium",
                visibility: "internal",
                relatedCampaign: { _type: "reference", _ref: campaignId },
                relatedDeliverable: { _type: "reference", _ref: deliverableId },
                createdAt: new Date().toISOString(),
                checklist: [
                    { item: "Review visual direction", completed: false, _key: crypto.randomUUID() },
                    { item: "Create asset", completed: false, _key: crypto.randomUUID() },
                    { item: "Upload draft", completed: false, _key: crypto.randomUUID() }
                ]
            };

            // Assign to Campaign Manager if available, otherwise fallback to Admin/Creator
            if (campaignManager) {
                workItemDoc.assignedTo = { _type: "reference", _ref: campaignManager._ref };
            } else if (acct) {
                 workItemDoc.assignedTo = { _type: "reference", _ref: acct._id };
            }

            if (acct) {
                workItemDoc.createdBy = { _type: "reference", _ref: acct._id };
            }

            transaction.create(workItemDoc);
        });
    }

    await transaction.commit();

    revalidatePath(`/flow/manager/${campaignId}`);
    revalidatePath("/flow/client");
    return { success: true };
}

export async function rejectStrategy(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return { error: "Unauthorized" };

    const campaignId = String(formData.get("campaignId") || "");
    const reason = String(formData.get("reason") || "");
    
    if (!campaignId) return { error: "Missing campaign ID" };

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    const writeClient = client.withConfig({ token: writeToken });

    await writeClient
        .patch(campaignId)
        .set({ 
            "strategyDeck.status": "changes_requested",
            "strategyDeck.rejectionReason": reason
        })
        .commit();

    revalidatePath(`/flow/manager/${campaignId}`);
    return { success: true };
}

export async function addStrategySlideComment(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return { error: "Unauthorized" };

    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct) return { error: "Unauthorized" };

    const campaignId = String(formData.get("campaignId") || "");
    const slideKey = String(formData.get("slideKey") || "");
    const commentText = String(formData.get("comment") || "").trim();

    if (!campaignId || !slideKey || !commentText) return { error: "Missing required fields" };

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    const writeClient = client.withConfig({ token: writeToken });

    const comment = {
        _key: crypto.randomUUID(),
        text: commentText,
        author: acct.name || email,
        date: new Date().toISOString(),
        resolved: false
    };

    // Use JSONPath to target the specific slide in the array by its key
    // strategyDeck.slides[_key == "key"].comments
    // Note: Sanity patch 'insert' works on arrays. We need to append to the comments array of the found slide.
    // This is complex with standard patch. 
    // Easier approach: Get the doc, find index, patch index? No, race conditions.
    // Robust approach: Use `insert` with path.
    // But `insert` appends to an array. We need to target `strategyDeck.slides[key].comments`.
    // Sanity supports deep patching with keyed arrays in paths like `strategyDeck.slides[_key=="abc"].comments`.
    
    // First ensure the comments array exists
    await writeClient
        .patch(campaignId)
        .setIfMissing({ [`strategyDeck.slides[_key=="${slideKey}"].comments`]: [] })
        .append(`strategyDeck.slides[_key=="${slideKey}"].comments`, [comment])
        .commit();

    revalidatePath(`/flow/manager/${campaignId}`);
    return { success: true, comment };
}

export async function saveStrategyVersion(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return { error: "Unauthorized" };

    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct) return { error: "Unauthorized" };

    const campaignId = String(formData.get("campaignId") || "");
    const description = String(formData.get("description") || "Manual Save");
    
    if (!campaignId) return { error: "Missing campaign ID" };

    const campaign = await client.fetch(`*[_type == "campaign" && _id == $id][0]{strategyDeck}`, { id: campaignId });
    if (!campaign || !campaign.strategyDeck) return { error: "Campaign not found" };

    // Create snapshot (remove history itself to avoid recursion if we were storing the whole object, but history is inside strategyDeck, so we should exclude it or just store the slides/config)
    // Actually, let's store the 'content' parts: slides, moodboard, pillars, etc.
    // Basically copy strategyDeck but exclude 'history'.
    const { history, ...snapshotData } = campaign.strategyDeck;
    const snapshot = JSON.stringify(snapshotData);

    const version = {
        _key: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        author: acct.name || email,
        snapshot,
        description
    };

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    const writeClient = client.withConfig({ token: writeToken });

    await writeClient
        .patch(campaignId)
        .setIfMissing({ "strategyDeck.history": [] })
        .prepend("strategyDeck.history", [version])
        .commit();

    revalidatePath(`/dashboard/manager/strategy/${campaignId}`);
    return { success: true };
}

export async function restoreStrategyVersion(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return { error: "Unauthorized" };

    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || (acct.type !== "admin" && acct.type !== "manager")) {
        return { error: "Unauthorized" };
    }

    const campaignId = String(formData.get("campaignId") || "");
    const versionKey = String(formData.get("versionKey") || "");
    
    if (!campaignId || !versionKey) return { error: "Missing required fields" };

    const campaign = await client.fetch(`*[_type == "campaign" && _id == $id][0]{strategyDeck}`, { id: campaignId });
    if (!campaign || !campaign.strategyDeck?.history) return { error: "Version not found" };

    const version = campaign.strategyDeck.history.find((v: any) => v._key === versionKey);
    if (!version) return { error: "Version not found" };

    const snapshotData = JSON.parse(version.snapshot);

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    const writeClient = client.withConfig({ token: writeToken });

    // We want to restore the data but KEEP the history.
    // So we update strategyDeck fields with snapshotData, but preserve 'history'.
    // The easiest way is to patch the strategyDeck object, but that might overwrite history if we are not careful.
    // However, since history is a field inside strategyDeck, and snapshotData does NOT contain history (we excluded it),
    // if we just set strategyDeck = snapshotData, we lose history!
    
    // So we need to set individual fields or merge.
    // Better: set strategyDeck to snapshotData + current history.
    
    const newStrategyDeck = {
        ...snapshotData,
        history: campaign.strategyDeck.history,
        updatedAt: new Date().toISOString()
    };

    await writeClient
        .patch(campaignId)
        .set({ strategyDeck: newStrategyDeck })
        .commit();

    revalidatePath(`/dashboard/manager/strategy/${campaignId}`);
    return { success: true };
}

export async function resolveStrategySlideComment(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return { error: "Unauthorized" };

    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || (acct.type !== "admin" && acct.type !== "manager")) return { error: "Unauthorized" };

    const campaignId = String(formData.get("campaignId") || "");
    const slideKey = String(formData.get("slideKey") || "");
    const commentKey = String(formData.get("commentKey") || "");

    if (!campaignId || !slideKey || !commentKey) return { error: "Missing required fields" };

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    const writeClient = client.withConfig({ token: writeToken });

    // Target the specific comment to update its resolved status
    // Path: strategyDeck.slides[_key==slideKey].comments[_key==commentKey]
    
    // We can't do double nested array filter in one path easily in all Sanity versions, 
    // but deep patching with array filters is supported.
    // However, targeting a nested array item for update can be tricky.
    // strategyDeck.slides[_key=="x"].comments[_key=="y"] might work.
    
    // Alternative: Pull the slide, find the comment index, patch that index. 
    // But that's race-condition prone.
    
    // Let's try the deep path.
    const path = `strategyDeck.slides[_key=="${slideKey}"].comments[_key=="${commentKey}"].resolved`;

    try {
        await writeClient
            .patch(campaignId)
            .set({ [path]: true })
            .commit();
            
        revalidatePath(`/flow/manager/${campaignId}`);
        return { success: true };
    } catch (e) {
        console.error("Resolve comment error", e);
        return { error: "Failed to resolve comment" };
    }
}

export async function uploadMoodboardImage(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return { error: "Unauthorized" };

    const file = formData.get("file") as File;
    if (!file) return { error: "No file provided" };

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    const writeClient = client.withConfig({ token: writeToken });

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const asset = await writeClient.assets.upload("image", buffer, {
            filename: file.name
        });

        return { success: true, url: asset.url, assetId: asset._id };
    } catch (error) {
        console.error("Upload error:", error);
        return { error: "Upload failed" };
    }
}

export async function updateCampaignStatus(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return { error: "Unauthorized" };

    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || (acct.type !== "admin" && acct.type !== "manager")) return { error: "Unauthorized" };

    const campaignId = String(formData.get("campaignId") || "");
    const status = String(formData.get("status") || "");

    if (!campaignId || !status) return { error: "Missing required fields" };

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    const writeClient = client.withConfig({ token: writeToken });

    try {
        await writeClient
            .patch(campaignId)
            .set({ "strategyDeck.status": status })
            .commit();

        revalidatePath(`/dashboard/manager/strategy/${campaignId}`);
        return { success: true };
    } catch (e) {
        console.error("Update status error", e);
        return { error: "Failed to update status" };
    }
}

export async function generateCampaignApproval(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return { error: "Unauthorized" };

    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || (acct.type !== "admin" && acct.type !== "manager")) return { error: "Unauthorized" };

    const campaignId = String(formData.get("campaignId") || "");
    if (!campaignId) return { error: "Missing campaign ID" };

    const token = crypto.randomUUID();
    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    const writeClient = client.withConfig({ token: writeToken });

    try {
        await writeClient
            .patch(campaignId)
            .set({ approvalToken: token })
            .commit();

        revalidatePath(`/dashboard/manager/strategy/${campaignId}`);
        // Return the full approval URL (assuming a route exists)
        // For now, just return the token
        return { success: true, token, url: `${process.env.NEXT_PUBLIC_URL}/approve/${token}` };
    } catch (e) {
        console.error("Generate approval error", e);
        return { error: "Failed to generate approval link" };
    }
}

export async function uploadClientAsset(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return { error: "Unauthorized" };

    const file = formData.get("file") as File;
    const clientId = String(formData.get("clientId") || "");
    const title = String(formData.get("title") || "");
    const tagsString = String(formData.get("tags") || "");
    
    if (!file) return { error: "No file provided" };
    if (!clientId) return { error: "No client ID provided" };

    const tags = tagsString.split(",").map(t => t.trim()).filter(Boolean);

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    const writeClient = client.withConfig({ token: writeToken });

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const asset = await writeClient.assets.upload("image", buffer, {
            filename: file.name
        });

        const newKey = Math.random().toString(36).slice(2);

        // Add to client's brandAssets array
        await writeClient
            .patch(clientId)
            .setIfMissing({ brandAssets: [] })
            .append("brandAssets", [{
                _key: newKey,
                _type: "brandAsset",
                title: title || file.name,
                name: file.name,
                url: asset.url,
                tags: tags,
                file: {
                    _type: "image",
                    asset: {
                        _type: "reference",
                        _ref: asset._id
                    }
                }
            }])
            .commit();

        return { 
            success: true, 
            asset: {
                _key: newKey,
                title: title || file.name,
                name: file.name,
                url: asset.url,
                tags: tags,
                file: { asset: { _ref: asset._id } }
            } 
        };
    } catch (error) {
        console.error("Upload error:", error);
        return { error: "Upload failed" };
    }
}

export async function deleteClientAsset(clientId: string, assetKey: string) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return { error: "Unauthorized" };

    if (!clientId || !assetKey) return { error: "Missing required fields" };

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    const writeClient = client.withConfig({ token: writeToken });

    try {
        await writeClient
            .patch(clientId)
            .unset([`brandAssets[_key=="${assetKey}"]`])
            .commit();

        return { success: true };
    } catch (error) {
        console.error("Delete error:", error);
        return { error: "Delete failed" };
    }
}

export async function updateClientAssetTags(clientId: string, assetKey: string, tags: string[]) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return { error: "Unauthorized" };

    if (!clientId || !assetKey) return { error: "Missing required fields" };

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    const writeClient = client.withConfig({ token: writeToken });

    try {
        await writeClient
            .patch(clientId)
            .set({ [`brandAssets[_key=="${assetKey}"].tags`]: tags })
            .commit();

        return { success: true };
    } catch (error) {
        console.error("Update tags error:", error);
        return { error: "Update failed" };
    }
}

export async function publishToClient(formData: FormData) {
    const session = await safeGetServerSession();
    const email = String((session as any)?.user?.email || "");
    if (!email) return { error: "Unauthorized" };

    const acct = await fetchSanityAccountByEmail({ email });
    if (!acct || (acct.type !== "admin" && acct.type !== "manager")) {
        return { error: "Unauthorized: Managers only" };
    }

    const campaignId = String(formData.get("campaignId") || "");
    if (!campaignId) return { error: "Missing campaign ID" };

    const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
    const writeClient = client.withConfig({ token: writeToken });

    await writeClient
        .patch(campaignId)
        .set({ "strategyDeck.status": "client_review" })
        .commit();

    revalidatePath(`/flow/manager/${campaignId}`);
    return { success: true };
}
