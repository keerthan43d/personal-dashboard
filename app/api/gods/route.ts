import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const sb = getSupabaseServer();
  if (!sb) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const { data: gods, error } = await sb
    .from("marketing_gods")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: counts } = await sb.from("god_sources").select("god_id");
  const countMap: Record<string, number> = {};
  for (const row of counts ?? []) {
    countMap[row.god_id] = (countMap[row.god_id] ?? 0) + 1;
  }

  const result = (gods ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    title: g.title,
    tagline: g.tagline,
    avatarUrl: g.avatar_url,
    systemInstructions: g.system_instructions,
    createdAt: g.created_at,
    sourceCount: countMap[g.id] ?? 0,
  }));

  return NextResponse.json({ gods: result });
}

export async function POST(req: NextRequest) {
  const sb = getSupabaseServer();
  if (!sb) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const body = await req.json() as {
    name: string;
    title?: string;
    tagline?: string;
    avatarUrl?: string;
    systemInstructions?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("marketing_gods")
    .insert({
      name: body.name.trim(),
      title: body.title?.trim() ?? "",
      tagline: body.tagline?.trim() ?? null,
      avatar_url: body.avatarUrl?.trim() ?? null,
      system_instructions: body.systemInstructions?.trim() ?? "",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    god: {
      id: data.id,
      name: data.name,
      title: data.title,
      tagline: data.tagline,
      avatarUrl: data.avatar_url,
      systemInstructions: data.system_instructions,
      createdAt: data.created_at,
      sourceCount: 0,
    },
  }, { status: 201 });
}
