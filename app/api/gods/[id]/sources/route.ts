import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getSupabaseServer } from "@/lib/supabase-server";
import { chunkText } from "@/lib/gods/ingest";

export const maxDuration = 60;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const sb = getSupabaseServer();
  if (!sb) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const { data, error } = await sb
    .from("god_sources")
    .select("*")
    .eq("god_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    sources: (data ?? []).map((s) => ({
      id: s.id,
      godId: s.god_id,
      kind: s.kind,
      title: s.title,
      content: s.content,
      createdAt: s.created_at,
    })),
  });
}

/** Add a source + automatically chunk and embed it. */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: godId } = await params;
  const sb = getSupabaseServer();
  if (!sb) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 503 });
  }

  const { title, kind, content } = await req.json() as {
    title: string;
    kind: "paste" | "file" | "web";
    content: string;
  };

  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
  }

  // 1. Insert source
  const { data: source, error: se } = await sb
    .from("god_sources")
    .insert({ god_id: godId, kind, title: title.trim(), content: content.trim() })
    .select()
    .single();

  if (se) return NextResponse.json({ error: se.message }, { status: 500 });

  // 2. Chunk + embed (best-effort; don't fail the whole request if embedding fails)
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const chunks = chunkText(content.trim());

    const chunkRows: { god_id: string; source_id: string; content: string; embedding: number[] }[] = [];

    for (const chunk of chunks) {
      const res = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
      });
      chunkRows.push({
        god_id: godId,
        source_id: source.id,
        content: chunk,
        embedding: res.data[0].embedding,
      });
    }

    if (chunkRows.length > 0) {
      await sb.from("god_chunks").insert(chunkRows);
    }
  } catch (err) {
    // Embedding failure is non-fatal — chat will fall back to no context
    console.error("[gods/sources] embed error:", err);
  }

  return NextResponse.json({
    source: {
      id: source.id,
      godId: source.god_id,
      kind: source.kind,
      title: source.title,
      createdAt: source.created_at,
    },
  }, { status: 201 });
}
