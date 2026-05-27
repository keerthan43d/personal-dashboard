import { NextResponse } from "next/server";
import { getOpenRouter, DEFAULT_MODELS } from "@/lib/linkedin/openrouter";

export async function POST() {
  try {
    const openrouter = getOpenRouter();

    const researchRes = await openrouter.chat.completions.create({
      model: DEFAULT_MODELS.trending,
      messages: [
        {
          role: "user",
          content: `What are the 5 most interesting developments in AI, AI marketing, and Indian/global brand strategy from the past week?

For each, provide:
- The topic or event
- A brief summary (2-3 sentences)
- Why it would make a good LinkedIn post for marketers

Focus on topics that spark opinions, not press releases. Include a mix of AI tools, Indian brands, global strategies, and marketing trends.`,
        },
      ],
    });

    const rawResearch = researchRes.choices[0].message.content ?? "";

    const structureRes = await openrouter.chat.completions.create({
      model: DEFAULT_MODELS.post,
      messages: [
        {
          role: "system",
          content: `You are a content strategist for an Indian digital marketing professional who posts on LinkedIn 6 days a week.

The days and topics are:
- Monday: AI Marketing Tactic
- Tuesday: Indian Brand Teardown
- Wednesday: Own Case Study (skip for planner)
- Thursday: AI News + POV
- Friday: Global Brand Strategy
- Saturday: Build in Public (skip for planner)

From the research provided, extract 5 trending topics and map each to the most fitting day type.

Return ONLY valid JSON array. No markdown. No code fences:
[
  {
    "day": "Monday" | "Tuesday" | "Thursday" | "Friday",
    "topic": "...",
    "summary": "2-3 sentence summary of what happened",
    "suggestedAngle": "A specific, opinionated angle the author could take (1-2 sentences)",
    "whyItWorks": "One sentence on why this would perform well on LinkedIn"
  }
]`,
        },
        { role: "user", content: rawResearch },
      ],
    });

    const raw = structureRes.choices[0].message.content ?? "[]";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let topics: Array<{
      day: string;
      topic: string;
      summary: string;
      suggestedAngle: string;
      whyItWorks: string;
    }>;

    try {
      topics = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Failed to parse planner response", raw: cleaned }, { status: 500 });
    }

    return NextResponse.json({ topics });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Planner failed" },
      { status: 500 }
    );
  }
}
