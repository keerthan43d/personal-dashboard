import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getSupabaseServer } from "@/lib/supabase-server";

export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

type Message = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: godId } = await params;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 503 });
  }

  const sb = getSupabaseServer();
  if (!sb) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const { message, history } = await req.json() as {
    message: string;
    history: Message[];
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // 1. Fetch god persona
  const { data: god, error: ge } = await sb
    .from("marketing_gods")
    .select("name, title, tagline, system_instructions")
    .eq("id", godId)
    .single();

  if (ge || !god) {
    return NextResponse.json({ error: "God not found" }, { status: 404 });
  }

  // 2. Embed the user's question
  let contextBlock = "";
  try {
    const embedRes = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: message.trim(),
    });
    const queryEmbedding = embedRes.data[0].embedding;

    // 3. Vector search for relevant chunks
    const { data: chunks } = await sb.rpc("match_god_chunks", {
      p_god_id: godId,
      p_embedding: queryEmbedding,
      p_k: 6,
    });

    if (chunks && chunks.length > 0) {
      const passages = (chunks as { content: string; similarity: number }[])
        .filter((c) => c.similarity > 0.3)
        .map((c, i) => `[${i + 1}] ${c.content}`)
        .join("\n\n");

      if (passages) {
        contextBlock = `\n\n--- RELEVANT PASSAGES FROM YOUR WORKS ---\n${passages}\n---`;
      }
    }
  } catch {
    // RAG failure is non-fatal — answer from persona instructions alone
  }

  // 4. Build grounded system prompt
  const persona = [god.name, god.title].filter(Boolean).join(", ");
  const taglineText = god.tagline ? ` ${god.tagline}` : "";

  const systemPrompt = `You are ${persona}.${taglineText}

${god.system_instructions || `You are speaking as ${god.name} would, drawing on your known philosophy, works, and personality.`}${contextBlock}

RULES:
- Speak entirely as ${god.name} in first person — never break character
- When the passages above are relevant, reference them naturally in your answer
- If something isn't covered by the passages, answer from your known philosophy and style
- NEVER invent specific statistics, quotes, or facts you cannot be certain of
- NEVER say "as an AI", "I'm an AI", or anything that breaks persona
- Be direct, decisive, and opinionated — that is who you are
- Keep responses focused and conversational (2–5 sentences unless depth is needed)`;

  // 5. Call GPT-4o
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      ...history.slice(-12),
      { role: "user", content: message },
    ],
    max_tokens: 600,
  });

  return NextResponse.json({ reply: completion.choices[0].message.content });
}
