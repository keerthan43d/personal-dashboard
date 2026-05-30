import { NextRequest, NextResponse } from "next/server";
import { getOpenRouter, DEFAULT_MODELS } from "@/lib/linkedin/openrouter";
import { loadVoiceConfig, getRecentHooksBlock, buildPostSystemPrompt, sanitizePost } from "@/lib/linkedin/voice";

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

    const sourceLabel = dayType === "paste" ? "MY NOTES" : "RESEARCH";
    const groundingInstructions = `
GROUNDING (non-negotiable — read the ${sourceLabel} in full before writing):
- Read the entire ${sourceLabel} block below before you write a single line.
- Every factual claim — names, numbers, dates, quotes, companies, results — MUST come from the ${sourceLabel}. Do NOT add facts from your own memory.
- NEVER invent statistics, product names, version numbers, brands, or events that are not in the ${sourceLabel}. If a detail isn't there, leave it out.
- The author's TAKE is opinion/framing and is allowed; FACTS must trace back to the ${sourceLabel}.`;

    const extraInstructions = `
THIS POST:
- Topic: ${topic}
- Make it fun and high-energy, the way the sample posts feel.

HOW TO COMBINE THE TWO INPUTS (both are mandatory, neither may be ignored):
- MY OPINION/TAKE is the SPINE and point of view — the entire post argues, defends, or explores it. Never water it down, never replace it with a neutral recap.
- The ${sourceLabel} is the EVIDENCE — use its real facts, numbers, names, and examples to back the opinion up and make it credible.
- A great post = my opinion, PROVEN with the ${sourceLabel}. Not a neutral summary of the ${sourceLabel}, and not an unsupported opinion. Both must be clearly present.
${groundingInstructions}`;

    const systemPrompt = buildPostSystemPrompt(voiceConfig, recentHooksBlock, extraInstructions);

    const context = dayType === "paste"
      ? `TOPIC: ${topic}\nANGLE: ${angle}\n\nMY NOTES:\n${notes}`
      : `TOPIC: ${topic}\nANGLE: ${angle}\n\nRESEARCH:\n${research}`;

    const res = await openrouter.chat.completions.create({
      model: DEFAULT_MODELS.postWriter,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `${context}\n\nMY OPINION / TAKE (the spine of the post — build around this, backed by the ${sourceLabel} above):\n${take}\n\nWrite the LinkedIn post now. Make it impossible to scroll past.`,
        },
      ],
    });

    const postContent = sanitizePost(res.choices[0].message.content ?? "");
    return NextResponse.json({ postContent });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Generation failed" },
      { status: 500 }
    );
  }
}
