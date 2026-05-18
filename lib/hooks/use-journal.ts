"use client";
import { create } from "zustand";
import { repo } from "@/lib/db";
import { DEFAULT_HABITS } from "@/lib/journal-constants";

// Guard against StrictMode double-invocation seeding
let _habitSeedInProgress = false;
import type {
  JournalEntry, JournalEntryInput,
  ProblemLog, ProblemLogInput,
  JournalHabit, JournalHabitInput,
} from "@/lib/db/schemas";

interface JournalStore {
  entries:      JournalEntry[];
  problems:     ProblemLog[];
  habits:       JournalHabit[];
  loading:      boolean;
  currentEntry: JournalEntry | null;

  loadEntries(opts?: { since?: string; until?: string }): Promise<void>;
  loadEntry(date: string): Promise<void>;
  saveEntry(data: JournalEntryInput): Promise<void>;
  deleteEntry(id: string): Promise<void>;

  loadProblems(opts?: { entryDate?: string; tag?: string; search?: string }): Promise<void>;
  addProblem(data: ProblemLogInput): Promise<ProblemLog>;
  editProblem(id: string, data: Partial<ProblemLogInput>): Promise<void>;
  removeProblem(id: string): Promise<void>;

  loadHabits(): Promise<void>;
  addHabit(data: JournalHabitInput): Promise<JournalHabit>;
  editHabit(id: string, data: Partial<JournalHabitInput>): Promise<void>;
  removeHabit(id: string): Promise<void>;
  reorderHabits(orderedIds: string[]): Promise<void>;
}

export const useJournal = create<JournalStore>((set, get) => ({
  entries:      [],
  problems:     [],
  habits:       [],
  loading:      false,
  currentEntry: null,

  async loadEntries(opts) {
    set({ loading: true });
    try {
      const entries = await repo.listJournalEntries(opts);
      set({ entries });
    } finally {
      set({ loading: false });
    }
  },

  async loadEntry(date) {
    set({ loading: true });
    try {
      // Ensure habits exist; seed defaults on first use (guard prevents StrictMode double-seed)
      const habits = await repo.listJournalHabits();
      if (habits.length === 0 && !_habitSeedInProgress) {
        _habitSeedInProgress = true;
        try {
          const seeded = await Promise.all(
            DEFAULT_HABITS.map((name, i) =>
              repo.createJournalHabit({ name, order: i, active: true })
            )
          );
          set({ habits: seeded });
        } finally {
          _habitSeedInProgress = false;
        }
      } else if (habits.length > 0) {
        // Deduplicate by name in case of any prior double-seed
        const seen = new Set<string>();
        set({ habits: habits.filter((h) => !seen.has(h.name) && seen.add(h.name) !== undefined) });
      }
      const entry = await repo.getJournalEntry(date);
      set({ currentEntry: entry ?? null });
    } finally {
      set({ loading: false });
    }
  },

  async saveEntry(data) {
    const saved = await repo.upsertJournalEntry(data);
    set((s) => ({
      currentEntry: saved,
      entries: s.entries.some((e) => e.date === saved.date)
        ? s.entries.map((e) => (e.date === saved.date ? saved : e))
        : [saved, ...s.entries],
    }));
  },

  async deleteEntry(id) {
    await repo.deleteJournalEntry(id);
    set((s) => ({
      entries: s.entries.filter((e) => e.id !== id),
      currentEntry: s.currentEntry?.id === id ? null : s.currentEntry,
    }));
  },

  async loadProblems(opts) {
    set({ loading: true });
    try {
      const problems = await repo.listProblemLogs(opts);
      set({ problems });
    } finally {
      set({ loading: false });
    }
  },

  async addProblem(data) {
    const problem = await repo.createProblemLog(data);
    set((s) => ({ problems: [problem, ...s.problems] }));
    return problem;
  },

  async editProblem(id, data) {
    const updated = await repo.updateProblemLog(id, data);
    set((s) => ({
      problems: s.problems.map((p) => (p.id === id ? updated : p)),
    }));
  },

  async removeProblem(id) {
    await repo.deleteProblemLog(id);
    set((s) => ({ problems: s.problems.filter((p) => p.id !== id) }));
  },

  async loadHabits() {
    const all = await repo.listJournalHabits();
    const seen = new Set<string>();
    set({ habits: all.filter((h) => !seen.has(h.name) && seen.add(h.name) !== undefined) });
  },

  async addHabit(data) {
    const habit = await repo.createJournalHabit(data);
    set((s) => ({ habits: [...s.habits, habit] }));
    return habit;
  },

  async editHabit(id, data) {
    const updated = await repo.updateJournalHabit(id, data);
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? updated : h)),
    }));
  },

  async removeHabit(id) {
    await repo.deleteJournalHabit(id);
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }));
  },

  async reorderHabits(orderedIds) {
    await repo.reorderJournalHabits(orderedIds);
    const reordered = orderedIds
      .map((id, i) => {
        const h = get().habits.find((h) => h.id === id);
        return h ? { ...h, order: i } : null;
      })
      .filter(Boolean) as JournalHabit[];
    set({ habits: reordered });
  },
}));
