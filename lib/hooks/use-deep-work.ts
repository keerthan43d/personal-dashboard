"use client";
import { create } from "zustand";
import { repo } from "@/lib/db";
import type { DeepWorkLog, DeepWorkLogInput } from "@/lib/db/schemas";

interface TimerState {
  running:     boolean;
  paused:      boolean;
  mode:        "stopwatch" | "pomodoro";
  category:    "project" | "client";
  description: string;
  startedAt:   number | null;   // epoch ms
  pausedAt:    number | null;   // epoch ms (when paused)
  elapsed:     number;          // accumulated ms (for pause/resume)
  pomoDuration: number;         // pomodoro target in minutes
}

interface DeepWorkStore {
  logs:    DeepWorkLog[];
  loading: boolean;
  timer:   TimerState;

  loadLogs(entryDate?: string): Promise<void>;
  createLog(data: DeepWorkLogInput): Promise<DeepWorkLog>;
  deleteLog(id: string): Promise<void>;

  setTimerField<K extends keyof TimerState>(key: K, value: TimerState[K]): void;
  startTimer(): void;
  pauseTimer(): void;
  resumeTimer(): void;
  stopTimer(entryDate: string): Promise<DeepWorkLog | null>;
  resetTimer(): void;
}

const DEFAULT_TIMER: TimerState = {
  running: false, paused: false,
  mode: "stopwatch", category: "project",
  description: "", startedAt: null, pausedAt: null,
  elapsed: 0, pomoDuration: 25,
};

function loadTimerFromStorage(): TimerState {
  if (typeof window === "undefined") return DEFAULT_TIMER;
  try {
    const raw = localStorage.getItem("cc-deep-work-timer");
    if (raw) return { ...DEFAULT_TIMER, ...JSON.parse(raw) };
  } catch { /* noop */ }
  return DEFAULT_TIMER;
}

function saveTimerToStorage(t: TimerState) {
  if (typeof window === "undefined") return;
  localStorage.setItem("cc-deep-work-timer", JSON.stringify(t));
}

export const useDeepWork = create<DeepWorkStore>((set, get) => ({
  logs: [],
  loading: false,
  timer: loadTimerFromStorage(),

  async loadLogs(entryDate) {
    set({ loading: true });
    try {
      const logs = await repo.listDeepWorkLogs(entryDate ? { entryDate } : undefined);
      set({ logs });
    } finally {
      set({ loading: false });
    }
  },

  async createLog(data) {
    const log = await repo.createDeepWorkLog(data);
    set((s) => ({ logs: [log, ...s.logs] }));
    return log;
  },

  async deleteLog(id) {
    await repo.deleteDeepWorkLog(id);
    set((s) => ({ logs: s.logs.filter((l) => l.id !== id) }));
  },

  setTimerField(key, value) {
    set((s) => {
      const timer = { ...s.timer, [key]: value };
      saveTimerToStorage(timer);
      return { timer };
    });
  },

  startTimer() {
    set((s) => {
      const timer: TimerState = {
        ...s.timer,
        running: true, paused: false,
        startedAt: Date.now(), pausedAt: null, elapsed: 0,
      };
      saveTimerToStorage(timer);
      return { timer };
    });
  },

  pauseTimer() {
    set((s) => {
      const now = Date.now();
      const addedElapsed = s.timer.startedAt ? now - s.timer.startedAt : 0;
      const timer: TimerState = {
        ...s.timer,
        paused: true, running: false,
        pausedAt: now,
        elapsed: s.timer.elapsed + addedElapsed,
        startedAt: null,
      };
      saveTimerToStorage(timer);
      return { timer };
    });
  },

  resumeTimer() {
    set((s) => {
      const timer: TimerState = {
        ...s.timer,
        running: true, paused: false,
        startedAt: Date.now(), pausedAt: null,
      };
      saveTimerToStorage(timer);
      return { timer };
    });
  },

  async stopTimer(entryDate) {
    const { timer } = get();
    const now = Date.now();
    const totalMs = timer.elapsed + (timer.startedAt ? now - timer.startedAt : 0);
    const durationMinutes = Math.round(totalMs / 60000);

    if (durationMinutes < 1) {
      get().resetTimer();
      return null;
    }

    const startDate = new Date(now - totalMs);
    const startTime = `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`;
    const endDate = new Date(now);
    const endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;

    const log = await get().createLog({
      entryDate,
      startTime,
      endTime,
      durationMinutes,
      description: timer.description || undefined,
      category: timer.category,
      mode: timer.mode,
    });

    get().resetTimer();
    return log;
  },

  resetTimer() {
    set(() => {
      saveTimerToStorage(DEFAULT_TIMER);
      return { timer: DEFAULT_TIMER };
    });
  },
}));
