"use client";
import { useState, useRef } from "react";
import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}

export function ListSection({ items, onChange, placeholder = "Add item…" }: Props) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function startAdd() {
    setAdding(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function commit() {
    const trimmed = draft.trim();
    if (trimmed) onChange([...items, trimmed]);
    setDraft("");
    setAdding(false);
  }

  function cancel() {
    setDraft("");
    setAdding(false);
  }

  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-0.5">
      {items.map((item, i) => (
        <div
          key={i}
          className="group flex items-center gap-3 py-2 px-3 hover:bg-white/[0.03] transition-colors"
        >
          <div className="w-1.5 h-1.5 bg-[#FFD600] shrink-0" />
          <span className="text-sm text-white/80 flex-1 leading-relaxed">{item}</span>
          <button
            onClick={() => remove(i)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-rose-400 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="flex items-center gap-3 py-2 px-3 border border-[#FFD600]/25 bg-[#FFD600]/[0.02]">
          <div className="w-1.5 h-1.5 bg-[#FFD600]/50 shrink-0" />
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") cancel();
            }}
            onBlur={commit}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/25 outline-none"
          />
        </div>
      ) : (
        <button
          onClick={startAdd}
          className={cn(
            "flex items-center gap-2 text-[10px] font-black tracking-[0.12em] uppercase mt-2",
            "text-white/30 hover:text-[#FFD600] transition-colors cursor-pointer"
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      )}
    </div>
  );
}
