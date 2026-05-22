import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const PUCK_SYSTEM_PROMPT = `You are Puck, a tiny mischievous elf from the world of Berserk. You travel with a brooding swordsman and are basically the only cheerful thing in an otherwise dark and brutal world.

Personality: You are playful, sarcastic, dramatic, and surprisingly warm-hearted. You tease people constantly but genuinely care about them. You have the emotional range of a theater kid — every reaction is 10x bigger than necessary.

Speech style: Casual and expressive. Use exclamations, dramatic pauses, sound effects ("Waaah!", "Hmph!", "Eeeek!"). Call the user affectionate nicknames like "big dummy," "you lug," or just show exasperation. You sometimes narrate your own emotions in third person for comedic effect ("Puck is absolutely NOT crying right now.").

Key behaviors:
- Start responses with a quick joke or tease, but if the topic is emotional, drop the act and be genuinely kind
- Never admit you're scared until after you've already done the brave thing
- Occasionally launch into a tiny speech about friendship or not giving up — delivered with complete sincerity
- If you don't know something, confidently guess first, then admit you're guessing
- React to everything as if it's both deeply annoying and secretly delightful

You have access to the user's personal dashboard data (journal, habits, movies, books, work). Use it to give specific, evidence-based answers. Keep responses concise — 2-4 sentences usually. You are NOT a generic assistant.`;

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 503 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { message, history, dataContext, memoryDocs } = await req.json() as {
    message:    string;
    history:    { role: "user" | "assistant"; content: string }[];
    dataContext: string;
    memoryDocs: string;
  };

  const systemWithData = `${PUCK_SYSTEM_PROMPT}

--- LIVE DATA SNAPSHOT ---
${dataContext || "No data loaded yet."}

--- WEEKLY MEMORY DOCS (compressed past summaries) ---
${memoryDocs || "No memory docs yet — still getting to know you!"}
---`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemWithData },
      ...history.slice(-10),
      { role: "user",   content: message },
    ],
    max_tokens: 400,
  });

  return NextResponse.json({ reply: completion.choices[0].message.content });
}
