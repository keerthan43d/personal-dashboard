import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuid } from "uuid";
import { getOpenRouter, DEFAULT_MODELS } from "@/lib/linkedin/openrouter";

function getSupabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key);
}

const TOPIC_LANES = ["Marketing", "AI in Marketing", "General AI"] as const;

export async function POST() {
  try {
    const openrouter = getOpenRouter();
    const supabase = getSupabaseServer();

    const newsResults = await Promise.all(
      TOPIC_LANES.map(async (lane) => {
        const res = await openrouter.chat.completions.create({
          model: DEFAULT_MODELS.trending,
          messages: [
            {
              role: "user",
              content: `What are the biggest ${lane.toLowerCase()} news stories and developments from the last 24 hours? Include summaries and source URLs. Focus on stories that would spark discussion on LinkedIn — opinions, controversies, surprising data, major shifts. Skip generic press releases.`,
            },
          ],
        });
        return { lane, content: res.choices[0].message.content ?? "" };
      })
    );

    const bundled = newsResults
      .map((r) => `=== ${r.lane} ===\n${r.content}`)
      .join("\n\n");

    const pickResponse = await openrouter.chat.completions.create({
      model: DEFAULT_MODELS.post,
      messages: [
        {
          role: "system",
          content: `You are a content strategist. From the news stories provided, pick the 5 most LinkedIn-worthy for someone who posts about marketing and AI. Prioritize stories that spark opinion, not press releases.

Return ONLY valid JSON — no markdown, no code fences. Use this exact structure:
[
  {
    "headline": "...",
    "summary": "2-3 sentence summary",
    "sourceUrl": "https://...",
    "topicTag": "Marketing" | "AI in Marketing" | "General AI"
  }
]`,
        },
        { role: "user", content: bundled },
      ],
    });

    const raw = pickResponse.choices[0].message.content ?? "[]";
    const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let topics: Array<{
      headline: string;
      summary: string;
      sourceUrl: string;
      topicTag: string;
    }>;

    try {
      topics = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response", raw: cleaned },
        { status: 500 }
      );
    }

    await supabase
      .from("linkedin_trending_topics")
      .delete()
      .lt(
        "fetched_at",
        new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      );

    const now = new Date().toISOString();
    const rows = topics.map((t) => ({
      id: uuid(),
      headline: t.headline,
      summary: t.summary,
      source_url: t.sourceUrl || "",
      topic_tag: t.topicTag,
      fetched_at: now,
      picked: false,
    }));

    const { error: insertError } = await supabase
      .from("linkedin_trending_topics")
      .insert(rows);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ topics: rows, fetchedAt: now });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
