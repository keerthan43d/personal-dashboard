import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { subDays, format } from "date-fns";
import type { JournalEntry, ProblemLog } from "@/lib/db/schemas";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { entries, problems } = await req.json() as {
    entries:  JournalEntry[];
    problems: ProblemLog[];
  };

  const since = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const recent = entries
    .filter((e) => e.date >= since)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-90);

  const recentProblems = problems.filter((p) => p.entryDate >= since);

  const entriesText = recent.map((e) => {
    const parts: string[] = [`[${e.date}]`];
    if (e.mood)         parts.push(`Mood: ${e.mood}/5`);
    if (e.energy)       parts.push(`Energy: ${e.energy}/5`);
    if (e.freeWrite)    parts.push(`Write: ${e.freeWrite.slice(0, 500)}`);
    if (e.wins.length)  parts.push(`Wins: ${e.wins.join(", ")}`);
    return parts.join(" | ");
  }).join("\n");

  const problemsText = recentProblems.map((p) =>
    `[${p.entryDate}] ${p.title}${p.whatSolvedIt ? ` → ${p.whatSolvedIt}` : ""}`
  ).join("\n");

  const prompt = `You are reviewing someone's private journal from the past 7 days.
Provide a thoughtful weekly digest covering:
1. What they worked on and accomplished
2. Mood and energy patterns
3. Problems they solved
4. Any recurring themes or concerns
5. 2-3 specific, actionable suggestions for next week

Be direct, warm, and specific. Under 300 words.

ENTRIES:
${entriesText || "No entries this week."}

PROBLEMS SOLVED:
${problemsText || "None logged."}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 600,
  });

  return NextResponse.json({ result: completion.choices[0].message.content });
}
