"use server";

import { deepseek } from "@/lib/ai";
import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";

export async function searchWeb(query: string) {
  const session = await safeGetServerSession();
  if (!session) return { error: "Unauthorized" };

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return { error: "Tavily API Key is missing. Please add TAVILY_API_KEY to your environment variables." };

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        include_answer: true,
        max_results: 5,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.error || "Search failed");
    }

    return { success: true, results: data.results, answer: data.answer };
  } catch (error) {
    console.error("Search Error:", error);
    return { error: "Failed to perform search. Please check your API key." };
  }
}

export async function analyzeUrl(url: string) {
  const session = await safeGetServerSession();
  if (!session) return { error: "Unauthorized" };

  try {
    // 1. Fetch the page content
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!res.ok) throw new Error("Failed to fetch URL");

    const html = await res.text();
    
    // 2. Simple text extraction (stripping script/style/tags)
    const text = html
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 15000); // Limit context window

    // 3. Extract Images (Simple Regex)
    const imgMatches = html.match(/<img[^>]+src="([^">]+)"/g) || [];
    const images = imgMatches
        .map(img => {
            const srcMatch = img.match(/src="([^">]+)"/);
            return srcMatch ? srcMatch[1] : null;
        })
        .filter(src => src && (src.startsWith("http") || src.startsWith("//"))) // Filter for absolute URLs mostly
        .map(src => src?.startsWith("//") ? "https:" + src : src) // Fix protocol relative
        .slice(0, 8); // Top 8 images

    // 4. AI Analysis
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `You are a strategic researcher. Analyze the following webpage content (likely a competitor or brand). 
          Extract key insights for a social media strategy:
          1. Brand Voice/Tone
          2. Content Pillars/Topics
          3. Strengths & Weaknesses
          4. Key Visual Elements described
          
          Format the output as Markdown.`
        },
        {
          role: "user",
          content: `URL: ${url}\n\nContent: ${text}`
        }
      ],
      temperature: 0.5,
    });

    return { 
      success: true, 
      analysis: response.choices[0].message.content,
      images: images as string[]
    };

  } catch (error) {
    console.error("Analysis Error:", error);
    return { error: "Failed to analyze URL. It might be blocked or unavailable." };
  }
}

export async function generateSlideContent(topic: string, context: any) {
    // Helper to generate slide text based on a topic
    const session = await safeGetServerSession();
    if (!session) return { error: "Unauthorized" };

    try {
        const response = await deepseek.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: "You are a presentation expert. Write the content for a slide in a Social Media Strategy Deck."
                },
                {
                    role: "user",
                    content: `Topic: ${topic}\nClient Context: ${JSON.stringify(context)}\n\nWrite a slide Title and Bullet points (Markdown).`
                }
            ]
        });
        
        return { success: true, content: response.choices[0].message.content };
    } catch (e) {
        return { error: "Failed to generate content" };
    }
}

export async function refreshCompetitorFeed(competitorName: string) {
  const session = await safeGetServerSession();
  if (!session) return { error: "Unauthorized" };

  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return { error: "Tavily API Key missing" };

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: `${competitorName} marketing news ads social media`,
        search_depth: "basic",
        include_images: false,
        max_results: 5,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Search failed");

    const feed = data.results.map((r: any) => ({
      title: r.title,
      url: r.url,
      date: r.published_date || new Date().toISOString().split('T')[0], 
      source: new URL(r.url).hostname.replace('www.', '')
    }));

    return { success: true, feed };

  } catch (error) {
    console.error("Feed Error:", error);
    return { error: "Failed to refresh feed" };
  }
}

export async function predictDeliverableSuccess(context: any, deliverable: any) {
    const session = await safeGetServerSession();
    if (!session) return { error: "Unauthorized" };

    try {
        const response = await deepseek.chat.completions.create({
            model: "deepseek-chat",
            messages: [
                {
                    role: "system",
                    content: `You are a Social Media Performance Predictor. 
                    Analyze the proposed deliverable against the strategy context.
                    Return a JSON object: { "score": number (0-100), "advice": ["point 1", "point 2", "point 3"] }`
                },
                {
                    role: "user",
                    content: `STRATEGY CONTEXT:
                    Target Audience: ${context.targetAudience}
                    Tone: ${context.toneOfVoice}
                    Pillars: ${context.strategicPillars?.join(", ")}

                    PROPOSED DELIVERABLE:
                    Title: ${deliverable.title}
                    Format: ${deliverable.type}
                    Platform: ${deliverable.platform}
                    Visual Direction: ${deliverable.visualDirection}
                    Description: ${deliverable.description}
                    
                    Return strict JSON.`
                }
            ]
        });

        const content = response.choices[0].message.content;
        
        // Find JSON object in response
        const jsonStart = content?.indexOf('{');
        const jsonEnd = content?.lastIndexOf('}');
        
        if (jsonStart !== undefined && jsonEnd !== undefined && jsonStart !== -1 && jsonEnd !== -1) {
            const jsonString = content?.substring(jsonStart, jsonEnd + 1);
            try {
                const result = JSON.parse(jsonString || "{}");
                return { success: true, prediction: result };
            } catch (e) {
                console.error("JSON Parse Error:", e);
                return { error: "Failed to parse prediction" };
            }
        } else {
             return { error: "No valid JSON found in AI response" };
        }
    } catch (e) {
        console.error("Prediction Error:", e);
        return { error: "Failed to predict success" };
    }
}
