"use client";
/**
 * Fight Camp V2 — Supabase repository.
 *
 * Replaces mma-repository.ts. Covers the Phase 1 "logging core":
 *   • camps          — fc_camps      (start / length / mode / fight date)
 *   • sessions       — fc_sessions   (one MMA + one gym per day)
 *   • exercises      — fc_exercises  (searchable library)
 *   • foods          — fc_foods      (macros per serving)
 *   • saved meals    — fc_meals      (one-click logging)
 *   • food log       — fc_food_log   (per-day entries)
 *   • check-ins      — fc_checkins   (weight / sleep / soreness / energy)
 *   • settings       — fc_settings   (macro targets)
 *
 * Game layer (XP, boss, fighter OVR, achievements) lands in Phase 2.
 */
import { getSupabase } from "./supabase-client";

const now = () => new Date().toISOString();

function fail(error: { message: string } | null, ctx: string): never {
  throw new Error(`[FightCamp] ${ctx}: ${error?.message ?? "unknown error"}`);
}

// ─── Types ────────────────────────────────────────────────────
export type CampMode = "cut" | "maintain";
export type CampStatus = "active" | "done";

export type Camp = {
  id: string;
  name: string;
  startDate: string;        // yyyy-MM-dd
  lengthDays: number;
  fightDate: string | null; // yyyy-MM-dd
  mode: CampMode;
  weightStart: number | null;
  weightTarget: number | null;
  status: CampStatus;
};

export type SessionKind = "mma" | "gym";
export type SparResult = "win" | "even" | "loss";
export type LearningType = "mistake" | "fix" | "technique";

export type SparRound = { round: number; partner?: string; length?: number; result: SparResult; note?: string };
export type Learning = { text: string; type: LearningType; tags?: string[] };
export type GymSet = { weight: number | null; reps: number | null; isPR?: boolean };
export type GymEntry = { exerciseId: string | null; name: string; muscle?: string; sets: GymSet[] };

export type Session = {
  id: string;
  campId: string | null;
  date: string;              // yyyy-MM-dd
  kind: SessionKind;
  // MMA
  focus: string | null;
  durationMin: number | null;
  effort: number | null;     // 1..10
  sparRounds: SparRound[];
  learnings: Learning[];
  // GYM
  gymEntries: GymEntry[];
  note: string | null;
};
export type SessionInput = Omit<Session, "id">;

export type Exercise = { id: string; name: string; muscle: string | null; isSample: boolean };

export type Food = {
  id: string; name: string; serving: string | null;
  kcal: number; protein: number; carbs: number; fat: number; isSample: boolean;
};

export type MealItem = { name: string; qty: number; kcal: number; protein: number; carbs: number; fat: number };
export type Meal = { id: string; name: string; slot: FoodSlot | null; items: MealItem[]; isSample: boolean };

export type FoodSlot = "breakfast" | "lunch" | "snack" | "dinner" | "meal";
export type FoodEntry = {
  id: string; date: string; slot: FoodSlot; label: string;
  kcal: number; protein: number; carbs: number; fat: number; sort: number;
};
export type FoodEntryInput = Omit<FoodEntry, "id">;

export type Checkin = {
  date: string; weight: number | null; sleepHours: number | null;
  soreness: number | null; energy: number | null;
};

export type Settings = {
  weightUnit: string;
  kcalTarget: number; proteinTarget: number; carbsTarget: number; fatTarget: number;
};

// ─── Row mappers ──────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function campFromRow(r: any): Camp {
  return {
    id: r.id,
    name: r.name,
    startDate: r.start_date,
    lengthDays: r.length_days,
    fightDate: r.fight_date ?? null,
    mode: r.mode,
    weightStart: r.weight_start ?? null,
    weightTarget: r.weight_target ?? null,
    status: r.status,
  };
}

function sessionFromRow(r: any): Session {
  return {
    id: r.id,
    campId: r.camp_id ?? null,
    date: r.log_date,
    kind: r.kind,
    focus: r.focus ?? null,
    durationMin: r.duration_min ?? null,
    effort: r.effort ?? null,
    sparRounds: r.spar_rounds ?? [],
    learnings: r.learnings ?? [],
    gymEntries: r.gym_entries ?? [],
    note: r.note ?? null,
  };
}

function foodFromRow(r: any): Food {
  return {
    id: r.id, name: r.name, serving: r.serving ?? null,
    kcal: Number(r.kcal), protein: Number(r.protein), carbs: Number(r.carbs), fat: Number(r.fat),
    isSample: !!r.is_sample,
  };
}

function entryFromRow(r: any): FoodEntry {
  return {
    id: r.id, date: r.log_date, slot: r.slot, label: r.label,
    kcal: Number(r.kcal), protein: Number(r.protein), carbs: Number(r.carbs), fat: Number(r.fat),
    sort: r.sort ?? 0,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Camps ────────────────────────────────────────────────────
export async function getActiveCamp(): Promise<Camp | null> {
  const { data, error } = await getSupabase()
    .from("fc_camps").select("*").eq("status", "active").maybeSingle();
  if (error) fail(error, "getActiveCamp");
  return data ? campFromRow(data) : null;
}

export async function listCamps(): Promise<Camp[]> {
  const { data, error } = await getSupabase()
    .from("fc_camps").select("*").order("start_date", { ascending: false });
  if (error) fail(error, "listCamps");
  return (data ?? []).map(campFromRow);
}

export async function startCamp(input: {
  name: string; startDate: string; lengthDays: number; mode: CampMode;
  fightDate?: string | null; weightStart?: number | null; weightTarget?: number | null;
}): Promise<Camp> {
  // Close any still-active camp first — only one runs at a time.
  await getSupabase().from("fc_camps").update({ status: "done" }).eq("status", "active");
  const { data, error } = await getSupabase().from("fc_camps").insert({
    name: input.name,
    start_date: input.startDate,
    length_days: input.lengthDays,
    mode: input.mode,
    fight_date: input.fightDate ?? null,
    weight_start: input.weightStart ?? null,
    weight_target: input.weightTarget ?? null,
    status: "active",
  }).select("*").single();
  if (error) fail(error, "startCamp");
  return campFromRow(data);
}

export async function updateCamp(id: string, patch: Partial<{
  name: string; startDate: string; lengthDays: number; mode: CampMode;
  fightDate: string | null; weightStart: number | null; weightTarget: number | null; status: CampStatus;
}>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.startDate !== undefined) row.start_date = patch.startDate;
  if (patch.lengthDays !== undefined) row.length_days = patch.lengthDays;
  if (patch.mode !== undefined) row.mode = patch.mode;
  if (patch.fightDate !== undefined) row.fight_date = patch.fightDate;
  if (patch.weightStart !== undefined) row.weight_start = patch.weightStart;
  if (patch.weightTarget !== undefined) row.weight_target = patch.weightTarget;
  if (patch.status !== undefined) row.status = patch.status;
  const { error } = await getSupabase().from("fc_camps").update(row).eq("id", id);
  if (error) fail(error, "updateCamp");
}

/** Wipe a camp and everything tied to it (sessions cascade). */
export async function deleteCamp(id: string): Promise<void> {
  const { error } = await getSupabase().from("fc_camps").delete().eq("id", id);
  if (error) fail(error, "deleteCamp");
}

// ─── Sessions ─────────────────────────────────────────────────
/** Every session logged within a camp's window — used by the heatmap + stats. */
export async function listSessions(campId: string): Promise<Session[]> {
  const { data, error } = await getSupabase()
    .from("fc_sessions").select("*").eq("camp_id", campId)
    .order("log_date", { ascending: true });
  if (error) fail(error, "listSessions");
  return (data ?? []).map(sessionFromRow);
}

export async function saveSession(s: SessionInput): Promise<Session> {
  const { data, error } = await getSupabase().from("fc_sessions").upsert({
    camp_id: s.campId,
    log_date: s.date,
    kind: s.kind,
    focus: s.focus,
    duration_min: s.durationMin,
    effort: s.effort,
    spar_rounds: s.sparRounds,
    learnings: s.learnings,
    gym_entries: s.gymEntries,
    note: s.note,
    updated_at: now(),
  }, { onConflict: "log_date,kind" }).select("*").single();
  if (error) fail(error, "saveSession");
  return sessionFromRow(data);
}

export async function deleteSession(date: string, kind: SessionKind): Promise<void> {
  const { error } = await getSupabase()
    .from("fc_sessions").delete().eq("log_date", date).eq("kind", kind);
  if (error) fail(error, "deleteSession");
}

// ─── Exercise library ─────────────────────────────────────────
export async function listExercises(): Promise<Exercise[]> {
  const { data, error } = await getSupabase()
    .from("fc_exercises").select("*").order("name", { ascending: true });
  if (error) fail(error, "listExercises");
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string, name: r.name as string,
    muscle: (r.muscle as string) ?? null, isSample: !!r.is_sample,
  }));
}

export async function createExercise(name: string, muscle?: string | null): Promise<Exercise> {
  const { data, error } = await getSupabase()
    .from("fc_exercises").insert({ name, muscle: muscle ?? null }).select("*").single();
  if (error) fail(error, "createExercise");
  return { id: data.id, name: data.name, muscle: data.muscle ?? null, isSample: !!data.is_sample };
}

// ─── Food library ─────────────────────────────────────────────
export async function listFoods(): Promise<Food[]> {
  const { data, error } = await getSupabase()
    .from("fc_foods").select("*").order("name", { ascending: true });
  if (error) fail(error, "listFoods");
  return (data ?? []).map(foodFromRow);
}

export async function createFood(f: Omit<Food, "id" | "isSample">): Promise<Food> {
  const { data, error } = await getSupabase().from("fc_foods").insert({
    name: f.name, serving: f.serving, kcal: f.kcal, protein: f.protein, carbs: f.carbs, fat: f.fat,
  }).select("*").single();
  if (error) fail(error, "createFood");
  return foodFromRow(data);
}

export async function deleteFood(id: string): Promise<void> {
  const { error } = await getSupabase().from("fc_foods").delete().eq("id", id);
  if (error) fail(error, "deleteFood");
}

// ─── Saved meals ──────────────────────────────────────────────
export async function listMeals(): Promise<Meal[]> {
  const { data, error } = await getSupabase()
    .from("fc_meals").select("*").order("created_at", { ascending: true });
  if (error) fail(error, "listMeals");
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string, name: r.name as string, slot: (r.slot as FoodSlot) ?? null,
    items: (r.items as MealItem[]) ?? [], isSample: !!r.is_sample,
  }));
}

export async function createMeal(m: Omit<Meal, "id" | "isSample">): Promise<Meal> {
  const { data, error } = await getSupabase().from("fc_meals").insert({
    name: m.name, slot: m.slot, items: m.items,
  }).select("*").single();
  if (error) fail(error, "createMeal");
  return { id: data.id, name: data.name, slot: data.slot ?? null, items: data.items ?? [], isSample: !!data.is_sample };
}

export async function deleteMeal(id: string): Promise<void> {
  const { error } = await getSupabase().from("fc_meals").delete().eq("id", id);
  if (error) fail(error, "deleteMeal");
}

// ─── Food log ─────────────────────────────────────────────────
export async function listFoodLog(date: string): Promise<FoodEntry[]> {
  const { data, error } = await getSupabase()
    .from("fc_food_log").select("*").eq("log_date", date)
    .order("sort", { ascending: true }).order("created_at", { ascending: true });
  if (error) fail(error, "listFoodLog");
  return (data ?? []).map(entryFromRow);
}

export async function addFoodEntry(e: FoodEntryInput): Promise<FoodEntry> {
  const { data, error } = await getSupabase().from("fc_food_log").insert({
    log_date: e.date, slot: e.slot, label: e.label,
    kcal: e.kcal, protein: e.protein, carbs: e.carbs, fat: e.fat, sort: e.sort,
  }).select("*").single();
  if (error) fail(error, "addFoodEntry");
  return entryFromRow(data);
}

export async function deleteFoodEntry(id: string): Promise<void> {
  const { error } = await getSupabase().from("fc_food_log").delete().eq("id", id);
  if (error) fail(error, "deleteFoodEntry");
}

// ─── Check-ins ────────────────────────────────────────────────
export async function getCheckin(date: string): Promise<Checkin | null> {
  const { data, error } = await getSupabase()
    .from("fc_checkins").select("*").eq("log_date", date).maybeSingle();
  if (error) fail(error, "getCheckin");
  if (!data) return null;
  return {
    date: data.log_date, weight: data.weight ?? null, sleepHours: data.sleep_hours ?? null,
    soreness: data.soreness ?? null, energy: data.energy ?? null,
  };
}

/** Every check-in, oldest first — feeds XP / boss / achievements / cut chart. */
export async function listCheckins(): Promise<Checkin[]> {
  const { data, error } = await getSupabase()
    .from("fc_checkins").select("*").order("log_date", { ascending: true });
  if (error) fail(error, "listCheckins");
  return (data ?? []).map((r: Record<string, unknown>) => ({
    date: r.log_date as string,
    weight: (r.weight as number) ?? null,
    sleepHours: (r.sleep_hours as number) ?? null,
    soreness: (r.soreness as number) ?? null,
    energy: (r.energy as number) ?? null,
  }));
}

/** All food-log entries from a date onward — camp-wide macro roll-ups. */
export async function listFoodSince(startDate: string): Promise<FoodEntry[]> {
  const { data, error } = await getSupabase()
    .from("fc_food_log").select("*").gte("log_date", startDate)
    .order("log_date", { ascending: true });
  if (error) fail(error, "listFoodSince");
  return (data ?? []).map(entryFromRow);
}

/** All check-ins that carry a weight, oldest first — feeds the cut chart / 7-day avg. */
export async function listWeights(): Promise<{ date: string; weight: number }[]> {
  const { data, error } = await getSupabase()
    .from("fc_checkins").select("log_date, weight")
    .not("weight", "is", null).order("log_date", { ascending: true });
  if (error) fail(error, "listWeights");
  return (data ?? []).map((r: Record<string, unknown>) => ({ date: r.log_date as string, weight: Number(r.weight) }));
}

export async function saveCheckin(c: Checkin): Promise<Checkin> {
  const { error } = await getSupabase().from("fc_checkins").upsert({
    log_date: c.date, weight: c.weight, sleep_hours: c.sleepHours,
    soreness: c.soreness, energy: c.energy, updated_at: now(),
  }, { onConflict: "log_date" });
  if (error) fail(error, "saveCheckin");
  return c;
}

// ─── Settings ─────────────────────────────────────────────────
export async function getSettings(): Promise<Settings> {
  const { data, error } = await getSupabase()
    .from("fc_settings").select("*").eq("id", "main").maybeSingle();
  if (error) fail(error, "getSettings");
  if (!data) return { weightUnit: "kg", kcalTarget: 2200, proteinTarget: 160, carbsTarget: 200, fatTarget: 60 };
  return {
    weightUnit: data.weight_unit,
    kcalTarget: Number(data.kcal_target), proteinTarget: Number(data.protein_target),
    carbsTarget: Number(data.carbs_target), fatTarget: Number(data.fat_target),
  };
}

export async function saveSettings(s: Settings): Promise<void> {
  const { error } = await getSupabase().from("fc_settings").upsert({
    id: "main", weight_unit: s.weightUnit,
    kcal_target: s.kcalTarget, protein_target: s.proteinTarget,
    carbs_target: s.carbsTarget, fat_target: s.fatTarget, updated_at: now(),
  }, { onConflict: "id" });
  if (error) fail(error, "saveSettings");
}

// ─── Helpers (last-time / PR) ─────────────────────────────────
/** The most recent gym entry for an exercise strictly before `date`. */
export function lastExerciseEntry(
  sessions: Session[], exerciseId: string | null, name: string, date: string
): { date: string; entry: GymEntry } | null {
  let best: { date: string; entry: GymEntry } | null = null;
  for (const s of sessions) {
    if (s.kind !== "gym" || s.date >= date) continue;
    for (const e of s.gymEntries) {
      const match = exerciseId ? e.exerciseId === exerciseId : e.name.toLowerCase() === name.toLowerCase();
      if (!match) continue;
      if (!best || s.date > best.date) best = { date: s.date, entry: e };
    }
  }
  return best;
}

/** Best (heaviest) single-set weight ever logged for an exercise, before `date`. */
export function exerciseBest(
  sessions: Session[], exerciseId: string | null, name: string, date: string
): number {
  let max = 0;
  for (const s of sessions) {
    if (s.kind !== "gym" || s.date >= date) continue;
    for (const e of s.gymEntries) {
      const match = exerciseId ? e.exerciseId === exerciseId : e.name.toLowerCase() === name.toLowerCase();
      if (!match) continue;
      for (const set of e.sets) if ((set.weight ?? 0) > max) max = set.weight ?? 0;
    }
  }
  return max;
}
