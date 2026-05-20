"use client";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input }    from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button }   from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ShipLog, ShipLogInput } from "@/lib/db/schemas";

interface Props {
  open:      boolean;
  onClose:   () => void;
  entryDate: string;
  existing?: ShipLog;
  onSave:    (data: ShipLogInput) => Promise<void>;
  onDelete?: () => void;
}

const SHIP_TYPES: { value: ShipLog["type"]; label: string; color: string }[] = [
  { value: "feature", label: "Feature", color: "#00C9A7" },
  { value: "page",    label: "Page",    color: "#00D9FF" },
  { value: "pitch",   label: "Pitch",   color: "#FFD600" },
  { value: "video",   label: "Video",   color: "#FF6600" },
  { value: "design",  label: "Design",  color: "#9B59B6" },
  { value: "other",   label: "Other",   color: "rgba(255,255,255,0.4)" },
];

export function ShipLogDialog({ open, onClose, entryDate, existing, onSave, onDelete }: Props) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<ShipLogInput>>({
    title:       existing?.title       ?? "",
    description: existing?.description ?? "",
    url:         existing?.url         ?? "",
    type:        existing?.type        ?? "feature",
    entryDate,
  });

  function setField(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.title?.trim()) return;
    setSaving(true);
    try {
      await onSave({
        entryDate,
        title:       form.title!.trim(),
        description: form.description?.trim() || undefined,
        url:         form.url?.trim() || undefined,
        type:        form.type ?? "other",
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
            {existing ? "Edit Ship" : "Log a Ship"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              Title <span className="text-rose-400">*</span>
            </label>
            <Input
              value={form.title ?? ""}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="What did you ship?"
              className="bg-transparent border-white/15 text-sm text-white placeholder:text-white/20 focus-visible:ring-[#9B59B6]/30"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              Description
            </label>
            <Textarea
              value={form.description ?? ""}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Brief details about what was shipped..."
              rows={3}
              className="bg-transparent border-white/15 text-sm text-white/80 placeholder:text-white/20 resize-none focus-visible:ring-[#9B59B6]/30"
            />
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              URL
            </label>
            <Input
              value={form.url ?? ""}
              onChange={(e) => setField("url", e.target.value)}
              placeholder="https://..."
              className="bg-transparent border-white/15 text-sm text-white/80 placeholder:text-white/20 focus-visible:ring-[#9B59B6]/30"
            />
          </div>

          {/* Type selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SHIP_TYPES.map(({ value, label, color }) => {
                const active = form.type === value;
                return (
                  <button
                    key={value}
                    onClick={() => setForm((f) => ({ ...f, type: value }))}
                    className={cn(
                      "h-8 text-[10px] font-black tracking-[0.08em] uppercase border transition-all",
                      active
                        ? "bg-transparent"
                        : "border-white/10 text-white/40 hover:border-white/20",
                    )}
                    style={
                      active
                        ? { borderColor: color, color }
                        : undefined
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={cn("flex gap-3 mt-4 pt-4 border-t border-white/8", onDelete && "justify-between")}>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-[10px] font-black tracking-[0.08em] uppercase"
            >
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white/70 hover:text-white/60 text-[10px] font-black tracking-[0.08em] uppercase"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!form.title?.trim() || saving}
              className="bg-[#9B59B6] text-white hover:bg-[#9B59B6]/90 font-black text-[10px] tracking-[0.08em] uppercase"
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
