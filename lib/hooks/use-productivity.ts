"use client";
import { create } from "zustand";
import { repo } from "@/lib/db";
import type {
  UrgeLog,       UrgeLogInput,
  WeeklyScorecard, WeeklyScorecardInput,
  ShipLog,       ShipLogInput,
} from "@/lib/db/schemas";

interface ProductivityStore {
  urgeLogs:      UrgeLog[];
  scorecard:     WeeklyScorecard | null;
  scorecards:    WeeklyScorecard[];
  shipLogs:      ShipLog[];
  loading:       boolean;

  // Urge Logs
  loadUrgeLogs(entryDate?: string): Promise<void>;
  addUrge(data: UrgeLogInput): Promise<UrgeLog>;
  removeUrge(id: string): Promise<void>;

  // Weekly Scorecard
  loadScorecard(weekStart: string): Promise<void>;
  loadScorecards(): Promise<void>;
  saveScorecard(data: WeeklyScorecardInput): Promise<void>;

  // Ship Logs
  loadShipLogs(opts?: { entryDate?: string; type?: ShipLog["type"] }): Promise<void>;
  addShip(data: ShipLogInput): Promise<ShipLog>;
  editShip(id: string, data: Partial<ShipLogInput>): Promise<void>;
  removeShip(id: string): Promise<void>;
}

export const useProductivity = create<ProductivityStore>((set, get) => ({
  urgeLogs: [],
  scorecard: null,
  scorecards: [],
  shipLogs: [],
  loading: false,

  // ── Urge Logs ───────────────────────────────────────────────
  async loadUrgeLogs(entryDate) {
    set({ loading: true });
    try {
      const urgeLogs = await repo.listUrgeLogs(entryDate ? { entryDate } : undefined);
      set({ urgeLogs });
    } finally {
      set({ loading: false });
    }
  },

  async addUrge(data) {
    const urge = await repo.createUrgeLog(data);
    set((s) => ({ urgeLogs: [urge, ...s.urgeLogs] }));
    return urge;
  },

  async removeUrge(id) {
    await repo.deleteUrgeLog(id);
    set((s) => ({ urgeLogs: s.urgeLogs.filter((u) => u.id !== id) }));
  },

  // ── Weekly Scorecard ────────────────────────────────────────
  async loadScorecard(weekStart) {
    const scorecard = await repo.getWeeklyScorecard(weekStart) ?? null;
    set({ scorecard });
  },

  async loadScorecards() {
    const scorecards = await repo.listWeeklyScorecards();
    set({ scorecards });
  },

  async saveScorecard(data) {
    const existing = get().scorecard;
    const scorecard = await repo.upsertWeeklyScorecard(existing ? { ...data, id: existing.id } : data);
    set({ scorecard });
  },

  // ── Ship Logs ───────────────────────────────────────────────
  async loadShipLogs(opts) {
    set({ loading: true });
    try {
      const shipLogs = await repo.listShipLogs(opts);
      set({ shipLogs });
    } finally {
      set({ loading: false });
    }
  },

  async addShip(data) {
    const ship = await repo.createShipLog(data);
    set((s) => ({ shipLogs: [ship, ...s.shipLogs] }));
    return ship;
  },

  async editShip(id, data) {
    const updated = await repo.updateShipLog(id, data);
    set((s) => ({ shipLogs: s.shipLogs.map((l) => (l.id === id ? updated : l)) }));
  },

  async removeShip(id) {
    await repo.deleteShipLog(id);
    set((s) => ({ shipLogs: s.shipLogs.filter((l) => l.id !== id) }));
  },
}));
