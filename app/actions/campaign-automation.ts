"use server";

import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId, useCdn } from "@/sanity/env";
import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";

const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn,
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN,
  perspective: "published",
});

export async function generateDeliverablesFromStrategy(campaignId: string) {
  try {
    const session = await safeGetServerSession();
    if (!session?.user?.email) {
      return { error: "Unauthorized" };
    }

    const account = await fetchSanityAccountByEmail({ email: session.user.email });
    if (!account || !["manager", "admin"].includes(account.type)) {
      return { error: "Unauthorized: Managers only" };
    }

    // 1. Fetch Campaign and Proposed Deliverables
    const campaign = await writeClient.fetch(
      `*[_type == "campaign" && _id == $id][0]{
        _id,
        title,
        proposedDeliverables[] {
          title,
          type,
          platform,
          description,
          visualDirection,
          assets,
          references
        }
      }`,
      { id: campaignId }
    );

    if (!campaign) return { error: "Campaign not found" };
    if (!campaign.proposedDeliverables || campaign.proposedDeliverables.length === 0) {
      return { error: "No proposed deliverables to generate" };
    }

    // 2. Create Transaction
    const transaction = writeClient.transaction();
    
    // Set flag on campaign to prevent duplicate generation
    transaction.patch(campaign._id, p => p.set({ deliverablesGenerated: true }));

    let count = 0;

    for (const proposed of campaign.proposedDeliverables) {
      const doc = {
        _type: "deliverable",
        title: proposed.title || "Untitled Deliverable",
        campaign: { _type: "reference", _ref: campaign._id },
        status: "drafting",
        type: proposed.type,
        platform: proposed.platform,
        description: proposed.description,
        visualDirection: proposed.visualDirection,
        assets: proposed.assets, // Direct copy of array (references preserved)
        references: proposed.references,
        difficulty: "medium", // Default
      };
      
      transaction.create(doc);
      count++;
    }

    // 3. Commit
    await transaction.commit();

    return { success: true, count };
  } catch (error) {
    console.error("Generate Deliverables Error:", error);
    return { error: "Failed to generate deliverables" };
  }
}
