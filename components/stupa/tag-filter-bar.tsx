"use client";
import { X } from "lucide-react";
import { useStupaStore } from "./stupa-store";
import { TagChip } from "./tag-chip";

export function TagFilterBar() {
  const { tags, activeTags, toggleTagFilter, clearTagFilter } = useStupaStore();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {activeTags.length > 0 && (
        <button
          onClick={clearTagFilter}
          className="flex items-center gap-1 text-[9px] font-black tracking-[0.1em] uppercase text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/25 px-2 py-1"
        >
          <X className="w-2.5 h-2.5" />
          CLEAR
        </button>
      )}
      {tags.map((tag) => (
        <TagChip
          key={tag.id}
          name={tag.name}
          color={tag.color}
          active={activeTags.includes(tag.id)}
          onClick={() => toggleTagFilter(tag.id)}
        />
      ))}
    </div>
  );
}
