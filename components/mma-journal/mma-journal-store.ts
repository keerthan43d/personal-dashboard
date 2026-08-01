"use client";
import { create } from "zustand";
import {
  listMistakes,
  createMistake,
  updateMistake,
  deleteMistake,
  listVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  listMetrics,
  createMetric,
  deleteMetric,
  type MmaMistake,
  type MmaMistakeInput,
  type MmaVideo,
  type MmaVideoInput,
  type MmaMetric,
  type MmaMetricInput,
} from "@/lib/db/mma-journal-repository";

type State = {
  mistakes: MmaMistake[];
  videos: MmaVideo[];
  metrics: MmaMetric[];
  loaded: boolean;

  load: () => Promise<void>;

  addMistake: (input: MmaMistakeInput) => Promise<void>;
  editMistake: (id: string, patch: Partial<MmaMistakeInput>) => Promise<void>;
  removeMistake: (id: string) => Promise<void>;

  addVideo: (input: MmaVideoInput) => Promise<void>;
  editVideo: (id: string, patch: Partial<MmaVideoInput>) => Promise<void>;
  removeVideo: (id: string) => Promise<void>;

  addMetric: (input: MmaMetricInput) => Promise<void>;
  removeMetric: (id: string) => Promise<void>;
};

export const useMmaJournal = create<State>()((set) => ({
  mistakes: [],
  videos: [],
  metrics: [],
  loaded: false,

  load: async () => {
    const [mistakes, videos, metrics] = await Promise.all([
      listMistakes(),
      listVideos(),
      listMetrics(),
    ]);
    set({ mistakes, videos, metrics, loaded: true });
  },

  addMistake: async (input) => {
    const row = await createMistake(input);
    set((s) => ({ mistakes: [row, ...s.mistakes] }));
  },
  editMistake: async (id, patch) => {
    const row = await updateMistake(id, patch);
    set((s) => ({ mistakes: s.mistakes.map((m) => (m.id === id ? row : m)) }));
  },
  removeMistake: async (id) => {
    await deleteMistake(id);
    set((s) => ({ mistakes: s.mistakes.filter((m) => m.id !== id) }));
  },

  addVideo: async (input) => {
    const row = await createVideo(input);
    set((s) => ({ videos: [row, ...s.videos] }));
  },
  editVideo: async (id, patch) => {
    const row = await updateVideo(id, patch);
    set((s) => ({ videos: s.videos.map((v) => (v.id === id ? row : v)) }));
  },
  removeVideo: async (id) => {
    await deleteVideo(id);
    set((s) => ({ videos: s.videos.filter((v) => v.id !== id) }));
  },

  addMetric: async (input) => {
    const row = await createMetric(input);
    set((s) => ({
      metrics: [...s.metrics, row].sort((a, b) => a.date.localeCompare(b.date)),
    }));
  },
  removeMetric: async (id) => {
    await deleteMetric(id);
    set((s) => ({ metrics: s.metrics.filter((m) => m.id !== id) }));
  },
}));

// ─── Rating labels (agility + power self-ratings 1..10) ───────
export const AGILITY_LABELS: [number, string][] = [
  [2, "Rock 🪨"],
  [4, "Stiff"],
  [6, "Loosening up"],
  [8, "Fluid"],
  [10, "Cat-quick ⚡"],
];
export const POWER_LABELS: [number, string][] = [
  [2, "Feather"],
  [4, "Building"],
  [6, "Solid"],
  [8, "Heavy hands"],
  [10, "Knockout 💥"],
];

export function ratingLabel(value: number, labels: [number, string][]): string {
  for (const [ceil, label] of labels) if (value <= ceil) return label;
  return labels[labels.length - 1][1];
}
