import { NextRequest, NextResponse } from "next/server";
import { getOpenRouter, DEFAULT_MODELS } from "@/lib/linkedin/openrouter";

const RESEARCH_PROMPTS: Record<string, (angle: string) => string> = {
  "AI Marketing Tactic": (angle: string) =>
    `Research this AI marketing technique for a LinkedIn post: "${angle}"

Find:
- What the tactic is and how it works
- Real brand examples using it (with names and results)
- Specific numbers, data, or case studies
- Why it matters for marketers right now
- Any criticism or limitations

Focus on developments from the last 3-6 months. Be specific, not generic.`,

  "Indian Brand Teardown": (angle: string) =>
    `Research this Indian brand story for a LinkedIn post: "${angle}"

Find:
- What the brand did (campaign, strategy, decision, or launch)
- Timeline and context
- The marketing or business thinking behind it
- Results, numbers, or outcomes
- Public and industry reaction
- What other marketers can learn from it

Be specific with dates, numbers, and named decisions.`,

  "AI News + My Take": (angle: string) =>
    `Find the latest news about this AI development for a LinkedIn post: "${angle}"

Find:
- What happened and when (last 24-48 hours preferred)
- Who is involved (companies, people)
- Key numbers, quotes, or announcements
- Implications for marketing and business
- Different perspectives from the industry
- Source URLs

Prioritize recency and specificity.`,

  "Global Brand Strategy": (angle: string) =>
    `Research this global brand strategy for a LinkedIn post: "${angle}"

Find:
- What strategy the brand used and why
- Specific campaigns, decisions, or pivots
- Data and results (revenue, awareness, engagement)
- Expert opinions and analysis
- What Indian marketers can learn from it
- Any backlash or criticism

Include specific examples, not summaries.`,
};

export async function POST(req: NextRequest) {
  try {
    const { topic, angle } = await req.json() as { topic: string; angle: string };
    const openrouter = getOpenRouter();

    const promptFn = RESEARCH_PROMPTS[topic];
    const prompt = promptFn
      ? promptFn(angle)
      : `Research this topic for a LinkedIn post: "${topic} — ${angle}"\n\nFind specific recent examples, data, expert opinions, and insights that a marketing professional's audience would find valuable.`;

    const res = await openrouter.chat.completions.create({
      model: DEFAULT_MODELS.trending,
      messages: [{ role: "user", content: prompt }],
    });

    return NextResponse.json({ research: res.choices[0].message.content ?? "" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Research failed" },
      { status: 500 }
    );
  }
}
