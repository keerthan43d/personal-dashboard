"use client";
/**
 * Active DataRepository.
 * Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY to use Supabase.
 * Falls back to LocalRepository (Dexie/IndexedDB) when env vars are absent.
 */
import { repo as localRepo } from "./local";
import { supabaseRepo } from "./supabase-repository";
import type { DataRepository } from "./repository";

export const repo: DataRepository = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? supabaseRepo
  : localRepo;

export type { DataRepository } from "./repository";
export * from "./schemas";
