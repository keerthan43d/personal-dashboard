import { NextRequest, NextResponse } from "next/server";
import { getOpenRouter, DEFAULT_MODELS } from "@/lib/linkedin/openrouter";

export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  await params; // consume to satisfy Next.js

  try {
    const { godName, topic } = await req.json() as {
      godName: string;
      topic: string;
    };

    if (!godName?.trim()) {
      return NextResponse.json({ error: "godName is required" }, { status: 400 });
    }

    const openrouter = getOpenRouter();

    const query = topic?.trim()
      ? `${godName}'s views and work on: ${topic}`
      : `${godName} — biography, marketing philosophy, major campaigns, key principles, famous quotes, and legacy`;

    const res = await openrouter.chat.completions.create({
      model: DEFAULT_MODELS.trending, // perplexity/sonar — live web
      messages: [
        {
          role: "user",
          content: `Research the following and produce a comprehensive, factual summary that can be used to ground an AI persona of this person. Be specific: include key principles, direct quotes, named campaigns or works, dates, collaborators, and the reasoning behind their beliefs.

SUBJECT: ${query}

Requirements:
- Accurate, sourced facts only — do NOT invent quotes
- Include famous quotes attributed to them, noting the source
- Describe their communication style, personality, and how they made decisions
- List their major works, campaigns, books, or achievements with context
- Note any controversies or contradictions in their legacy
- Plain text, no markdown headers.`,
        },
      ],
    });

    const research = res.choices[0].message.content?.trim() ?? "";
    return NextResponse.json({ research });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Research failed" },
      { status: 500 }
    );
  }
}
