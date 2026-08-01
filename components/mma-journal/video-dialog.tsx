"use client";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MMA_CATEGORIES,
  youtubeThumb,
  type MmaVideo,
  type MmaVideoInput,
  type MmaCategory,
} from "@/lib/db/mma-journal-repository";

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: MmaVideo;
  onSave: (data: MmaVideoInput) => Promise<void>;
  onDelete?: () => void;
}

export function VideoDialog({ open, onClose, existing, onSave, onDelete }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<MmaVideoInput>({
    url: existing?.url ?? "",
    title: existing?.title ?? "",
    category: existing?.category ?? "Striking",
    notes: existing?.notes ?? "",
  });

  function set<K extends keyof MmaVideoInput>(key: K, value: MmaVideoInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const thumb = youtubeThumb(form.url);

  async function handleSave() {
    if (!form.url.trim() || !form.title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        ...form,
        url: form.url.trim(),
        title: form.title.trim(),
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
            {existing ? "Edit Lesson" : "Save a Video Lesson"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* URL */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              YouTube URL <span className="text-[#FFD600]">*</span>
            </label>
            <Input
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://youtube.com/watch?v=…"
              className="bg-transparent border-white/15 text-sm text-white/90 placeholder:text-white/20"
            />
            {thumb && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" className="mt-2 w-full h-40 object-cover rounded-md border border-white/10" />
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              Title <span className="text-[#FFD600]">*</span>
            </label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. How to slip a jab — footwork drill"
              className="bg-transparent border-white/15 text-sm text-white placeholder:text-white/20"
            />
          </div>

          {/* Category */}
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

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              Notes
            </label>
            <Textarea
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Key takeaways / what to drill from this…"
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
            <Button size="sm" onClick={handleSave}
              disabled={!form.url.trim() || !form.title.trim() || saving}
              className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black text-[10px] tracking-[0.08em] uppercase">
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
