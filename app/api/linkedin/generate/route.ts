import { NextRequest, NextResponse } from "next/server";
import { getOpenRouter, DEFAULT_MODELS } from "@/lib/linkedin/openrouter";
import { buildVoicePrompt, DEFAULT_VOICE_CONFIG } from "@/lib/linkedin/voice-config";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const openrouter = getOpenRouter();
    const supabase = getSupabaseServer();
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

    const { data: voiceRow } = await supabase
      .from("linkedin_voice_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    const voiceConfig = voiceRow
      ? {
          toneGuidelines: voiceRow.tone_guidelines,
          doWords: voiceRow.do_words ?? [],
          dontWords: voiceRow.dont_words ?? [],
          samplePosts: voiceRow.sample_posts ?? [],
          formattingRules: voiceRow.formatting_rules,
        }
      : DEFAULT_VOICE_CONFIG;

    const voicePrompt = buildVoicePrompt(voiceConfig);

    const { data: recentDrafts } = await supabase
      .from("linkedin_drafts")
      .select("post_content")
      .order("created_at", { ascending: false })
      .limit(5);

    const recentHooks = (recentDrafts ?? [])
      .map((d) => {
        const firstLine = (d.post_content as string)?.split("\n")[0] ?? "";
        return firstLine;
      })
      .filter(Boolean);

    const recentHooksBlock =
      recentHooks.length > 0
        ? `\n\nDO NOT reuse these recent opening lines:\n${recentHooks.map((h, i) => `${i + 1}. "${h}"`).join("\n")}`
        : "";

    const postResponse = await openrouter.chat.completions.create({
      model: DEFAULT_MODELS.post,
      messages: [
        {
          role: "system",
          content: `You are a LinkedIn ghostwriter. Write a complete LinkedIn post based on the article and the user's reaction.

${voicePrompt}
${recentHooksBlock}

INSTRUCTIONS:
- Tone: ${tone}
- Style: ${style}
- Target length: 1300-1900 characters
- The post should reflect the user's personal take, not just summarize the article
- Start with a strong hook that would stop the scroll
- End with a gut-punch line or a thought-provoking question
- Return ONLY the post text, nothing else`,
        },
        {
          role: "user",
          content: `ARTICLE: ${headline}\n\nSUMMARY: ${summary}\n\nMY TAKE: ${reaction}`,
        },
      ],
    });

    const postContent = postResponse.choices[0].message.content ?? "";

    return NextResponse.json({ postContent });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
