"use client";
import { create } from "zustand";
import {
  listStupaTags,
  listStupaVideos,
  listStupaThoughts,
  createStupaTag,
  updateStupaTag,
  deleteStupaTag,
  createStupaVideo,
  deleteStupaVideo,
  createStupaThought,
  deleteStupaThought,
  type StupaTag,
  type StupaVideo,
  type StupaThought,
} from "@/lib/db/stupa-repository";

type State = {
  tags: StupaTag[];
  videos: StupaVideo[];
  thoughts: StupaThought[];
  activeTags: string[];
  loaded: boolean;

  load: () => Promise<void>;
  addTag: (name: string, color: string) => Promise<void>;
  editTag: (id: string, patch: { name?: string; color?: string }) => Promise<void>;
  removeTag: (id: string) => Promise<void>;
  addVideo: (input: Omit<StupaVideo, "id" | "createdAt">) => Promise<void>;
  removeVideo: (id: string) => Promise<void>;
  addThought: (content: string, tagIds: string[]) => Promise<void>;
  removeThought: (id: string) => Promise<void>;
  toggleTagFilter: (tagId: string) => void;
  clearTagFilter: () => void;
};

export const useStupaStore = create<State>()((set) => ({
  tags: [],
  videos: [],
  thoughts: [],
  activeTags: [],
  loaded: false,

  load: async () => {
    try {
      const [tags, videos, thoughts] = await Promise.all([
        listStupaTags(),
        listStupaVideos(),
        listStupaThoughts(),
      ]);
      set({ tags, videos, thoughts, loaded: true });
    } catch (e) {
      console.error("[Stupa] load error — migration may not have run yet:", e);
      set({ loaded: true });
    }
  },

  addTag: async (name, color) => {
    const tag = await createStupaTag(name, color);
    set((s) => ({ tags: [...s.tags, tag] }));
  },

  editTag: async (id, patch) => {
    const updated = await updateStupaTag(id, patch);
    set((s) => ({ tags: s.tags.map((t) => (t.id === id ? updated : t)) }));
  },

  removeTag: async (id) => {
    await deleteStupaTag(id);
    set((s) => ({
      tags: s.tags.filter((t) => t.id !== id),
      videos: s.videos.map((v) => ({ ...v, tagIds: v.tagIds.filter((tid) => tid !== id) })),
      thoughts: s.thoughts.map((t) => ({ ...t, tagIds: t.tagIds.filter((tid) => tid !== id) })),
      activeTags: s.activeTags.filter((tid) => tid !== id),
    }));
  },

  addVideo: async (input) => {
    const video = await createStupaVideo(input);
    set((s) => ({ videos: [video, ...s.videos] }));
  },

  removeVideo: async (id) => {
    await deleteStupaVideo(id);
    set((s) => ({ videos: s.videos.filter((v) => v.id !== id) }));
  },

  addThought: async (content, tagIds) => {
    const thought = await createStupaThought(content, tagIds);
    set((s) => ({ thoughts: [thought, ...s.thoughts] }));
  },

  removeThought: async (id) => {
    await deleteStupaThought(id);
    set((s) => ({ thoughts: s.thoughts.filter((t) => t.id !== id) }));
  },

  toggleTagFilter: (tagId) => {
    set((s) => ({
      activeTags: s.activeTags.includes(tagId)
        ? s.activeTags.filter((id) => id !== tagId)
        : [...s.activeTags, tagId],
    }));
  },

  clearTagFilter: () => set({ activeTags: [] }),
}));
