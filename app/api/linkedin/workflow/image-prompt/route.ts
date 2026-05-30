import { NextRequest, NextResponse } from "next/server";
import { getOpenRouter, DEFAULT_MODELS } from "@/lib/linkedin/openrouter";

type ImageStyle = "editorial" | "minimalist" | "statement" | "beeple";

const STYLE_DESCRIPTORS: Record<Exclude<ImageStyle, "editorial">, string> = {
  minimalist:
    "minimalist editorial design, lots of negative space, clean geometry, sharp typography if any text appears, premium magazine feel",
  statement:
    "bold typographic quote card, one short punchy line of text as the HERO element in large heavy sans-serif (Poppins/Inter style), high contrast, social-media statement-card layout, the text is the focal point and must be spelled exactly as provided",
  beeple:
    "Beeple Everydays digital art style, surreal cinematic scene, hyper-detailed textures, dystopian scale, dramatic god rays, hyper-realistic rendering",
};

const MOOD_BY_STYLE: Record<Exclude<ImageStyle, "editorial">, string> = {
  minimalist: "calm, premium, confident, breathing room",
  statement: "bold, punchy, confident, scroll-stopping, high-contrast",
  beeple: "epic, dramatic, cinematic, awe-inspiring scale",
};

// ── Editorial "CONTRAST" template ─────────────────────────────────────
// This is the user's best-performing LinkedIn layout, hardcoded so every
// generated image looks like the same clean, premium editorial poster.
// The model only fills the text/subject SLOTS; the look is fixed in code.

type EditorialSlots = {
  headline: string; // big bold purple headline, 1–3 words (often "X MEETS Y")
  subhead: string; // short red uppercase kicker under the headline
  subject: string; // the two real objects to photograph, tied to the post
  label: string; // single uppercase word at the very bottom (e.g. PREMIUM)
};

function buildEditorialPrompt(s: EditorialSlots): string {
  const headline = s.headline.toUpperCase().trim();
  const subhead = s.subhead.toUpperCase().trim();
  const label = s.label.toUpperCase().trim();
  const subject = s.subject.trim();

  return [
    "A premium editorial LinkedIn poster on a seamless soft off-white / light warm-grey background (#f3f2ef) with generous negative space.",
    `TOP: a single heavy uppercase headline "${headline}" centered near the top in deep royal purple, ultra-bold geometric sans-serif (Poppins / Inter Black), large and unignorable.`,
    `Directly beneath it a short uppercase red subhead "${subhead}" in a smaller bold sans-serif.`,
    `CENTER: ${subject}, shown as clean real product photography — one object floating in the upper third and one grounded in the lower-center as the visual anchor, with at least one rendered in bold royal purple.`,
    "SIDES: minimalist flat red line-art illustrations of a hand and forearm reaching in from the left edge and another from the right edge — a single continuous thin red outline with small solid red cuff blocks, editorial doodle style, never photographic.",
    `BOTTOM: a single small uppercase label "${label}" centered at the very bottom in deep royal purple.`,
    "Strict three-color discipline: deep royal purple, one bold red accent, and the light grey background ONLY — no other colors. Spell every word of text exactly as written.",
    "Balanced symmetrical composition, lots of breathing room, premium magazine feel, sharp high detail, portrait 4:5 framing.",
  ].join(" ");
}

function parseSlots(raw: string): EditorialSlots {
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  const json = match ? match[0] : cleaned;
  const parsed = JSON.parse(json) as Partial<EditorialSlots>;
  return {
    headline: parsed.headline?.trim() || "NEW MEETS OLD",
    subhead: parsed.subhead?.trim() || "THE CONTRAST",
    subject:
      parsed.subject?.trim() ||
      "two contrasting objects that represent the post's core idea",
    label: parsed.label?.trim() || "PREMIUM",
  };
}

export async function POST(req: NextRequest) {
  try {
    const { post, style } = await req.json() as {
      post: string;
      style: ImageStyle;
    };

    const openrouter = getOpenRouter();

    // ── Editorial: model fills slots, code assembles the fixed layout ──
    if (style === "editorial") {
      const res = await openrouter.chat.completions.create({
        model: DEFAULT_MODELS.promptWriter,
        messages: [
          {
            role: "system",
            content: `You generate the TEXT and SUBJECT for a fixed editorial poster layout (a "CONTRAST" style card). You do NOT describe layout, colors, or style — those are locked. You only return the content slots as JSON.

Return ONLY a JSON object with these keys:
- "headline": the big bold headline. 1–3 words, uppercase. Prefer a tension/contrast construction like "NEW MEETS OLD", "FAST VS SLOW", "FEAR INTO FUEL". Pull the core idea straight from the post.
- "subhead": a short punchy kicker, max 5 words, uppercase. Reinforces the headline.
- "subject": one short phrase naming TWO real, photographable objects that visually represent the post's two contrasting ideas (e.g. "a vintage leather brogue shoe and a modern purple running sneaker"). Concrete physical objects only — no abstractions, no people.
- "label": a single uppercase word for the bottom, signalling quality or category (e.g. "PREMIUM", "PROVEN", "FOUNDER").

No markdown, no explanation. Just the JSON object.`,
          },
          {
            role: "user",
            content: `Post:\n\n${post.slice(0, 600)}`,
          },
        ],
      });

      const slots = parseSlots(res.choices[0].message.content ?? "");
      return NextResponse.json({ prompt: buildEditorialPrompt(slots) });
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
