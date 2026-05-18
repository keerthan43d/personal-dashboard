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
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="group flex items-center gap-2 py-1">
          <span className="text-white/20 text-xs select-none">—</span>
          <span className="text-sm text-white/75 flex-1">{item}</span>
          <button
            onClick={() => remove(i)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-rose-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}

      {adding ? (
        <div className="flex items-center gap-2 py-1">
          <span className="text-white/20 text-xs">—</span>
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
            className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/20 outline-none border-b border-white/20 focus:border-[#FFD600]/40 pb-0.5 transition-colors"
          />
        </div>
      ) : (
        <button
          onClick={startAdd}
          className={cn(
            "flex items-center gap-1.5 text-[10px] font-black tracking-[0.1em] uppercase",
            "text-white/25 hover:text-white/50 transition-colors mt-1"
          )}
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      )}
    </div>
  );
}
