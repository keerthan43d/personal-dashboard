"use client";
import { create } from "zustand";
import { repo } from "@/lib/db";
import type { Movie, MovieInput } from "@/lib/db/schemas";

interface MovieStore {
  movies:  Movie[];
  loading: boolean;
  load():                                          Promise<void>;
  add(data: MovieInput):                           Promise<Movie>;
  edit(id: string, data: Partial<MovieInput>):     Promise<void>;
  remove(id: string):                              Promise<void>;
}

export const useMovies = create<MovieStore>((set) => ({
  movies:  [],
  loading: false,

  async load() {
    set({ loading: true });
    let movies = await repo.listMovies();

    // Retroactive: a rated movie counts as watched — fix legacy watchlist entries
    // (e.g. movies rated before auto-watched shipped). Runs once; after fixing,
    // nothing matches so no further writes happen.
    const toFix = movies.filter((m) => (m.rating ?? 0) > 0 && m.status === "watchlist");
    if (toFix.length) {
      await Promise.all(toFix.map((m) => repo.updateMovie(m.id, { status: "watched" })));
      const fixed = new Set(toFix.map((m) => m.id));
      movies = movies.map((m) => (fixed.has(m.id) ? { ...m, status: "watched" as const } : m));
    }

    set({ movies, loading: false });
  },

  async add(data) {
    const movie = await repo.createMovie(data);
    set((s) => ({ movies: [movie, ...s.movies] }));
    return movie;
  },

  async edit(id, data) {
    const patch = { ...data };
    // Rating a movie means you've watched it — auto-mark watched (and stamp today)
    // unless the caller explicitly set a status. Centralized so every rating entry
    // point (detail page, dialog, cards) behaves the same.
    if ((patch.rating ?? 0) > 0 && patch.status === undefined) {
      patch.status = "watched";
      if (patch.watchedAt === undefined) patch.watchedAt = new Date().toLocaleDateString("en-CA");
    }
    const updated = await repo.updateMovie(id, patch);
    set((s) => ({ movies: s.movies.map((m) => (m.id === id ? updated : m)) }));
  },

  async remove(id) {
    await repo.deleteMovie(id);
    set((s) => ({ movies: s.movies.filter((m) => m.id !== id) }));
  },
}));
