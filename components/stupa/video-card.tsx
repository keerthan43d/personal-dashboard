"use client";
import { useState } from "react";
import { ExternalLink, Trash2, Camera, Play } from "lucide-react";
import { format } from "date-fns";
import { useStupaStore } from "./stupa-store";
import { TagChip } from "./tag-chip";
import type { StupaVideo, StupaTag } from "@/lib/db/stupa-repository";

type Props = { video: StupaVideo; tags: StupaTag[] };

export function VideoCard({ video, tags }: Props) {
  const removeVideo = useStupaStore((s) => s.removeVideo);
  const [playing, setPlaying] = useState(false);

  const videoTags = tags.filter((t) => video.tagIds.includes(t.id));
  const dateStr = format(new Date(video.createdAt), "dd MMM yy");

  return (
    <div className="group border border-white/8 bg-white/[0.018] overflow-hidden card-hover flex flex-col h-full">
      {/* ── Media (uniform aspect-video for every platform) ───── */}
      <div className="relative aspect-video bg-black overflow-hidden flex-shrink-0">
        {/* Platform badge */}
        <span
          className={
            "absolute top-2 left-2 z-20 px-1.5 py-0.5 text-[8px] font-black tracking-[0.12em] uppercase " +
            (video.platform === "youtube"
              ? "bg-[#E60012] text-white"
              : "bg-gradient-to-br from-[#833AB4] to-[#FD1D1D] text-white")
          }
        >
          {video.platform === "youtube" ? "YT" : "IG"}
        </span>

        {/* YouTube — inline playable */}
        {video.platform === "youtube" ? (
          playing && video.videoId ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              onClick={() => setPlaying(true)}
              className="absolute inset-0 w-full h-full flex items-center justify-center group/play"
              aria-label="Play video"
            >
              {video.thumbnailUrl && (
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover/play:opacity-90 transition-opacity duration-200"
                />
              )}
              <div className="relative z-10 w-11 h-11 bg-[#FFD600] flex items-center justify-center group-hover/play:bg-white transition-colors">
                <Play className="w-5 h-5 text-black fill-black ml-0.5" />
              </div>
            </button>
          )
        ) : (
          /* Instagram — thumbnail (or placeholder) that opens the reel */
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 w-full h-full flex items-center justify-center group/ig"
            aria-label="Open on Instagram"
          >
            {video.thumbnailUrl ? (
              <img
                src={video.thumbnailUrl}
                alt={video.title}
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover/ig:opacity-100 transition-opacity duration-200"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#833AB4]/25 via-[#FD1D1D]/25 to-[#FCAF45]/25">
                <Camera className="w-8 h-8 text-white/25" strokeWidth={1.5} />
              </div>
            )}
            <div className="relative z-10 w-11 h-11 bg-gradient-to-br from-[#833AB4] to-[#FD1D1D] flex items-center justify-center group-hover/ig:brightness-125 transition-all">
              <ExternalLink className="w-5 h-5 text-white" />
            </div>
          </a>
        )}
      </div>

      {/* ── Card body ────────────────────────────────────────── */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[12px] font-bold text-white leading-snug flex-1 min-w-0 line-clamp-2">
            {video.title}
          </p>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 flex items-center justify-center text-white/25 hover:text-white transition-colors"
              aria-label="Open original"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => removeVideo(video.id)}
              className="w-6 h-6 flex items-center justify-center text-white/20 hover:text-[#E60012] transition-colors"
              aria-label="Delete video"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {video.note && (
          <p className="text-[11px] text-white/45 leading-relaxed line-clamp-3">{video.note}</p>
        )}

        <div className="flex items-end justify-between gap-2 mt-auto pt-1">
          <div className="flex flex-wrap gap-1">
            {videoTags.map((t) => (
              <TagChip key={t.id} name={t.name} color={t.color} size="xs" />
            ))}
          </div>
          <span className="text-[9px] font-mono text-white/20 flex-shrink-0">{dateStr}</span>
        </div>
      </div>
    </div>
  );
}
