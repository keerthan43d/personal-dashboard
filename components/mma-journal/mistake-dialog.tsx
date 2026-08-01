"use client";
import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MMA_CATEGORIES,
  type MmaMistake,
  type MmaMistakeInput,
  type MmaCategory,
} from "@/lib/db/mma-journal-repository";

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: MmaMistake;
  onSave: (data: MmaMistakeInput) => Promise<void>;
  onDelete?: () => void;
}

const ACCENT = "#FFD600";

export function MistakeDialog({ open, onClose, existing, onSave, onDelete }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MmaMistakeInput>({
    date: existing?.date ?? format(new Date(), "yyyy-MM-dd"),
    category: existing?.category ?? "Striking",
    title: existing?.title ?? "",
    whatHappened: existing?.whatHappened ?? "",
    howToFix: existing?.howToFix ?? "",
    status: existing?.status ?? "working",
  });

  function set<K extends keyof MmaMistakeInput>(key: K, value: MmaMistakeInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        whatHappened: form.whatHappened?.trim() || undefined,
        howToFix: form.howToFix?.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-[#0a0a0a] border border-white/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[12px] font-black tracking-[0.12em] uppercase text-white">
            {existing ? "Edit Mistake" : "Log a Mistake"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              What went wrong <span style={{ color: ACCENT }}>*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Dropped my right hand when jabbing"
              className="bg-transparent border-white/15 text-sm text-white placeholder:text-white/20"
            />
          </div>

          {/* Category + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value as MmaCategory)}
                className="w-full h-9 bg-[#111] border border-white/15 text-sm text-white/90 px-2 rounded-md focus:outline-none"
              >
                {MMA_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
                Date
              </label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="bg-transparent border-white/15 text-sm text-white/90 [color-scheme:dark]"
              />
            </div>
          </div>

          {/* What happened */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              What happened
            </label>
            <Textarea
              value={form.whatHappened ?? ""}
              onChange={(e) => set("whatHappened", e.target.value)}
              placeholder="Describe the situation — sparring, drilling, a specific exchange…"
              rows={2}
              className="bg-transparent border-white/15 text-sm text-white/80 placeholder:text-white/20 resize-none"
            />
          </div>

          {/* How to fix */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              How to fix it
            </label>
            <Textarea
              value={form.howToFix ?? ""}
              onChange={(e) => set("howToFix", e.target.value)}
              placeholder="The drill / cue / correction to work on next session"
              rows={2}
              className="bg-transparent border-white/15 text-sm text-white/80 placeholder:text-white/20 resize-none"
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["working", "fixed"] as const).map((st) => {
                const active = form.status === st;
                const color = st === "fixed" ? "#FFFFFF" : ACCENT;
                return (
                  <button
                    key={st}
                    onClick={() => set("status", st)}
                    className={cn(
                      "h-8 text-[10px] font-black tracking-[0.08em] uppercase border transition-all",
                      !active && "border-white/10 text-white/40 hover:border-white/20"
                    )}
                    style={active ? { borderColor: color, color } : undefined}
                  >
                    {st === "working" ? "Working on it" : "Fixed"}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
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
            <Button size="sm" onClick={handleSave} disabled={!form.title.trim() || saving}
              className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black text-[10px] tracking-[0.08em] uppercase">
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
