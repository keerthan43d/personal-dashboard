"use client";
import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type MetricType,
  type WeightUnit,
  type MmaMetricInput,
} from "@/lib/db/mma-journal-repository";
import { AGILITY_LABELS, POWER_LABELS, ratingLabel } from "./mma-journal-store";

interface Props {
  open: boolean;
  type: MetricType;
  color: string;
  defaultUnit?: WeightUnit;
  onClose: () => void;
  onSave: (data: MmaMetricInput) => Promise<void>;
}

const META: Record<MetricType, { title: string; noun: string }> = {
  weight: { title: "Log Weight", noun: "weight" },
  agility: { title: "Log Agility", noun: "agility" },
  power: { title: "Log Power", noun: "power" },
};

export function MetricDialog({ open, type, color, defaultUnit, onClose, onSave }: Props) {
  const isRating = type !== "weight";
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<WeightUnit>(defaultUnit ?? "kg");
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState("");

  const labels = type === "agility" ? AGILITY_LABELS : POWER_LABELS;

  async function handleSave() {
    let value: number;
    if (isRating) {
      value = rating;
    } else {
      value = parseFloat(weight);
      if (isNaN(value) || value <= 0) return;
    }
    setSaving(true);
    try {
      await onSave({
        date,
        type,
        value,
        unit: type === "weight" ? unit : undefined,
        note: note.trim() || undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const canSave = isRating || (parseFloat(weight) > 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm bg-[#0a0a0a] border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-[12px] font-black tracking-[0.12em] uppercase text-white">
            {META[type].title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-white/15 text-sm text-white/90 [color-scheme:dark]"
            />
          </div>

          {isRating ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
                  Rating
                </label>
                <span className="text-[11px] font-bold" style={{ color }}>
                  {rating}/10 · {ratingLabel(rating, labels)}
                </span>
              </div>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                  const active = n <= rating;
                  return (
                    <button
                      key={n}
                      onClick={() => setRating(n)}
                      className={cn(
                        "h-8 text-[11px] font-bold border transition-all rounded-sm",
                        active ? "text-black" : "border-white/10 text-white/40 hover:border-white/25"
                      )}
                      style={active ? { background: color, borderColor: color } : undefined}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">Weight</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="0.0"
                  className="bg-transparent border-white/15 text-sm text-white flex-1"
                  autoFocus
                />
                <div className="flex">
                  {(["kg", "lb"] as WeightUnit[]).map((u) => {
                    const active = unit === u;
                    return (
                      <button
                        key={u}
                        onClick={() => setUnit(u)}
                        className={cn(
                          "w-11 h-9 text-[10px] font-black uppercase border transition-all first:rounded-l-md last:rounded-r-md -ml-px first:ml-0",
                          active ? "text-black" : "border-white/15 text-white/40 hover:border-white/25"
                        )}
                        style={active ? { background: color, borderColor: color } : undefined}
                      >
                        {u}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black tracking-[0.1em] uppercase text-white/70">
              Note <span className="text-white/30 normal-case font-normal tracking-normal">(optional)</span>
            </label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How you felt, context…"
              className="bg-transparent border-white/15 text-sm text-white/80 placeholder:text-white/20"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-white/8">
          <Button variant="ghost" size="sm" onClick={onClose}
            className="text-white/70 hover:text-white/60 text-[10px] font-black tracking-[0.08em] uppercase">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!canSave || saving}
            className="bg-[#FFD600] hover:bg-[#FFE033] text-black font-black text-[10px] tracking-[0.08em] uppercase">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
