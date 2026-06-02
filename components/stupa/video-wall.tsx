"use client";
import { Play } from "lucide-react";
import { VideoCard } from "./video-card";
import type { StupaVideo, StupaTag } from "@/lib/db/stupa-repository";

type Props = { videos: StupaVideo[]; tags: StupaTag[] };

export function VideoWall({ videos, tags }: Props) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-3">
        <Play className="w-8 h-8 text-white/10" strokeWidth={1.5} />
        <p className="text-[11px] font-black tracking-[0.12em] uppercase text-white/20">
          No videos saved yet
        </p>
        <p className="text-[10px] text-white/15 font-mono">
          Paste a YouTube or Instagram link to begin
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} tags={tags} />
      ))}
    </div>
  );
}
