"use client";
import { getSupabase } from "./supabase-client";

const now = () => new Date().toISOString();

function fail(error: { message: string } | null, ctx: string): never {
  throw new Error(`[MMA] ${ctx}: ${error?.message ?? "unknown error"}`);
}

export type Camp = {
  /** yyyy-MM-dd — day 1 of the 90. */
  startDate: string;
};

export type Session = {
  date: string; // yyyy-MM-dd
  disciplines: string[];
  rounds: number;
  intensity: number | null; // 1–5
  note: string;
};

type SessionRow = {
  log_date: string;
  disciplines: string[] | null;
  rounds: number | null;
  intensity: number | null;
  note: string | null;
};

function fromRow(r: SessionRow): Session {
  return {
    date: r.log_date,
    disciplines: r.disciplines ?? [],
    rounds: r.rounds ?? 0,
    intensity: r.intensity ?? null,
    note: r.note ?? "",
  };
}

export async function getCamp(): Promise<Camp | null> {
  const { data, error } = await getSupabase()
    .from("mma_challenge")
    .select("start_date")
    .eq("id", "main")
    .maybeSingle();
  if (error) fail(error, "getCamp");
  return data ? { startDate: (data as { start_date: string }).start_date } : null;
}

export async function startCamp(startDate: string): Promise<Camp> {
  const { error } = await getSupabase()
    .from("mma_challenge")
    .upsert({ id: "main", start_date: startDate, created_at: now() }, { onConflict: "id" });
  if (error) fail(error, "startCamp");
  return { startDate };
}

/** Wipe the camp and every logged session — a clean slate. */
export async function resetCamp(): Promise<void> {
  const { error: e1 } = await getSupabase().from("mma_sessions").delete().neq("log_date", "");
  if (e1) fail(e1, "resetCamp/sessions");
  const { error: e2 } = await getSupabase().from("mma_challenge").delete().eq("id", "main");
  if (e2) fail(e2, "resetCamp/camp");
}

export async function listSessions(): Promise<Session[]> {
  const { data, error } = await getSupabase()
    .from("mma_sessions")
    .select("*")
    .order("log_date", { ascending: true });
  if (error) fail(error, "listSessions");
  return ((data ?? []) as SessionRow[]).map(fromRow);
}

export async function saveSession(s: Session): Promise<Session> {
  const { error } = await getSupabase().from("mma_sessions").upsert(
    {
      log_date: s.date,
      disciplines: s.disciplines,
      rounds: s.rounds,
      intensity: s.intensity,
      note: s.note,
      updated_at: now(),
    },
    { onConflict: "log_date" }
  );
  if (error) fail(error, "saveSession");
  return s;
}

export async function deleteSession(date: string): Promise<void> {
  const { error } = await getSupabase().from("mma_sessions").delete().eq("log_date", date);
  if (error) fail(error, "deleteSession");
}
