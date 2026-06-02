"use client";
import { useState, useEffect, useCallback } from "react";
import { Loader2, Video, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStupaStore } from "./stupa-store";
import { TagChip } from "./tag-chip";

function parseYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return m?.[1] ?? null;
}

function detectPlatform(url: string): "youtube" | "instagram" | null {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/instagram\.com/.test(url)) return "instagram";
  return null;
}

async function fetchYouTubeMeta(url: string) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { title: string; thumbnail_url: string };
    return { title: data.title, thumbnailUrl: data.thumbnail_url };
  } catch {
    return null;
  }
}

type Props = { open: boolean; onClose: () => void };

export function AddVideoDialog({ open, onClose }: Props) {
  const { tags, addVideo } = useStupaStore();
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState<"youtube" | "instagram" | null>(null);
  const [title, setTitle] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setUrl("");
      setPlatform(null);
      setTitle("");
      setThumbnailUrl(null);
      setNote("");
      setSelectedTags([]);
      setFetchError(null);
    }
  }, [open]);

  const handleUrlChange = useCallback(async (val: string) => {
    setUrl(val);
    setFetchError(null);
    const detected = detectPlatform(val.trim());
    setPlatform(detected);
    setTitle("");
    setThumbnailUrl(null);

    if (detected === "youtube" && val.trim()) {
      setFetching(true);
      const meta = await fetchYouTubeMeta(val.trim());
      setFetching(false);
      if (meta) {
        setTitle(meta.title);
        setThumbnailUrl(meta.thumbnailUrl);
      } else {
        setFetchError("Could not auto-fetch metadata. Enter title manually.");
      }
    }
  }, []);

  const videoId = platform === "youtube" ? parseYouTubeId(url) : null;

  const handleSave = async () => {
    if (!url.trim() || !title.trim() || !platform) return;
    setSaving(true);
    try {
      await addVideo({
        platform,
        url: url.trim(),
        videoId,
        title: title.trim(),
        thumbnailUrl:
          thumbnailUrl ??
          (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null),
        note: note.trim() || null,
        tagIds: selectedTags,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (id: string) =>
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const canSave = url.trim() && title.trim() && platform && !saving;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#080808] border border-white/10 text-white max-w-lg p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-white/8">
          <DialogTitle className="text-[12px] font-black tracking-[0.14em] uppercase text-white">
            ADD VIDEO
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 p-5">
          {/* URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/45">
              URL
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="YouTube or Instagram URL..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 px-3 py-2 text-[12px] text-white placeholder:text-white/25 outline-none focus:border-white/30 pr-9"
              />
              {platform === "youtube" && (
                <Video className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500/70 pointer-events-none" />
              )}
              {platform === "instagram" && (
                <Camera className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500/70 pointer-events-none" />
              )}
            </div>
            {platform === "instagram" && (
              <p className="text-[10px] text-white/35 font-mono leading-relaxed">
                Instagram metadata can&apos;t be auto-fetched — enter a title and (optionally) an image URL below.
              </p>
            )}
            {fetchError && (
              <p className="text-[10px] text-[#E60012]/80 font-mono">{fetchError}</p>
            )}
          </div>

          {/* Image URL — Instagram only (manual thumbnail) */}
          {platform === "instagram" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/45">
                IMAGE URL{" "}
                <span className="text-white/25 normal-case tracking-normal font-normal">
                  optional
                </span>
              </label>
              <input
                type="url"
                placeholder="Paste a thumbnail image URL..."
                value={thumbnailUrl ?? ""}
                onChange={(e) => setThumbnailUrl(e.target.value.trim() || null)}
                className="w-full bg-white/[0.04] border border-white/10 px-3 py-2 text-[12px] text-white placeholder:text-white/25 outline-none focus:border-white/30"
              />
            </div>
          )}

          {/* Thumbnail preview */}
          {thumbnailUrl && (
            <div className="aspect-video w-full overflow-hidden border border-white/8 bg-black">
              <img src={thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/45 flex items-center gap-1.5">
              TITLE
              {fetching && <Loader2 className="w-3 h-3 animate-spin text-white/40" />}
            </label>
            <input
              type="text"
              placeholder={
                platform === "instagram"
                  ? "Enter title..."
                  : "Auto-fetched from YouTube..."
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 px-3 py-2 text-[12px] text-white placeholder:text-white/25 outline-none focus:border-white/30"
            />
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/45">
              NOTE{" "}
              <span className="text-white/25 normal-case tracking-normal font-normal">
                optional
              </span>
            </label>
            <textarea
              placeholder="Why does this video move you..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full bg-white/[0.04] border border-white/10 px-3 py-2 text-[12px] text-white placeholder:text-white/25 outline-none focus:border-white/30 resize-none"
            />
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/45">
                TAGS
              </label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <TagChip
                    key={t.id}
                    name={t.name}
                    color={t.color}
                    active={selectedTags.includes(t.id)}
                    onClick={() => toggleTag(t.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-0 border-t border-white/8">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-[10px] font-black tracking-[0.1em] uppercase text-white/40 hover:text-white hover:bg-white/[0.03] transition-all border-r border-white/8"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 py-3 bg-[#FFD600] text-black text-[10px] font-black tracking-[0.1em] uppercase disabled:opacity-40 hover:bg-white transition-colors"
          >
            {saving ? "SAVING..." : "SAVE VIDEO"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
