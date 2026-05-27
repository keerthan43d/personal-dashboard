import { NextRequest, NextResponse } from "next/server";
import { getOpenRouter, DEFAULT_MODELS } from "@/lib/linkedin/openrouter";

type ImageStyle = "minimalist" | "beeple";

const STYLE_DESCRIPTORS: Record<ImageStyle, string> = {
  minimalist:
    "minimalist editorial design, lots of negative space, clean geometry, sharp typography if any text appears, premium magazine feel",
  beeple:
    "Beeple Everydays digital art style, surreal cinematic scene, hyper-detailed textures, dystopian scale, dramatic god rays, hyper-realistic rendering",
};

const MOOD_BY_STYLE: Record<ImageStyle, string> = {
  minimalist: "calm, premium, confident, breathing room",
  beeple: "epic, dramatic, cinematic, awe-inspiring scale",
};

export async function POST(req: NextRequest) {
  try {
    const { post, style } = await req.json() as {
      post: string;
      style: ImageStyle;
    };

    const openrouter = getOpenRouter();

    const styleDesc = STYLE_DESCRIPTORS[style];
    const mood = MOOD_BY_STYLE[style];

    const res = await openrouter.chat.completions.create({
      model: DEFAULT_MODELS.promptWriter,
      messages: [
        {
          role: "system",
          content: `You write image generation prompts for LinkedIn post cover images.

BRAND GUIDELINES:
- Primary color: royal purple
- Secondary color: clean white
- These colors MUST dominate every image

PROMPT STRUCTURE (in order, under 80 words total):
1. Main subject or scene from the post
2. Style: ${styleDesc}
3. Color palette: royal purple and clean white, dominant
4. Mood: ${mood}
5. Composition: centered, square frame, balanced
6. Quality: high detail, professional, premium feel

Return ONLY the image prompt text. No labels, no explanation, no quotes. Just the prompt itself.`,
        },
        {
          role: "user",
          content: `Write an image prompt for this LinkedIn post:\n\n${post.slice(0, 600)}`,
        },
      ],
    });

    const prompt = res.choices[0].message.content?.trim() ?? "";
    return NextResponse.json({ prompt });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Prompt generation failed" },
      { status: 500 }
    );
  }
}
