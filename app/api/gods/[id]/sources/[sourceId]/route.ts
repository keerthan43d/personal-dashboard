import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

type Ctx = { params: Promise<{ id: string; sourceId: string }> };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { sourceId } = await params;
  const sb = getSupabaseServer();
  if (!sb) return NextResponse.json({ error: "DB not configured" }, { status: 503 });

  // god_chunks cascade-delete automatically via FK
  const { error } = await sb.from("god_sources").delete().eq("id", sourceId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
