"use client";
import { create } from "zustand";
import {
  listTodos,
  createTodo,
  setTodoDone,
  updateTodoText,
  deleteTodo,
  rollOverTodos,
  type Todo,
} from "@/lib/db/todos-repository";

type State = {
  todos: Todo[];
  loaded: boolean;

  /** Load todos and roll any stale incomplete ones forward to `today`. */
  load: (today: string) => Promise<void>;
  add: (text: string, dueDate: string) => Promise<void>;
  toggle: (id: string, today: string) => Promise<void>;
  edit: (id: string, text: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useTodos = create<State>()((set, get) => ({
  todos: [],
  loaded: false,

  load: async (today) => {
    try {
      const todos = await listTodos();
      const stale = todos.filter((t) => !t.done && t.dueDate < today);
      if (stale.length > 0) {
        await rollOverTodos(today);
        for (const t of todos) {
          if (!t.done && t.dueDate < today) t.dueDate = today;
        }
      }
      set({ todos: [...todos], loaded: true });
    } catch (e) {
      console.error("[Todos] load error — migration may not have run yet:", e);
      set({ loaded: true });
    }
  },

  add: async (text, dueDate) => {
    const todo = await createTodo(text, dueDate);
    set((s) => ({ todos: [...s.todos, todo] }));
  },

  toggle: async (id, today) => {
    const current = get().todos.find((t) => t.id === id);
    if (!current) return;
    const updated = await setTodoDone(id, !current.done, today);
    set((s) => ({ todos: s.todos.map((t) => (t.id === id ? updated : t)) }));
  },

  edit: async (id, text) => {
    const updated = await updateTodoText(id, text);
    set((s) => ({ todos: s.todos.map((t) => (t.id === id ? updated : t)) }));
  },

  remove: async (id) => {
    await deleteTodo(id);
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }));
  },
}));
