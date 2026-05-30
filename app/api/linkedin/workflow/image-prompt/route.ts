import { NextRequest, NextResponse } from "next/server";
import { getOpenRouter, DEFAULT_MODELS } from "@/lib/linkedin/openrouter";
import { DESIGN_STYLE_BIBLE } from "@/lib/linkedin/design-style-bible";

type ImageStyle = "artdirector" | "minimalist" | "statement" | "beeple";

const STYLE_DESCRIPTORS: Record<Exclude<ImageStyle, "artdirector">, string> = {
  minimalist:
    "minimalist editorial design, lots of negative space, clean geometry, sharp typography if any text appears, premium magazine feel",
  statement:
    "bold typographic quote card, one short punchy line of text as the HERO element in large heavy sans-serif (Poppins/Inter style), high contrast, social-media statement-card layout, the text is the focal point and must be spelled exactly as provided",
  beeple:
    "Beeple Everydays digital art style, surreal cinematic scene, hyper-detailed textures, dystopian scale, dramatic god rays, hyper-realistic rendering",
};

const MOOD_BY_STYLE: Record<Exclude<ImageStyle, "artdirector">, string> = {
  minimalist: "calm, premium, confident, breathing room",
  statement: "bold, punchy, confident, scroll-stopping, high-contrast",
  beeple: "epic, dramatic, cinematic, awe-inspiring scale",
};

export async function POST(req: NextRequest) {
  try {
    const { post, style, concept } = await req.json() as {
      post: string;
      style: ImageStyle;
      concept?: string;
    };

    const openrouter = getOpenRouter();

    // ── Art Director: reads post + concept + style bible, designs fresh ──
    if (style === "artdirector") {
      const conceptBlock = concept?.trim()
        ? `THE CREATOR'S CONCEPT for this image (honor it — it is the creative brief):\n${concept.trim()}`
        : `No concept was given. Read the post and decide the single strongest visual idea yourself.`;

      const res = await openrouter.chat.completions.create({
        model: DEFAULT_MODELS.promptWriter,
        messages: [
          {
            role: "system",
            content: `You are the lead VISUAL DESIGNER / ART DIRECTOR for a LinkedIn creator. You do not write generic prompts — you DESIGN. For each post you decide the concept, composition, color, type, and subject, then express it as one vivid image-generation prompt.

You work from the creator's own design DNA, distilled from their best-performing posters:

${DESIGN_STYLE_BIBLE}

YOUR PROCESS:
1. Read the post and the creator's concept. Find the ONE idea worth showing — a tension, a metaphor, a transformation, a hero object. Not a literal illustration of every word.
2. Choose a layout from the design DNA's recurring moves (pick 2-3 that fit — never all). Decide the ONE accent color that matches this post's mood.
3. Decide the exact on-image TEXT: a punchy serif headline or question that can run 2-4 short lines (~5-10 words, pulled from the post/concept). Choose 2-3 key words to emphasise — each set inside its OWN solid FILLED rectangle with WHITE ITALIC bold text inside, the box fills ALTERNATING between the accent color and black; all other words large bold black serif. Quote the full headline and name exactly which words are boxed and in which color.
4. Describe the hero subject and its treatment (cut-out, statue, duotone, 3D prop, frame/glow), the backdrop (grid? doodles?), and the footer lockup.

HARD RULES:
- Make it look ART-DIRECTED and editorial, never stock or generic-AI.
- It MUST look different from a fixed template — vary composition, accent color, and subject treatment.
- Quote the exact on-image text so the generator spells it correctly. Keep it to a headline (2-4 short lines) plus an optional one-line subhead — no paragraphs.
- Portrait 4:5 framing.
- Write in natural visual prose. Do NOT echo the design-DNA's section labels or ALL-CAPS terms (e.g. "HIGHLIGHT-BOX TYPOGRAPHY", "CLASSICAL MARBLE STATUE", "QUIET FOOTER LOCKUP") — describe the actual visual instead. The ONLY words in capitals or quotes in your output should be the literal text meant to be printed on the poster.

Return ONLY the final image-generation prompt — one rich paragraph, under 150 words. No labels, no commentary, no markdown.`,
          },
          {
            role: "user",
            content: `${conceptBlock}\n\nTHE FINAL POST:\n${post.slice(0, 1000)}\n\nDesign the poster and return the image prompt.`,
          },
        ],
      });

      const prompt = res.choices[0].message.content?.trim() ?? "";
      return NextResponse.json({ prompt });
    }

    // ── Other styles: free-form prompt written by the model ──
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
