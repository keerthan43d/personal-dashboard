"use client";
import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input }    from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button }   from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OneProject, OneProjectInput, Milestone } from "@/lib/db/schemas";

interface Props {
  open:      boolean;
  onClose:   () => void;
  existing?: OneProject;
  onSave:    (data: OneProjectInput) => Promise<void>;
}

export function OneProjectDialog({ open, onClose, existing, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [milestones, setMilestones] = useState<Milestone[]>(
    existing?.milestones ?? []
  );
  const [targetDate, setTargetDate] = useState(existing?.targetDate ?? "");
  const [startedAt, setStartedAt] = useState(existing?.startedAt ?? "");

  function addMilestone() {
    setMilestones((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: "", done: false },
    ]);
  }

  function updateMilestoneLabel(id: string, label: string) {
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, label } : m))
    );
  }

  function removeMilestone(id: string) {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        milestones: milestones.filter((m) => m.label.trim()),
        targetDate: targetDate.trim() || undefined,
        startedAt: startedAt.trim() || undefined,
        active: existing?.active ?? true,
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
            {existing ? "Edit ONE Project" : "Set ONE Project"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              Title <span className="text-rose-400">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Your single most important project"
              className="bg-transparent border-white/15 text-sm text-white placeholder:text-white/20 focus-visible:ring-[#FFD600]/30"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Why does this matter? What does done look like?"
              rows={3}
              className="bg-transparent border-white/15 text-sm text-white/80 placeholder:text-white/20 resize-none focus-visible:ring-[#FFD600]/30"
            />
          </div>

          {/* Milestones */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              Milestones
            </label>
            <div className="space-y-1.5">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <Input
                    value={m.label}
                    onChange={(e) => updateMilestoneLabel(m.id, e.target.value)}
                    placeholder="Milestone..."
                    className="bg-transparent border-white/15 text-sm text-white placeholder:text-white/20 focus-visible:ring-[#FFD600]/30 flex-1"
                  />
                  <button
                    onClick={() => removeMilestone(m.id)}
                    className="text-white/45 hover:text-rose-400 transition-colors shrink-0 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addMilestone}
              className={cn(
                "flex items-center gap-1.5 text-[10px] font-black tracking-[0.1em] uppercase mt-1.5",
                "text-white/45 hover:text-white/50 transition-colors"
              )}
            >
              <Plus className="w-3 h-3" />
              Add Milestone
            </button>
          </div>

          {/* Target date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              Target Date
            </label>
            <Input
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              placeholder="YYYY-MM-DD"
              className="bg-transparent border-white/15 text-sm text-white placeholder:text-white/20 focus-visible:ring-[#FFD600]/30"
            />
          </div>

          {/* Started at */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              Started At
            </label>
            <Input
              value={startedAt}
              onChange={(e) => setStartedAt(e.target.value)}
              placeholder="YYYY-MM-DD"
              className="bg-transparent border-white/15 text-sm text-white placeholder:text-white/20 focus-visible:ring-[#FFD600]/30"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-white/8 justify-end">
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
            disabled={!title.trim() || saving}
            className="bg-[#FFD600] text-black hover:bg-[#FFD600]/90 font-black text-[10px] tracking-[0.08em] uppercase"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
