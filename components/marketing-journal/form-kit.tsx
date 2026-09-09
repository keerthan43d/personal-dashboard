"use client";
import { useState, type ReactNode, type KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACCENT } from "./marketing-helpers";

export function Field({ label, required, children, className }: {
  label: string; required?: boolean; children: ReactNode; className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
        {label} {required && <span style={{ color: ACCENT }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const selectCls =
  "w-full h-9 bg-[#111] border border-white/15 text-sm text-white/90 px-2 rounded-md focus:outline-none";

export function Select({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: ReactNode;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
      {children}
    </select>
  );
}

/** Free-text input backed by a datalist of known values — lets the user pick a
 *  suggestion or type a brand-new one (that's how new types persist). */
export function Combo({ value, onChange, options, placeholder, listId }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; listId: string;
}) {
  return (
    <>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list={listId}
        className="bg-transparent border-white/15 text-sm text-white/90 placeholder:text-white/20"
      />
      <datalist id={listId}>
        {options.map((o) => <option key={o} value={o} />)}
      </datalist>
    </>
  );
}

/** Chip-based tag editor with suggestions. */
export function TagInput({ tags, onChange, suggestions }: {
  tags: string[]; onChange: (t: string[]) => void; suggestions: string[];
}) {
  const [draft, setDraft] = useState("");

  function add(raw: string) {
    const t = raw.trim().toLowerCase();
    if (!t || tags.includes(t)) { setDraft(""); return; }
    onChange([...tags, t]);
    setDraft("");
  }
  function remove(t: string) { onChange(tags.filter((x) => x !== t)); }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(draft); }
    else if (e.key === "Backspace" && !draft && tags.length) remove(tags[tags.length - 1]);
  }

  const unused = suggestions.filter((s) => !tags.includes(s)).slice(0, 8);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 min-h-9 border border-white/15 rounded-md px-2 py-1.5">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.08em] px-1.5 py-0.5 bg-[#FFD600]/15 text-[#FFD600] border border-[#FFD600]/25">
            {t}
            <button type="button" onClick={() => remove(t)} className="hover:text-white cursor-pointer">
              <X className="w-2.5 h-2.5" strokeWidth={3} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => add(draft)}
          placeholder={tags.length ? "" : "Type a tag, Enter to add…"
          }
          className="flex-1 min-w-[100px] bg-transparent text-sm text-white/90 placeholder:text-white/20 focus:outline-none"
        />
      </div>
      {unused.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {unused.map((s) => (
            <button key={s} type="button" onClick={() => add(s)}
              className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white/40 border border-white/10 px-1.5 py-0.5 hover:text-[#FFD600] hover:border-[#FFD600]/30 transition-colors cursor-pointer">
              <Plus className="w-2 h-2" strokeWidth={3} /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DialogActions({ onDelete, onClose, onSave, disabled, saving }: {
  onDelete?: () => void; onClose: () => void; onSave: () => void; disabled?: boolean; saving?: boolean;
}) {
  return (
    <div className={cn("flex gap-3 mt-4 pt-4 border-t border-white/8", onDelete && "justify-between")}>
      {onDelete && (
        <Button variant="ghost" size="sm" onClick={onDelete}
          className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-[10px] font-black tracking-[0.08em] uppercase">
          Delete
        </Button>
      )}
      <div className="flex gap-2 ml-auto">
        <Button variant="ghost" size="sm" onClick={onClose}
          className="text-white/70 hover:text-white/60 text-[10px] font-black tracking-[0.08em] uppercase">
          Cancel
        </Button>
        <Button size="sm" onClick={onSave} disabled={disabled || saving}
          className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black text-[10px] tracking-[0.08em] uppercase">
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
