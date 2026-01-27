import OpenAI from "openai";

// Initialize DeepSeek client using OpenAI SDK
// DeepSeek is API-compatible with OpenAI
export const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/v1", // Standard DeepSeek API endpoint
});
