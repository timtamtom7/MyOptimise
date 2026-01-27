"use server";

import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId, useCdn } from "@/sanity/env";
import { revalidatePath } from "next/cache";

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn,
  token: process.env.SANITY_API_TOKEN,
});

export interface EditorMatch {
  editorId: string;
  name: string;
  avatar: any;
  score: number;
  matchReasons: string[];
  skills: string[];
}

export async function findBestEditors(requirements: {
  skills?: string[];
  tags?: string[];
  platform?: string;
}): Promise<{ success: boolean; matches?: EditorMatch[]; error?: string }> {
  try {
    // Fetch all active employees (editors)
    const query = `*[_type == "account" && type == "employee" && status == "active"]{
      _id,
      name,
      avatar,
      skills,
      portfolioTags,
      capabilities
    }`;

    const editors = await client.fetch(query);

    if (!editors || editors.length === 0) {
      return { success: true, matches: [] };
    }

    const matches: EditorMatch[] = editors.map((editor: any) => {
      let score = 0;
      const matchReasons: string[] = [];

      // 1. Skill Match (+10 per skill)
      if (requirements.skills && editor.skills) {
        requirements.skills.forEach(reqSkill => {
          if (editor.skills.some((s: string) => s.toLowerCase() === reqSkill.toLowerCase())) {
            score += 10;
            matchReasons.push(`Matches skill: ${reqSkill}`);
          }
        });
      }

      // 2. Tag Match (+5 per tag)
      if (requirements.tags && editor.portfolioTags) {
        requirements.tags.forEach(reqTag => {
          if (editor.portfolioTags.some((t: string) => t.toLowerCase() === reqTag.toLowerCase())) {
            score += 5;
            matchReasons.push(`Matches style: ${reqTag}`);
          }
        });
      }

      // 3. Platform Match (+15 if capability exists)
      if (requirements.platform && editor.capabilities) {
         // Assuming capabilities might include things like "Reels", "TikTok", "YouTube"
         if (editor.capabilities.some((c: string) => c.toLowerCase().includes(requirements.platform!.toLowerCase()))) {
            score += 15;
            matchReasons.push(`Expert in ${requirements.platform}`);
         }
      }

      // Base score for being active
      score += 1;

      return {
        editorId: editor._id,
        name: editor.name,
        avatar: editor.avatar,
        score,
        matchReasons,
        skills: editor.skills || []
      };
    });

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return { success: true, matches };
  } catch (error) {
    console.error("Error finding editors:", error);
    return { success: false, error: "Failed to match editors" };
  }
}

export async function findBestMatches(deliverableId: string) {
    try {
        // Fetch deliverable details
        const deliverable = await client.fetch(`*[_type == "deliverable" && _id == $id][0]{
            platform,
            type,
            visualDirection,
            contentConcept
        }`, { id: deliverableId });

        if (!deliverable) return { success: false, error: "Deliverable not found" };

        const requirements = {
            platform: deliverable.platform,
            skills: [deliverable.type], // e.g. "reel", "static_post"
            tags: [] // We could parse tags from visualDirection if we wanted
        };

        const result = await findBestEditors(requirements);
        
        // Map result to match the UI component expectation
        // UI expects: { _id, name, avatar, matchScore, matchReasons, activeCount }
        // Our findBestEditors returns { editorId, score, ... }
        
        const uiMatches = result.matches?.map(m => ({
            _id: m.editorId,
            name: m.name,
            avatar: m.avatar,
            matchScore: Math.min(100, m.score * 2), // Scale up for UI
            matchReasons: m.matchReasons,
            activeCount: 0 // We didn't fetch active count yet, could be a separate query
        }));

        return { success: true, matches: uiMatches };

    } catch (e) {
        console.error("Error in findBestMatches:", e);
        return { success: false, error: "Error finding matches" };
    }
}

export async function assignEditor(deliverableId: string, editorId: string) {
    try {
        await client.patch(deliverableId)
            .set({ 
                assignedTo: { _type: "reference", _ref: editorId },
                status: "assigned",
                claimedAt: new Date().toISOString()
            })
            .commit();

        revalidatePath(`/flow/manager/campaigns`);
        revalidatePath(`/flow/manager/brief/${deliverableId}`);
        
        return { success: true };
    } catch (e) {
        console.error("Error assigning editor:", e);
        return { success: false, error: "Assignment failed" };
    }
}
