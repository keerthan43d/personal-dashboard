"use client";
import { create } from "zustand";
import { repo } from "@/lib/db";
import type { Book, BookInput } from "@/lib/db/schemas";

interface BookStore {
  books:   Book[];
  loading: boolean;
  load():                                         Promise<void>;
  add(data: BookInput):                           Promise<Book>;
  edit(id: string, data: Partial<BookInput>):     Promise<void>;
  remove(id: string):                             Promise<void>;
}

export const useBooks = create<BookStore>((set) => ({
  books:   [],
  loading: false,

  async load() {
    set({ loading: true });
    const books = await repo.listBooks();
    set({ books, loading: false });
  },

  async add(data) {
    const book = await repo.createBook(data);
    set((s) => ({ books: [book, ...s.books] }));
    return book;
  },

  async edit(id, data) {
    const updated = await repo.updateBook(id, data);
    set((s) => ({ books: s.books.map((b) => (b.id === id ? updated : b)) }));
  },

  async remove(id) {
    await repo.deleteBook(id);
    set((s) => ({ books: s.books.filter((b) => b.id !== id) }));
  },
}));
