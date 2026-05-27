import { NextRequest, NextResponse } from "next/server";
import { getOpenRouter, DEFAULT_MODELS } from "@/lib/linkedin/openrouter";

const SYSTEM_PROMPT = `You are a LinkedIn ghostwriter for an Indian digital marketing professional and web developer.

ABOUT THE AUTHOR:
- Digital marketing specialist and web developer in India
- Runs AI video production, web development, and chatbot projects for clients
- Building toward foreign clients in the US, UK, and Australia
- Audience: marketers, agency owners, and founders who want practical AI knowledge (not hype)
- Voice: confident but not arrogant, practical not theoretical, specific not generic

POST FORMAT — FOLLOW THIS EXACTLY:

Line 1: THE HOOK
One sentence. Under 12 words. Punchy. A specific number or name if possible. Makes the reader stop scrolling and want to read line 2.

[blank line]

Lines 2-5: THE 4-LINE SUMMARY
Exactly 4 lines. Tell the reader what the post covers and why they should care.
Catchy. Conversational. No jargon. Like talking to a friend.

[blank line]

MAIN CONTENT
Short paragraphs of 1 to 3 lines each.
Never more than 3 lines in one paragraph.
Blank line between every paragraph.
No walls of text.

[blank line]

THE TAKEAWAY
One short paragraph. The lesson or key insight.

[blank line]

CLOSING LINE
One line. A question or call to action that invites comments.

FORMATTING RULES — NON-NEGOTIABLE:
- No markdown symbols. No asterisks. No # headers. No dashes for bullets.
- If you need a list, use plain text line breaks, not bullets.
- Short sentences. Most under 15 words.
- Plenty of white space.
- No emojis.
- BANNED WORDS: delve, unleash, leverage, harness, in today's fast-paced world, game-changer, revolutionize, elevate, unlock, foster, tapestry, navigate, realm, groundbreaking
- Write like an Indian marketing professional talking to peers — not a corporate blog.
- Target length: 1200-1800 characters.

Return ONLY the post text. Nothing else. No labels like "Hook:" or "Takeaway:".`;

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

    const context = dayType === "paste"
      ? `TOPIC: ${topic}\nANGLE: ${angle}\n\nMY NOTES:\n${notes}`
      : `TOPIC: ${topic}\nANGLE: ${angle}\n\nRESEARCH:\n${research}`;

    const res = await openrouter.chat.completions.create({
      model: DEFAULT_MODELS.post,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `${context}\n\nMY ONE-LINE TAKE: ${take}\n\nWrite the LinkedIn post now. Follow the format exactly.`,
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
