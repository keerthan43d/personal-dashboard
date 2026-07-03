import { NextRequest, NextResponse } from "next/server";
import { getOpenRouter, DEFAULT_MODELS } from "@/lib/linkedin/openrouter";
import { buildHookSwipeBlock } from "@/lib/linkedin/hooks";

interface HookAnalysis {
  score: number; // 1-10
  curiosity: "high" | "medium" | "low";
  specificity: "high" | "medium" | "low";
  tension: "high" | "medium" | "low";
  strong: boolean;
  reason: string;
}

function firstLineOf(post: string): string {
  return post.split("\n").find((l) => l.trim().length > 0) ?? "";
}

function stripFences(raw: string): string {
  return raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
}

// A hard anchor so regenerated hooks never drift off-topic or invent facts.
// The research (when present) is the source of truth — read it FIRST, then
// write a hook grounded only in what it actually says.
function buildGroundingBlock(topic?: string, take?: string, research?: string): string {
  const lines: string[] = [];

  if (research?.trim()) {
    lines.push(
      "RESEARCH (READ THIS FIRST — it is the source of truth for every factual claim):",
      research.trim(),
      ""
    );
  }

  lines.push(
    "GROUNDING (non-negotiable):",
    "- The hook MUST be about the exact subject below and nothing else.",
    research?.trim()
      ? "- Base the hook ONLY on facts, names, numbers, and quotes that appear in the RESEARCH above (or the post text). Read the research before writing."
      : "- Use ONLY names, numbers, products, versions, and facts that actually appear in the SUBJECT or POST text provided.",
    "- NEVER invent product names, version numbers, statistics, brands, or comparisons that are not in the source. If you are tempted to add a specific detail that isn't in the source, leave it out.",
    "- 'Be specific' means pull a real detail FROM the source — not fabricate a plausible-sounding one."
  );

  if (topic?.trim()) lines.push(`\nSUBJECT (the hook must stay on this): ${topic.trim()}`);
  if (take?.trim()) lines.push(`USER'S ANGLE / TAKE: ${take.trim().slice(0, 400)}`);
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { post, action, topic, take, research } = await req.json() as {
      post: string;
      action: "check" | "options" | "regenerate";
      topic?: string;
      take?: string;
      research?: string;
    };

    const openrouter = getOpenRouter();
    const firstLine = firstLineOf(post);
    const restOfPost = post.split("\n").slice(1).join("\n").trimStart();
    const groundingBlock = buildGroundingBlock(topic, take, research);

    // ── Judge the hook on what actually matters: curiosity, tension, specificity ──
    if (action === "check") {
      const res = await openrouter.chat.completions.create({
        model: DEFAULT_MODELS.fast,
        messages: [
          {
            role: "system",
            content: `You are a ruthless LinkedIn hook judge. You score the FIRST LINE of a post on whether it stops the scroll.

Judge on four things:
1. CURIOSITY — does it open a loop the reader must close? (high/medium/low)
2. TENSION — is there an emotional charge: conflict, stakes, a bold claim? (high/medium/low)
3. SPECIFICITY — concrete number, name, or detail beats vague every time. (high/medium/low)
4. Overall SCROLL-STOPPING power, 1-10.

A hook is "strong" only if score >= 7. Word count and "has a number" do NOT automatically make a hook good — a vague number is still vague, and a sharp line with no number can still be great.

Return ONLY this JSON, nothing else:
{
  "score": <1-10>,
  "curiosity": "high" | "medium" | "low",
  "specificity": "high" | "medium" | "low",
  "tension": "high" | "medium" | "low",
  "strong": <boolean>,
  "reason": "<one punchy sentence on why it works or doesn't>"
}`,
          },
          { role: "user", content: `Hook to judge: "${firstLine}"` },
        ],
      });

      let analysis: HookAnalysis;
      try {
        analysis = JSON.parse(stripFences(res.choices[0].message.content ?? "{}"));
      } catch {
        analysis = {
          score: 5,
          curiosity: "medium",
          specificity: "low",
          tension: "low",
          strong: false,
          reason: "Could not auto-evaluate — eyeball this hook yourself.",
        };
      }

      return NextResponse.json({ analysis, hook: firstLine });
    }

    // ── Generate 3 distinct hook options the user can pick from ──
    if (action === "options") {
      const res = await openrouter.chat.completions.create({
        model: DEFAULT_MODELS.hookWriter,
        messages: [
          {
            role: "system",
            content: `You are a LinkedIn hook writer for an Indian digital marketing professional. Write 3 DIFFERENT opening lines for the post below.

${groundingBlock}

${buildHookSwipeBlock()}

RULES:
- Each hook uses a DIFFERENT archetype. Maximum variety — but every one stays on the SUBJECT above.
- 1-2 short lines each. Punchy. Specificity must come from a real detail in the source, never invented.
- Must make the reader need line three.
- No emojis in the hook. No hashtags. No markdown.
- Banned openers: "In today's world", "Have you ever", "We all know".
- Match the fun, blunt, high-energy voice of the post.

Return ONLY this JSON array, nothing else:
[
  { "archetype": "<archetype name>", "hook": "<the hook line(s)>" },
  { "archetype": "<archetype name>", "hook": "<the hook line(s)>" },
  { "archetype": "<archetype name>", "hook": "<the hook line(s)>" }
]`,
          },
          {
            role: "user",
            content: `Current opening line: "${firstLine}"\n\nFull post for context:\n${post.slice(0, 1200)}\n\nWrite 3 stronger, distinct hooks.`,
          },
        ],
      });

      let options: Array<{ archetype: string; hook: string }>;
      try {
        options = JSON.parse(stripFences(res.choices[0].message.content ?? "[]"));
      } catch {
        options = [];
      }

      return NextResponse.json({ options });
    }

    // ── Backward-compat: regenerate a single hook in place ──
    const res = await openrouter.chat.completions.create({
      model: DEFAULT_MODELS.hookWriter,
      messages: [
        {
          role: "system",
          content: `You are a LinkedIn hook writer. Write ONE new opening line for the post.

${groundingBlock}

${buildHookSwipeBlock()}

RULES:
- 1-2 short lines. Punchy. Specificity must come from a real detail in the source, never invented.
- Must make the reader want line three.
- No emojis, no hashtags, no markdown.
- No generic openers like "In today's world" or "Have you ever".
- Match the fun, blunt, high-energy voice.

Return only the hook line(s), nothing else.`,
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
