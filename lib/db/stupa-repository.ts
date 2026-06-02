"use client";
import { v4 as uuid } from "uuid";
import { getSupabase } from "./supabase-client";

export type StupaTag = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
};

export type StupaVideo = {
  id: string;
  platform: "youtube" | "instagram";
  url: string;
  videoId: string | null;
  title: string;
  thumbnailUrl: string | null;
  note: string | null;
  createdAt: string;
  tagIds: string[];
};

export type StupaThought = {
  id: string;
  content: string;
  createdAt: string;
  tagIds: string[];
};

const now = () => new Date().toISOString();

function fail(error: { message: string } | null, ctx: string): never {
  throw new Error(`[Stupa] ${ctx}: ${error?.message ?? "unknown error"}`);
}

// ─── Tags ─────────────────────────────────────────────────────

export async function listStupaTags(): Promise<StupaTag[]> {
  const { data, error } = await getSupabase()
    .from("stupa_tags")
    .select("*")
    .order("created_at");
  if (error) fail(error, "listStupaTags");
  return ((data ?? []) as Array<{ id: string; name: string; color: string; created_at: string }>).map(
    (r) => ({ id: r.id, name: r.name, color: r.color, createdAt: r.created_at })
  );
}

export async function createStupaTag(name: string, color: string): Promise<StupaTag> {
  const { data, error } = await getSupabase()
    .from("stupa_tags")
    .insert({ id: uuid(), name, color, created_at: now() })
    .select()
    .single();
  if (error) fail(error, "createStupaTag");
  const r = data as { id: string; name: string; color: string; created_at: string };
  return { id: r.id, name: r.name, color: r.color, createdAt: r.created_at };
}

export async function updateStupaTag(
  id: string,
  patch: { name?: string; color?: string }
): Promise<StupaTag> {
  const { data, error } = await getSupabase()
    .from("stupa_tags")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) fail(error, "updateStupaTag");
  const r = data as { id: string; name: string; color: string; created_at: string };
  return { id: r.id, name: r.name, color: r.color, createdAt: r.created_at };
}

export async function deleteStupaTag(id: string): Promise<void> {
  const { error } = await getSupabase().from("stupa_tags").delete().eq("id", id);
  if (error) fail(error, "deleteStupaTag");
}

// ─── Videos ───────────────────────────────────────────────────

export async function listStupaVideos(): Promise<StupaVideo[]> {
  const { data, error } = await getSupabase()
    .from("stupa_videos")
    .select("*, stupa_video_tags(tag_id)")
    .order("created_at", { ascending: false });
  if (error) fail(error, "listStupaVideos");
  return ((data ?? []) as Array<{
    id: string; platform: string; url: string; video_id: string | null;
    title: string; thumbnail_url: string | null; note: string | null;
    created_at: string; stupa_video_tags: Array<{ tag_id: string }>;
  }>).map((r) => ({
    id: r.id,
    platform: r.platform as "youtube" | "instagram",
    url: r.url,
    videoId: r.video_id ?? null,
    title: r.title,
    thumbnailUrl: r.thumbnail_url ?? null,
    note: r.note ?? null,
    createdAt: r.created_at,
    tagIds: (r.stupa_video_tags ?? []).map((t) => t.tag_id),
  }));
}

export async function createStupaVideo(
  input: Omit<StupaVideo, "id" | "createdAt">
): Promise<StupaVideo> {
  const id = uuid();
  const { data, error } = await getSupabase()
    .from("stupa_videos")
    .insert({
      id,
      platform: input.platform,
      url: input.url,
      video_id: input.videoId ?? null,
      title: input.title,
      thumbnail_url: input.thumbnailUrl ?? null,
      note: input.note ?? null,
      created_at: now(),
    })
    .select()
    .single();
  if (error) fail(error, "createStupaVideo");

  if (input.tagIds.length > 0) {
    const { error: tagError } = await getSupabase()
      .from("stupa_video_tags")
      .insert(input.tagIds.map((tag_id) => ({ video_id: id, tag_id })));
    if (tagError) fail(tagError, "createStupaVideo(tags)");
  }

  const r = data as {
    id: string; platform: string; url: string; video_id: string | null;
    title: string; thumbnail_url: string | null; note: string | null; created_at: string;
  };
  return {
    id: r.id,
    platform: r.platform as "youtube" | "instagram",
    url: r.url,
    videoId: r.video_id ?? null,
    title: r.title,
    thumbnailUrl: r.thumbnail_url ?? null,
    note: r.note ?? null,
    createdAt: r.created_at,
    tagIds: input.tagIds,
  };
}

export async function deleteStupaVideo(id: string): Promise<void> {
  const { error } = await getSupabase().from("stupa_videos").delete().eq("id", id);
  if (error) fail(error, "deleteStupaVideo");
}

// ─── Thoughts ─────────────────────────────────────────────────

export async function listStupaThoughts(): Promise<StupaThought[]> {
  const { data, error } = await getSupabase()
    .from("stupa_thoughts")
    .select("*, stupa_thought_tags(tag_id)")
    .order("created_at", { ascending: false });
  if (error) fail(error, "listStupaThoughts");
  return ((data ?? []) as Array<{
    id: string; content: string; created_at: string;
    stupa_thought_tags: Array<{ tag_id: string }>;
  }>).map((r) => ({
    id: r.id,
    content: r.content,
    createdAt: r.created_at,
    tagIds: (r.stupa_thought_tags ?? []).map((t) => t.tag_id),
  }));
}

export async function createStupaThought(
  content: string,
  tagIds: string[]
): Promise<StupaThought> {
  const id = uuid();
  const { data, error } = await getSupabase()
    .from("stupa_thoughts")
    .insert({ id, content, created_at: now() })
    .select()
    .single();
  if (error) fail(error, "createStupaThought");

  if (tagIds.length > 0) {
    const { error: tagError } = await getSupabase()
      .from("stupa_thought_tags")
      .insert(tagIds.map((tag_id) => ({ thought_id: id, tag_id })));
    if (tagError) fail(tagError, "createStupaThought(tags)");
  }

  const r = data as { id: string; content: string; created_at: string };
  return { id: r.id, content: r.content, createdAt: r.created_at, tagIds };
}

export async function deleteStupaThought(id: string): Promise<void> {
  const { error } = await getSupabase().from("stupa_thoughts").delete().eq("id", id);
  if (error) fail(error, "deleteStupaThought");
}
