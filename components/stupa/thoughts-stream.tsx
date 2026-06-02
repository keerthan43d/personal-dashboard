"use client";
import { PenLine, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useStupaStore } from "./stupa-store";
import { TagChip } from "./tag-chip";
import type { StupaThought, StupaTag } from "@/lib/db/stupa-repository";

type Props = { thoughts: StupaThought[]; tags: StupaTag[] };

export function ThoughtsStream({ thoughts, tags }: Props) {
  const removeThought = useStupaStore((s) => s.removeThought);

  if (thoughts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-3">
        <PenLine className="w-8 h-8 text-white/10" strokeWidth={1.5} />
        <p className="text-[11px] font-black tracking-[0.12em] uppercase text-white/20">
          No reflections yet
        </p>
        <p className="text-[10px] text-white/15 font-mono">
          Write thoughts, lessons, realizations
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-3 max-w-2xl">
      {thoughts.map((thought) => {
        const thoughtTags = tags.filter((t) => thought.tagIds.includes(t.id));
        const dateStr = format(new Date(thought.createdAt), "dd MMM yyyy · HH:mm");

        return (
          <div
            key={thought.id}
            className="group border border-white/8 bg-white/[0.018] card-hover"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
              <span className="text-[9px] font-mono text-white/25">{dateStr}</span>
              <button
                onClick={() => removeThought(thought.id)}
                className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-[#E60012] transition-all"
                aria-label="Delete reflection"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap">
                {thought.content}
              </p>
              {thoughtTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {thoughtTags.map((t) => (
                    <TagChip key={t.id} name={t.name} color={t.color} size="xs" />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
