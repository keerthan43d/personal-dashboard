"use client";
import { create } from "zustand";
import { repo } from "@/lib/db";
import type { TvShow, TvShowInput } from "@/lib/db/schemas";

interface TvShowStore {
  shows:   TvShow[];
  loading: boolean;
  load():                                           Promise<void>;
  add(data: TvShowInput):                           Promise<TvShow>;
  edit(id: string, data: Partial<TvShowInput>):     Promise<void>;
  remove(id: string):                               Promise<void>;
}

export const useTvShows = create<TvShowStore>((set) => ({
  shows:   [],
  loading: false,

  async load() {
    set({ loading: true });
    const shows = await repo.listTvShows();
    set({ shows, loading: false });
  },

  async add(data) {
    const show = await repo.createTvShow(data);
    set((s) => ({ shows: [show, ...s.shows] }));
    return show;
  },

  async edit(id, data) {
    const updated = await repo.updateTvShow(id, data);
    set((s) => ({ shows: s.shows.map((sh) => (sh.id === id ? updated : sh)) }));
  },

  async remove(id) {
    await repo.deleteTvShow(id);
    set((s) => ({ shows: s.shows.filter((sh) => sh.id !== id) }));
  },
}));
