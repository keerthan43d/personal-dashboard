"use client";
import { create } from "zustand";
import { repo } from "@/lib/db";
import type { OneProject, OneProjectInput } from "@/lib/db/schemas";

interface OneProjectStore {
  project:  OneProject | null;
  loading:  boolean;
  load():   Promise<void>;
  create(data: OneProjectInput): Promise<OneProject>;
  update(id: string, data: Partial<OneProjectInput>): Promise<void>;
  remove(id: string): Promise<void>;
}

export const useOneProject = create<OneProjectStore>((set) => ({
  project: null,
  loading: false,

  async load() {
    set({ loading: true });
    try {
      const project = await repo.getActiveOneProject() ?? null;
      set({ project });
    } finally {
      set({ loading: false });
    }
  },

  async create(data) {
    const project = await repo.createOneProject(data);
    set({ project });
    return project;
  },

  async update(id, data) {
    const updated = await repo.updateOneProject(id, data);
    set({ project: updated });
  },

  async remove(id) {
    await repo.deleteOneProject(id);
    set({ project: null });
  },
}));
