"use server";

import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import { safeGetServerSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const writeClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

export interface EditorMatch {
  id: string;
  name: string;
  avatar?: any;
  email: string;
  skills: string[];
  portfolioTags: string[];
  matchScore: number;
  matchReasons: string[];
}

export async function findMatchingEditors(deliverableId: string): Promise<{ editors: EditorMatch[]; error?: string }> {
  try {
    const session = await safeGetServerSession();
    if (!session?.user?.email) {
      return { error: "Unauthorized", editors: [] };
    }

    // 1. Fetch Deliverable Details
    const deliverable = await writeClient.fetch(
      `*[_type == "deliverable" && _id == $id][0]{
        _id,
        title,
        type,
        platform,
        visualDirection,
        contentConcept,
        difficulty
      }`,
      { id: deliverableId }
    );

    if (!deliverable) {
      return { error: "Deliverable not found", editors: [] };
    }

    // 2. Fetch All Editors (Employees)
    const editors = await writeClient.fetch(
      `*[_type == "account" && type == "employee" && status == "active"]{
        _id,
        name,
        email,
        avatar,
        skills,
        portfolioTags
      }`
    );

    // 3. Calculate Match Scores
    const rankedEditors: EditorMatch[] = editors.map((editor: any) => {
      let score = 0;
      const reasons: string[] = [];
      const skills = (editor.skills || []).map((s: string) => s.toLowerCase());
      const tags = (editor.portfolioTags || []).map((t: string) => t.toLowerCase());

      // Match Platform (High weight)
      if (deliverable.platform && skills.includes(deliverable.platform.toLowerCase())) {
        score += 20;
        reasons.push(`Expert in ${deliverable.platform}`);
      }

      // Match Type (High weight)
      if (deliverable.type && skills.includes(deliverable.type.toLowerCase())) {
        score += 15;
        reasons.push(`Skilled in ${deliverable.type}s`);
      }

      // Keyword Matching from Visual Direction
      if (deliverable.visualDirection) {
        const keywords = deliverable.visualDirection.toLowerCase().split(/\W+/).filter((w: string) => w.length > 3);
        const matchedTags = tags.filter((tag: string) => keywords.includes(tag));
        if (matchedTags.length > 0) {
            score += matchedTags.length * 5;
            reasons.push(`Matches style: ${matchedTags.join(", ")}`);
        }
      }

      // Bonus for having many tags (General versatility)
      if (tags.length > 5) {
        score += 2;
      }

      return {
        id: editor._id,
        name: editor.name,
        email: editor.email,
        avatar: editor.avatar,
        skills: editor.skills || [],
        portfolioTags: editor.portfolioTags || [],
        matchScore: score,
        matchReasons: reasons
      };
    });

    // Sort by score descending
    rankedEditors.sort((a, b) => b.matchScore - a.matchScore);

    return { editors: rankedEditors };
  } catch (error) {
    console.error("Find Matching Editors Error:", error);
    return { error: "Failed to find editors", editors: [] };
  }
}

export async function assignEditor(deliverableId: string, editorId: string) {
  try {
    const session = await safeGetServerSession();
    if (!session?.user?.email) {
      return { error: "Unauthorized" };
    }

    await writeClient
      .patch(deliverableId)
      .set({
        assignedTo: { _type: "reference", _ref: editorId },
        status: "assigned", 
        claimedAt: new Date().toISOString()
      })
      .commit();

    revalidatePath("/dashboard"); 
    return { success: true };
  } catch (error) {
    console.error("Assign Editor Error:", error);
    return { error: "Failed to assign editor" };
  }
}
