import OpenAI from "openai";

export const DEFAULT_MODELS = {
  trending: "perplexity/sonar",
  post: "anthropic/claude-sonnet-4-5",
  fast: "anthropic/claude-haiku-4-5",
  image: "google/gemini-2.5-flash-image",
  // Workflow image step
  promptWriter: "openai/gpt-4o",
  imageMinimalist: "google/gemini-2.5-flash-image",
  imageBeeple: "google/gemini-2.5-flash-image",
} as const;

export function getOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  });
}
