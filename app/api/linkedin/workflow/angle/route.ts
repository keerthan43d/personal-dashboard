import { NextRequest, NextResponse } from "next/server";
import { getOpenRouter, DEFAULT_MODELS } from "@/lib/linkedin/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json() as { topic: string };
    const openrouter = getOpenRouter();

    const res = await openrouter.chat.completions.create({
      model: DEFAULT_MODELS.fast,
      messages: [
        {
          role: "system",
          content: `You are a LinkedIn content strategist for an Indian digital marketing professional.
Suggest one fresh, specific, opinionated angle for their daily LinkedIn post.
The angle should be surprising, concrete, and spark discussion.
Do NOT suggest generic angles. Be specific with names, numbers, or trends.
Return just the angle idea in 1-2 sentences. No preamble, no label.`,
        },
        {
          role: "user",
          content: `Today's post topic: ${topic}\n\nSuggest one specific angle I could take on this.`,
        },
      ],
    });

    return NextResponse.json({ angle: res.choices[0].message.content?.trim() ?? "" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
