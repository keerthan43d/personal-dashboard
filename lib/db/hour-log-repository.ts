"use client";
import { getSupabase } from "./supabase-client";

const now = () => new Date().toISOString();

function fail(error: { message: string } | null, ctx: string): never {
  throw new Error(`[HourLog] ${ctx}: ${error?.message ?? "unknown error"}`);
}

/** Map of start-hour (as string, e.g. "9") → note for that day. */
export type HourNotes = Record<string, string>;

export async function getHourLog(date: string): Promise<HourNotes> {
  const { data, error } = await getSupabase()
    .from("journal_hour_logs")
    .select("notes")
    .eq("log_date", date)
    .maybeSingle();
  if (error) fail(error, "getHourLog");
  return ((data?.notes as HourNotes | undefined) ?? {});
}

export async function saveHourLog(date: string, notes: HourNotes): Promise<void> {
  const { error } = await getSupabase()
    .from("journal_hour_logs")
    .upsert({ log_date: date, notes, updated_at: now() }, { onConflict: "log_date" });
  if (error) fail(error, "saveHourLog");
}
