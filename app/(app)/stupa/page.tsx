"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flower2, Plus, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStupaStore } from "@/components/stupa/stupa-store";
import { TagFilterBar } from "@/components/stupa/tag-filter-bar";
import { TagManager } from "@/components/stupa/tag-manager";
import { VideoWall } from "@/components/stupa/video-wall";
import { ThoughtsStream } from "@/components/stupa/thoughts-stream";
import { AddVideoDialog } from "@/components/stupa/add-video-dialog";
import { AddThoughtDialog } from "@/components/stupa/add-thought-dialog";

type Stream = "videos" | "reflections";

export default function StupaPage() {
  const { load, loaded, videos, thoughts, tags, activeTags } = useStupaStore();
  const [stream, setStream] = useState<Stream>("videos");
  const [showTagManager, setShowTagManager] = useState(false);
  const [addVideoOpen, setAddVideoOpen] = useState(false);
  const [addThoughtOpen, setAddThoughtOpen] = useState(false);

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  const filteredVideos =
    activeTags.length === 0
      ? videos
      : videos.filter((v) => activeTags.some((tid) => v.tagIds.includes(tid)));

  const filteredThoughts =
    activeTags.length === 0
      ? thoughts
      : thoughts.filter((t) => activeTags.some((tid) => t.tagIds.includes(tid)));

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Flower2 className="w-5 h-5 text-[#E60012]" strokeWidth={1.5} />
          <div>
            <h1 className="text-[18px] font-black tracking-[0.1em] uppercase text-white leading-none">
              THE STUPA
            </h1>
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/30 mt-1">
              SANCTUARY · MOTION &amp; REFLECTION
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTagManager((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 border text-[10px] font-black tracking-[0.1em] uppercase transition-all",
              showTagManager
                ? "border-[#FFD600] text-[#FFD600] bg-[#FFD600]/5"
                : "border-white/15 text-white/45 hover:border-white/30 hover:text-white"
            )}
          >
            <SlidersHorizontal className="w-3 h-3" />
            TAGS
          </button>
          <button
            onClick={() =>
              stream === "videos" ? setAddVideoOpen(true) : setAddThoughtOpen(true)
            }
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFD600] text-black text-[10px] font-black tracking-[0.1em] uppercase hover:bg-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            ADD
          </button>
        </div>
      </div>

      {/* ── Stream toggle ───────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-6 py-3 border-b border-white/8 flex-shrink-0">
        {(["videos", "reflections"] as Stream[]).map((s) => {
          const count = s === "videos" ? filteredVideos.length : filteredThoughts.length;
          return (
            <button
              key={s}
              onClick={() => setStream(s)}
              className={cn(
                "px-4 py-1.5 text-[10px] font-black tracking-[0.12em] uppercase transition-all",
                stream === s
                  ? "bg-[#FFD600] text-black"
                  : "text-white/40 hover:text-white border border-white/10 hover:border-white/20"
              )}
            >
              {s.toUpperCase()} ({count})
            </button>
          );
        })}
      </div>

      {/* ── Tag filter bar (only when tags exist) ──────────────── */}
      {tags.length > 0 && (
        <div className="px-6 py-2.5 border-b border-white/8 flex-shrink-0">
          <TagFilterBar />
        </div>
      )}

      {/* ── Content area + collapsible tag manager ─────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Main scroll area */}
        <div className="flex-1 overflow-y-auto min-w-0">
          {!loaded ? (
            <div className="flex items-center justify-center py-28">
              <div className="flex flex-col items-center gap-3">
                <div className="w-5 h-5 border-2 border-[#FFD600] border-t-transparent animate-spin" />
                <p className="text-[10px] font-black tracking-[0.14em] uppercase text-white/30">
                  LOADING
                </p>
              </div>
            </div>
          ) : stream === "videos" ? (
            <VideoWall videos={filteredVideos} tags={tags} />
          ) : (
            <ThoughtsStream thoughts={filteredThoughts} tags={tags} />
          )}
        </div>

        {/* Tag manager panel */}
        <AnimatePresence>
          {showTagManager && (
            <motion.aside
              key="stupa-tag-manager"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 272, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: "linear" }}
              className="border-l border-white/8 overflow-y-auto overflow-x-hidden flex-shrink-0 bg-black"
              style={{ minWidth: 0 }}
            >
              <div style={{ width: 272 }}>
                <TagManager />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <AddVideoDialog open={addVideoOpen} onClose={() => setAddVideoOpen(false)} />
      <AddThoughtDialog open={addThoughtOpen} onClose={() => setAddThoughtOpen(false)} />
    </div>
  );
}
