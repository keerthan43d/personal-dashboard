import { NextRequest, NextResponse } from "next/server";
import { getOpenRouter, DEFAULT_MODELS } from "@/lib/linkedin/openrouter";
import { loadVoiceConfig, getRecentHooksBlock, buildPostSystemPrompt } from "@/lib/linkedin/voice";

export async function POST(req: NextRequest) {
  try {
    const { topic, angle, research, notes, take, dayType } = await req.json() as {
      topic: string;
      angle: string;
      research?: string;
      notes?: string;
      take: string;
      dayType: "research" | "paste";
    };

    const openrouter = getOpenRouter();

    const [voiceConfig, recentHooksBlock] = await Promise.all([
      loadVoiceConfig(),
      getRecentHooksBlock(),
    ]);

    const extraInstructions = `
THIS POST:
- Topic: ${topic}
- The author's personal take is the spine of the post — build the whole post around it, do not just summarize the source material.
- Make it fun and high-energy, the way the sample posts feel.`;

    const systemPrompt = buildPostSystemPrompt(voiceConfig, recentHooksBlock, extraInstructions);

    const context = dayType === "paste"
      ? `TOPIC: ${topic}\nANGLE: ${angle}\n\nMY NOTES:\n${notes}`
      : `TOPIC: ${topic}\nANGLE: ${angle}\n\nRESEARCH:\n${research}`;

    const res = await openrouter.chat.completions.create({
      model: DEFAULT_MODELS.post,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `${context}\n\nMY ONE-LINE TAKE: ${take}\n\nWrite the LinkedIn post now. Make it impossible to scroll past.`,
        },
      ],
    });

    const postContent = res.choices[0].message.content ?? "";
    return NextResponse.json({ postContent });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
