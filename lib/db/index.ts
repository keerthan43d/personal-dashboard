"use client";
/**
 * Active DataRepository.
 * Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY to use Supabase.
 * Falls back to LocalRepository (Dexie/IndexedDB) when env vars are absent.
 */
import { repo as localRepo } from "./local";
import type { DataRepository } from "./repository";

function getRepo(): DataRepository {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { supabaseRepo } = require("./supabase-repository");
    return supabaseRepo;
  }
  return localRepo;
}

export const repo: DataRepository = getRepo();

export type { DataRepository } from "./repository";
export * from "./schemas";
