import { NextRequest, NextResponse } from "next/server";
import { getOpenRouter, DEFAULT_MODELS } from "@/lib/linkedin/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { post, action } = await req.json() as {
      post: string;
      action: "check" | "regenerate";
    };

    const openrouter = getOpenRouter();
    const firstLine = post.split("\n").find((l) => l.trim().length > 0) ?? "";
    const wordCount = firstLine.trim().split(/\s+/).length;

    if (action === "check") {
      const res = await openrouter.chat.completions.create({
        model: DEFAULT_MODELS.fast,
        messages: [
          {
            role: "system",
            content: `You are a LinkedIn hook analyst. Evaluate the hook and return JSON only.

A strong hook:
1. Is under 12 words
2. Contains a specific number, name, or surprising claim
3. Makes you want to read the next line

Return this exact JSON:
{
  "wordCount": <number>,
  "under12Words": <boolean>,
  "hasSpecific": <boolean>,
  "strong": <boolean>,
  "reason": "<one sentence on why it is or isn't strong>"
}`,
          },
          {
            role: "user",
            content: `Hook to evaluate: "${firstLine}"`,
          },
        ],
      });

      const raw = res.choices[0].message.content ?? "{}";
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      let analysis: {
        wordCount: number;
        under12Words: boolean;
        hasSpecific: boolean;
        strong: boolean;
        reason: string;
      };

      try {
        analysis = JSON.parse(cleaned);
      } catch {
        analysis = {
          wordCount,
          under12Words: wordCount < 12,
          hasSpecific: false,
          strong: false,
          reason: "Could not evaluate — check the hook manually.",
        };
      }

      return NextResponse.json({ analysis, hook: firstLine });
    }

    // Regenerate just the hook
    const restOfPost = post.split("\n").slice(1).join("\n").trimStart();

    const res = await openrouter.chat.completions.create({
      model: DEFAULT_MODELS.post,
      messages: [
        {
          role: "system",
          content: `You are a LinkedIn hook writer. Write ONE new opening line for a LinkedIn post.

Rules:
- Under 12 words
- Must contain a specific number, name, or surprising claim
- Must make the reader want to read the next line
- No markdown, no emojis
- No generic openers like "In today's world" or "Have you ever"
- Write like an Indian marketing professional

Return only the hook sentence, nothing else.`,
        },
        {
          role: "user",
          content: `Current weak hook: "${firstLine}"\n\nRest of post for context:\n${restOfPost.slice(0, 800)}\n\nWrite a stronger hook.`,
        },
      ],
    });

    const newHook = res.choices[0].message.content?.trim() ?? firstLine;
    const newPost = newHook + "\n" + post.split("\n").slice(1).join("\n");

    return NextResponse.json({ newHook, newPost });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Hook operation failed" },
      { status: 500 }
    );
  }
}
