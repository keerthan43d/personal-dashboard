import { NextRequest, NextResponse } from "next/server";
import { getOpenRouter, DEFAULT_MODELS } from "@/lib/linkedin/openrouter";

type ImageStyle = "minimalist" | "statement" | "beeple";

const STYLE_DESCRIPTORS: Record<ImageStyle, string> = {
  minimalist:
    "minimalist editorial design, lots of negative space, clean geometry, sharp typography if any text appears, premium magazine feel",
  statement:
    "bold typographic quote card, one short punchy line of text as the HERO element in large heavy sans-serif (Poppins/Inter style), high contrast, social-media statement-card layout, the text is the focal point and must be spelled exactly as provided",
  beeple:
    "Beeple Everydays digital art style, surreal cinematic scene, hyper-detailed textures, dystopian scale, dramatic god rays, hyper-realistic rendering",
};

const MOOD_BY_STYLE: Record<ImageStyle, string> = {
  minimalist: "calm, premium, confident, breathing room",
  statement: "bold, punchy, confident, scroll-stopping, high-contrast",
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
          content: `You write image generation prompts for LinkedIn post cover images. The image must stop the scroll.

BRAND PALETTE:
- Deep royal purple and clean white are the default palette.
- You MAY introduce one bold accent color if the post's mood calls for it. Avoid muddy or washed-out tones.

PEOPLE: A confident human face or hands are allowed and often help engagement — use them when the post is about a person, a reaction, or a relatable moment.

${style === "statement"
  ? `THIS IS A STATEMENT CARD. Pick the single most punchy short line from the post (max 8 words — a hook, a number, or a bold claim). The prompt must instruct the image to render THAT exact text as large bold typography, spelled correctly, as the focal point. State the exact text in quotes in your prompt.`
  : `Do not put long sentences of text in the image.`}

PROMPT STRUCTURE (in order, under 80 words total):
1. ${style === "statement" ? "The exact short text to display, in quotes" : "Main subject or scene from the post"}
2. Style: ${styleDesc}
3. Color palette: royal purple and white led, with mood-appropriate accent allowed
4. Mood: ${mood}
5. Composition: balanced, strong focal point, portrait 4:5 framing with breathing room at top and bottom
6. Quality: high detail, professional, premium feel

Return ONLY the image prompt text. No labels, no explanation, no quotes around the whole thing. Just the prompt itself.`,
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
