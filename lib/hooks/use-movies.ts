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
    const movies = await repo.listMovies();
    set({ movies, loading: false });
  },

  async add(data) {
    const movie = await repo.createMovie(data);
    set((s) => ({ movies: [movie, ...s.movies] }));
    return movie;
  },

  async edit(id, data) {
    const updated = await repo.updateMovie(id, data);
    set((s) => ({ movies: s.movies.map((m) => (m.id === id ? updated : m)) }));
  },

  async remove(id) {
    await repo.deleteMovie(id);
    set((s) => ({ movies: s.movies.filter((m) => m.id !== id) }));
  },
}));
