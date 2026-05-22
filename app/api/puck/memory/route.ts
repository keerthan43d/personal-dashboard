import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 503 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { dataContext, weekStart } = await req.json() as {
    dataContext: string;
    weekStart:  string;
  };

  const prompt = `Compress this week's personal dashboard data into a memory doc under 150 words.
Capture only meaningful patterns and facts — not raw data.

Include (skip if empty):
- Emotional arc: mood/energy trend in one sentence
- Wins/ships: up to 3 bullet points
- Problem solved: one line if any
- Media highlights: books/movies rated 4+ stars only
- Habit pulse: one line (e.g. "Sleep good, exercise spotty")
- Work: hours billed + notable project progress

Week: ${weekStart}
DATA:
${dataContext}

Write in plain text, no markdown headers. Be brutally concise.`;

  const completion = await client.chat.completions.create({
    model:      "gpt-4o",
    messages:   [{ role: "user", content: prompt }],
    max_tokens: 300,
  });

  return NextResponse.json({ doc: completion.choices[0].message.content });
}
