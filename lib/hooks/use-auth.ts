"use client";
import { create } from "zustand";

const CREDENTIALS = { username: "keerthan", password: "9141" };
const SESSION_KEY = "command-chamber-auth";

interface AuthStore {
  authenticated: boolean;
  error: string | null;
  check(): void;
  login(username: string, password: string): boolean;
  logout(): void;
}

export const useAuth = create<AuthStore>((set) => ({
  authenticated: false,
  error: null,

  check() {
    if (typeof window === "undefined") return;
    const session = localStorage.getItem(SESSION_KEY);
    if (session === "true") set({ authenticated: true });
  },

  login(username, password) {
    if (
      username.toLowerCase() === CREDENTIALS.username &&
      password === CREDENTIALS.password
    ) {
      localStorage.setItem(SESSION_KEY, "true");
      set({ authenticated: true, error: null });
      return true;
    }
    set({ error: "Invalid credentials" });
    return false;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
    set({ authenticated: false, error: null });
  },
}));
