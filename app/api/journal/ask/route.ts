import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { JournalEntry, ProblemLog } from "@/lib/db/schemas";

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 503 });
  }
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { question, entries, problems } = await req.json() as {
    question: string;
    entries:  JournalEntry[];
    problems: ProblemLog[];
  };

  // Cap at 90 most recent entries; truncate freeWrite for large datasets
  const capped = entries
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 90);

  const entriesText = capped.map((e) => {
    const parts: string[] = [`[${e.date}]`];
    if (e.mood)        parts.push(`Mood: ${e.mood}/5`);
    if (e.energy)      parts.push(`Energy: ${e.energy}/5`);
    if (e.freeWrite)   parts.push(`Write: ${e.freeWrite.slice(0, 500)}`);
    if (e.wins.length) parts.push(`Wins: ${e.wins.join(", ")}`);
    if (e.ideas.length) parts.push(`Ideas: ${e.ideas.join(", ")}`);
    return parts.join(" | ");
  }).join("\n");

  const problemsText = problems.map((p) =>
    `[${p.entryDate}] ${p.title}${p.context ? ` (${p.context})` : ""}` +
    `${p.whatSolvedIt ? ` → Solution: ${p.whatSolvedIt}` : ""}` +
    `${p.tags.length ? ` Tags: ${p.tags.join(", ")}` : ""}`
  ).join("\n");

  const prompt = `You are an assistant helping someone query their own private journal.
Answer their question specifically using evidence from the journal entries and problem log below.
If the answer isn't in the data, say so clearly. Be concise and direct.

QUESTION: ${question}

JOURNAL ENTRIES (most recent first):
${entriesText || "No entries available."}

PROBLEM LOG:
${problemsText || "No problems logged."}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 600,
  });

  return NextResponse.json({ result: completion.choices[0].message.content });
}
