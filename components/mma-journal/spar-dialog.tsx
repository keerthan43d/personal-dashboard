"use client";
import { useState } from "react";
import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  linkSource, LINK_SOURCE_LABEL,
  type MmaSpar, type MmaSparInput,
} from "@/lib/db/mma-journal-repository";

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: MmaSpar;
  onSave: (data: MmaSparInput) => Promise<void>;
  onDelete?: () => void;
}

const ACCENT = "#FFD600";

export function SparDialog({ open, onClose, existing, onSave, onDelete }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MmaSparInput>({
    date: existing?.date ?? format(new Date(), "yyyy-MM-dd"),
    title: existing?.title ?? "",
    url: existing?.url ?? "",
    opponent: existing?.opponent ?? "",
    rounds: existing?.rounds,
    good: existing?.good ?? "",
    bad: existing?.bad ?? "",
    notes: existing?.notes ?? "",
  });

  function set<K extends keyof MmaSparInput>(key: K, value: MmaSparInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const src = form.url.trim() ? linkSource(form.url.trim()) : null;

  const valid = form.url.trim() && form.title.trim();

  async function handleSave() {
    if (!valid) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        url: form.url.trim(),
        opponent: form.opponent?.trim() || undefined,
        rounds: form.rounds && form.rounds > 0 ? form.rounds : undefined,
        good: form.good?.trim() || undefined,
        bad: form.bad?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
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
            {existing ? "Edit Sparring Session" : "Log Sparring Footage"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Footage URL */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              Footage Link <span style={{ color: ACCENT }}>*</span>
            </label>
            <Input
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://drive.google.com/file/d/…"
              className="bg-transparent border-white/15 text-sm text-white/90 placeholder:text-white/20"
            />
            {src && (
              <p className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/40">
                <ExternalLink className="w-2.5 h-2.5" /> {LINK_SOURCE_LABEL[src]} link detected
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              Session Title <span style={{ color: ACCENT }}>*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Saturday hard sparring — round 3"
              className="bg-transparent border-white/15 text-sm text-white placeholder:text-white/20"
            />
          </div>

          {/* Opponent + Date + Rounds */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
                Opponent
              </label>
              <Input
                value={form.opponent ?? ""}
                onChange={(e) => set("opponent", e.target.value)}
                placeholder="Who you rolled with"
                className="bg-transparent border-white/15 text-sm text-white/90 placeholder:text-white/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
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
              <div className="space-y-1.5">
                <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
                  Rounds
                </label>
                <Input
                  type="number"
                  min={0}
                  value={form.rounds ?? ""}
                  onChange={(e) => set("rounds", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="0"
                  className="bg-transparent border-white/15 text-sm text-white/90 [color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* What was good */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-[#6BD98A]">
              What was good ✓
            </label>
            <Textarea
              value={form.good ?? ""}
              onChange={(e) => set("good", e.target.value)}
              placeholder="Sharp shots, good defense, timing that landed…"
              rows={2}
              className="bg-transparent border-white/15 text-sm text-white/80 placeholder:text-white/20 resize-none"
            />
          </div>

          {/* What was bad */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-[#E60012]">
              What was bad ✕
            </label>
            <Textarea
              value={form.bad ?? ""}
              onChange={(e) => set("bad", e.target.value)}
              placeholder="Dropped hands, got taken down, gassed out…"
              rows={2}
              className="bg-transparent border-white/15 text-sm text-white/80 placeholder:text-white/20 resize-none"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              Notes
            </label>
            <Textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Anything else to remember from this session…"
              rows={2}
              className="bg-transparent border-white/15 text-sm text-white/80 placeholder:text-white/20 resize-none"
            />
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
            <Button size="sm" onClick={handleSave} disabled={!valid || saving}
              className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black text-[10px] tracking-[0.08em] uppercase">
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
