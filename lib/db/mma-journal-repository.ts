"use client";
/**
 * MMA Journal (skills tracker) — self-contained Dexie (IndexedDB) store.
 *
 * Distinct from mma-repository.ts (the Supabase 90-day Fight Camp tracker that
 * lives inside the Journal tab). This one is local-first and powers the
 * standalone "MMA Journal" tab. Three tables:
 *   • mistakes  — mistakes to work on + how to fix them
 *   • videos    — saved YouTube technique lessons
 *   • metrics   — weight / agility / power measurements over time
 */
import Dexie, { type Table } from "dexie";
import { v4 as uuid } from "uuid";

// ─── Categories (shared by mistakes + videos) ─────────────────
export const MMA_CATEGORIES = [
  "Striking",
  "Boxing",
  "Muay Thai",
  "Kickboxing",
  "Wrestling",
  "BJJ / Grappling",
  "Clinch",
  "Defense",
  "Footwork",
  "Cardio",
  "Strength & Power",
  "Agility",
  "Mental",
  "Other",
] as const;
export type MmaCategory = (typeof MMA_CATEGORIES)[number];

// ─── Types ────────────────────────────────────────────────────
export type MistakeStatus = "working" | "fixed";

export type MmaMistake = {
  id: string;
  date: string; // YYYY-MM-DD
  category: MmaCategory;
  title: string;
  whatHappened?: string;
  howToFix?: string;
  status: MistakeStatus;
  createdAt: string;
  updatedAt: string;
};
export type MmaMistakeInput = Omit<MmaMistake, "id" | "createdAt" | "updatedAt">;

export type MmaVideo = {
  id: string;
  url: string;
  title: string;
  category: MmaCategory;
  notes?: string;
  createdAt: string;
};
export type MmaVideoInput = Omit<MmaVideo, "id" | "createdAt">;

export type MetricType = "weight" | "agility" | "power";
export type WeightUnit = "kg" | "lb";

export type MmaMetric = {
  id: string;
  date: string; // YYYY-MM-DD
  type: MetricType;
  value: number; // weight -> kg|lb ; agility|power -> 1..10
  unit?: WeightUnit; // only for weight
  note?: string;
  createdAt: string;
};
export type MmaMetricInput = Omit<MmaMetric, "id" | "createdAt">;

// ─── Dexie schema ─────────────────────────────────────────────
class MmaJournalDB extends Dexie {
  mistakes!: Table<MmaMistake>;
  videos!: Table<MmaVideo>;
  metrics!: Table<MmaMetric>;

  constructor() {
    super("MmaJournalDB");
    this.version(1).stores({
      mistakes: "id, date, status, category, createdAt",
      videos: "id, category, createdAt",
      metrics: "id, type, date, createdAt",
    });
  }
}

export const mmaDb = new MmaJournalDB();

const now = () => new Date().toISOString();

// ─── Mistakes ─────────────────────────────────────────────────
export async function listMistakes(): Promise<MmaMistake[]> {
  const all = await mmaDb.mistakes.toArray();
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createMistake(input: MmaMistakeInput): Promise<MmaMistake> {
  const row: MmaMistake = { ...input, id: uuid(), createdAt: now(), updatedAt: now() };
  await mmaDb.mistakes.add(row);
  return row;
}

export async function updateMistake(
  id: string,
  patch: Partial<MmaMistakeInput>
): Promise<MmaMistake> {
  await mmaDb.mistakes.update(id, { ...patch, updatedAt: now() });
  return (await mmaDb.mistakes.get(id))!;
}

export async function deleteMistake(id: string): Promise<void> {
  await mmaDb.mistakes.delete(id);
}

// ─── Videos ───────────────────────────────────────────────────
export async function listVideos(): Promise<MmaVideo[]> {
  const all = await mmaDb.videos.toArray();
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createVideo(input: MmaVideoInput): Promise<MmaVideo> {
  const row: MmaVideo = { ...input, id: uuid(), createdAt: now() };
  await mmaDb.videos.add(row);
  return row;
}

export async function updateVideo(
  id: string,
  patch: Partial<MmaVideoInput>
): Promise<MmaVideo> {
  await mmaDb.videos.update(id, patch);
  return (await mmaDb.videos.get(id))!;
}

export async function deleteVideo(id: string): Promise<void> {
  await mmaDb.videos.delete(id);
}

// ─── Metrics ──────────────────────────────────────────────────
export async function listMetrics(): Promise<MmaMetric[]> {
  const all = await mmaDb.metrics.toArray();
  return all.sort((a, b) => a.date.localeCompare(b.date));
}

export async function createMetric(input: MmaMetricInput): Promise<MmaMetric> {
  const row: MmaMetric = { ...input, id: uuid(), createdAt: now() };
  await mmaDb.metrics.add(row);
  return row;
}

export async function deleteMetric(id: string): Promise<void> {
  await mmaDb.metrics.delete(id);
}

// ─── YouTube helpers ──────────────────────────────────────────
/** Pull the 11-char video id out of any common YouTube URL shape. */
export function youtubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?(?:.*&)?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/live\/)([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

export function youtubeThumb(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
