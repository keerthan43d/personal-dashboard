"use client";
import { create } from "zustand";
import { getSupabase } from "@/lib/db/supabase-client";

export interface TrendingTopic {
  id: string;
  headline: string;
  summary: string;
  sourceUrl: string;
  topicTag: string;
  fetchedAt: string;
  picked: boolean;
}

export interface LinkedInDraft {
  id: string;
  postContent: string;
  sourceHeadline: string;
  sourceUrl: string;
  reactionText: string;
  tone: string;
  style: string;
  status: "draft" | "used" | "archived";
  createdAt: string;
}

interface LinkedInStore {
  topics: TrendingTopic[];
  drafts: LinkedInDraft[];
  loadingTopics: boolean;
  loadingDrafts: boolean;
  refreshing: boolean;
  generating: boolean;
  generatingImage: boolean;
  lastFetchedAt: string | null;

  loadTopics(): Promise<void>;
  refreshTopics(): Promise<void>;
  loadDrafts(): Promise<void>;
  generatePost(params: {
    headline: string;
    summary: string;
    reaction: string;
    tone: string;
    style: string;
    sourceUrl: string;
  }): Promise<string>;
  generateImage(params: {
    headline: string;
    postContent: string;
  }): Promise<string>;
  saveDraft(draft: Omit<LinkedInDraft, "id" | "createdAt">): Promise<LinkedInDraft>;
  updateDraft(id: string, content: string): Promise<void>;
  updateDraftStatus(id: string, status: LinkedInDraft["status"]): Promise<void>;
  deleteDraft(id: string): Promise<void>;
}

export const useLinkedIn = create<LinkedInStore>((set, get) => ({
  topics: [],
  drafts: [],
  loadingTopics: false,
  loadingDrafts: false,
  refreshing: false,
  generating: false,
  generatingImage: false,
  lastFetchedAt: null,

  async loadTopics() {
    set({ loadingTopics: true });
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("linkedin_trending_topics")
        .select("*")
        .order("fetched_at", { ascending: false })
        .limit(10);

      if (error) {
        console.warn("loadTopics:", error.message);
        set({ topics: [], loadingTopics: false });
        return;
      }

      const topics: TrendingTopic[] = (data ?? []).map((r) => ({
        id: r.id,
        headline: r.headline,
        summary: r.summary,
        sourceUrl: r.source_url,
        topicTag: r.topic_tag,
        fetchedAt: r.fetched_at,
        picked: r.picked,
      }));

      const latest = topics[0]?.fetchedAt ?? null;
      set({ topics, loadingTopics: false, lastFetchedAt: latest });
    } catch {
      set({ topics: [], loadingTopics: false });
    }
  },

  async refreshTopics() {
    set({ refreshing: true });
    try {
      const res = await fetch("/api/linkedin/trending", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to fetch trending topics");
      }
      await get().loadTopics();
    } finally {
      set({ refreshing: false });
    }
  },

  async loadDrafts() {
    set({ loadingDrafts: true });
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("linkedin_drafts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("loadDrafts:", error.message);
        set({ drafts: [], loadingDrafts: false });
        return;
      }

      const drafts: LinkedInDraft[] = (data ?? []).map((r) => ({
        id: r.id,
        postContent: r.post_content,
        sourceHeadline: r.source_headline,
        sourceUrl: r.source_url,
        reactionText: r.reaction_text,
        tone: r.tone,
        style: r.style,
        status: r.status,
        createdAt: r.created_at,
      }));
      set({ drafts, loadingDrafts: false });
    } catch {
      set({ drafts: [], loadingDrafts: false });
    }
  },

  async generatePost({ headline, summary, reaction, tone, style }) {
    set({ generating: true });
    try {
      const res = await fetch("/api/linkedin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline, summary, reaction, tone, style }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to generate post");
      }
      const { postContent } = await res.json();
      return postContent as string;
    } finally {
      set({ generating: false });
    }
  },

  async generateImage({ headline, postContent }) {
    set({ generatingImage: true });
    try {
      const res = await fetch("/api/linkedin/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headline, postContent }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to generate image");
      }
      const { imageUrl } = await res.json();
      return imageUrl as string;
    } finally {
      set({ generatingImage: false });
    }
  },

  async saveDraft(draft) {
    const supabase = getSupabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const row = {
      id,
      post_content: draft.postContent,
      source_headline: draft.sourceHeadline,
      source_url: draft.sourceUrl,
      reaction_text: draft.reactionText,
      tone: draft.tone,
      style: draft.style,
      status: draft.status,
      created_at: now,
    };
    await supabase.from("linkedin_drafts").insert(row);
    const newDraft: LinkedInDraft = { ...draft, id, createdAt: now };
    set((s) => ({ drafts: [newDraft, ...s.drafts] }));
    return newDraft;
  },

  async updateDraft(id, content) {
    const supabase = getSupabase();
    await supabase
      .from("linkedin_drafts")
      .update({ post_content: content })
      .eq("id", id);
    set((s) => ({
      drafts: s.drafts.map((d) =>
        d.id === id ? { ...d, postContent: content } : d
      ),
    }));
  },

  async updateDraftStatus(id, status) {
    const supabase = getSupabase();
    await supabase
      .from("linkedin_drafts")
      .update({ status })
      .eq("id", id);
    set((s) => ({
      drafts: s.drafts.map((d) =>
        d.id === id ? { ...d, status } : d
      ),
    }));
  },

  async deleteDraft(id) {
    const supabase = getSupabase();
    await supabase.from("linkedin_drafts").delete().eq("id", id);
    set((s) => ({ drafts: s.drafts.filter((d) => d.id !== id) }));
  },
}));
