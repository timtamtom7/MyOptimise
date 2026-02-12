"use server";

import { safeGetServerSession } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com"
});

interface GenerateCaptionParams {
  clientName: string;
  platform: string;
  title: string;
  tone?: string;
  postType?: string;
}

export async function generateContentCaption({ 
  clientName, 
  platform, 
  title, 
  tone = "professional yet engaging",
  postType = "post"
}: GenerateCaptionParams) {
  const session = await safeGetServerSession();
  if (!session) return { error: "Unauthorized" };

  if (!process.env.DEEPSEEK_API_KEY) {
    // Fallback mock response for development if key is missing
    console.warn("DEEPSEEK_API_KEY missing, using mock response");
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
    return {
      success: true,
      caption: `Excited to share our latest update on ${title}! 🚀\n\nWe've been working hard to bring you the best experience possible. Let us know what you think in the comments below! 👇`,
      hashtags: ["#marketing", "#growth", "#innovation", `#${clientName.replace(/\s+/g, '').toLowerCase()}`]
    };
  }

  const prompt = `
    Role: Expert Social Media Manager for a luxury agency.
    Task: Write a high-quality caption for a ${platform} ${postType}.
    Client: ${clientName}
    Topic/Context: ${title}
    Tone: ${tone}

    Requirements:
    1. The caption should be engaging and optimized for ${platform}.
    2. Include 3-5 relevant hashtags at the end.
    3. Return ONLY a JSON object with two fields: "caption" (string) and "hashtags" (array of strings).
    4. Do not include any markdown formatting like \`\`\`json.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a helpful social media assistant that outputs strict JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    const cleanContent = content?.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
        const result = JSON.parse(cleanContent || "{}");
        return {
            success: true,
            caption: result.caption || content, // Fallback to raw content if parse fails but has text
            hashtags: result.hashtags || []
        };
    } catch (e) {
        // If JSON parse fails, assume the whole content is the caption
        return {
            success: true,
            caption: cleanContent || "",
            hashtags: []
        };
    }

  } catch (error: any) {
    console.error("AI Caption Gen Error:", error);
    return { 
      error: "Failed to generate caption.", 
      message: error.message || "Unknown error occurred"
    };
  }
}
