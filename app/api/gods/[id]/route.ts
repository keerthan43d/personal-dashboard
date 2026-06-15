import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const sb = getSupabaseServer();
  if (!sb) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const [{ data: god, error: ge }, { data: sources, error: se }] = await Promise.all([
    sb.from("marketing_gods").select("*").eq("id", id).single(),
    sb.from("god_sources").select("id, god_id, kind, title, created_at").eq("god_id", id).order("created_at", { ascending: true }),
  ]);

  if (ge) return NextResponse.json({ error: ge.message }, { status: 404 });
  if (se) return NextResponse.json({ error: se.message }, { status: 500 });

  return NextResponse.json({
    god: {
      id: god.id,
      name: god.name,
      title: god.title,
      tagline: god.tagline,
      avatarUrl: god.avatar_url,
      systemInstructions: god.system_instructions,
      createdAt: god.created_at,
    },
    sources: (sources ?? []).map((s) => ({
      id: s.id,
      godId: s.god_id,
      kind: s.kind,
      title: s.title,
      createdAt: s.created_at,
    })),
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const sb = getSupabaseServer();
  if (!sb) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const body = await req.json() as Partial<{
    name: string;
    title: string;
    tagline: string;
    avatarUrl: string;
    systemInstructions: string;
  }>;

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined)               patch.name = body.name.trim();
  if (body.title !== undefined)              patch.title = body.title.trim();
  if (body.tagline !== undefined)            patch.tagline = body.tagline?.trim() || null;
  if (body.avatarUrl !== undefined)          patch.avatar_url = body.avatarUrl?.trim() || null;
  if (body.systemInstructions !== undefined) patch.system_instructions = body.systemInstructions.trim();

  const { data, error } = await sb
    .from("marketing_gods")
    .update(patch)
    .eq("id", id)
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
    },
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const sb = getSupabaseServer();
  if (!sb) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  const { error } = await sb.from("marketing_gods").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
