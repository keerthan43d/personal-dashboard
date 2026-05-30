import { NextRequest, NextResponse } from "next/server";
import { getOpenRouter, DEFAULT_MODELS } from "@/lib/linkedin/openrouter";

// Expands a news headline + snippet into fuller research the post generator
// can ground on. Uses Perplexity sonar (it can search the live web). Only runs
// when the user clicks "Write a post", so the cost is on-demand.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { title, link, snippet, source } = await req.json() as {
      title: string;
      link?: string;
      snippet?: string;
      source?: string;
    };

    if (!title?.trim()) {
      return NextResponse.json({ error: "Missing article title" }, { status: 400 });
    }

    const openrouter = getOpenRouter();

    const res = await openrouter.chat.completions.create({
      model: DEFAULT_MODELS.trending, // perplexity/sonar — live web access
      messages: [
        {
          role: "user",
          content: `Research this news item so a marketing professional can write a sharp LinkedIn post about it.

HEADLINE: ${title}
${source ? `SOURCE: ${source}` : ""}
${link ? `URL: ${link}` : ""}
${snippet ? `SUMMARY: ${snippet}` : ""}

Find and report, specifically and factually:
- What happened, and when (be precise with dates)
- Who is involved (companies, people, products)
- The key numbers, quotes, or announcements
- Context and why it matters for marketing / business
- Different perspectives or any criticism
- Source URLs

Be specific and recent. Do NOT invent facts — only report what you can verify. Plain text, no markdown headers.`,
        },
      ],
    });

    const research = res.choices[0].message.content?.trim() ?? "";
    return NextResponse.json({ research });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Enrich failed" },
      { status: 500 }
    );
  }
}
