import OpenAI from "openai";

export const DEFAULT_MODELS = {
  trending: "perplexity/sonar",
  post: "anthropic/claude-sonnet-4-5",
  // Final post copy — OpenAI handles the fun/casual voice + emojis better
  postWriter: "openai/gpt-4o",
  fast: "anthropic/claude-haiku-4-5",
  // Hook writing (LinkedIn workflow) — Poolside Laguna XS 2.1 (free)
  hookWriter: "poolside/laguna-xs-2.1:free",
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
