import { NextRequest, NextResponse } from "next/server";
import { getOpenRouter, DEFAULT_MODELS } from "@/lib/linkedin/openrouter";
import { loadVoiceConfig, getRecentHooksBlock, buildPostSystemPrompt, sanitizePost } from "@/lib/linkedin/voice";

export async function POST(req: NextRequest) {
  try {
    const openrouter = getOpenRouter();
    const body = await req.json();

    const {
      headline,
      summary,
      reaction,
      tone,
      style,
    } = body as {
      headline: string;
      summary: string;
      reaction: string;
      tone: string;
      style: string;
    };

    const [voiceConfig, recentHooksBlock] = await Promise.all([
      loadVoiceConfig(),
      getRecentHooksBlock(),
    ]);

    const extraInstructions = `
THIS POST:
- Tone hint: ${tone}
- Style hint: ${style}
- Build the post around the author's personal take, not a summary of the article.`;

    const systemPrompt = buildPostSystemPrompt(voiceConfig, recentHooksBlock, extraInstructions);

    const postResponse = await openrouter.chat.completions.create({
      model: DEFAULT_MODELS.postWriter,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `ARTICLE: ${headline}\n\nSUMMARY: ${summary}\n\nMY TAKE: ${reaction}\n\nWrite the LinkedIn post now. Make it impossible to scroll past.`,
        },
      ],
    });

    const postContent = sanitizePost(postResponse.choices[0].message.content ?? "");

    return NextResponse.json({ postContent });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
