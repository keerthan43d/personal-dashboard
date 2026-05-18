"use client";
import { cn } from "@/lib/utils";
import { MOOD_COLORS, MOOD_LABELS } from "@/lib/journal-constants";

interface Props {
  value?: number;
  onChange: (v: number) => void;
}

export function MoodPicker({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onChange(value === n ? 0 : n)}
          title={MOOD_LABELS[n]}
          className={cn(
            "flex flex-col items-center gap-1.5 group transition-transform duration-100",
            value === n ? "scale-110" : "hover:scale-105"
          )}
        >
          <span
            className={cn(
              "w-6 h-6 transition-all duration-150",
              value === n ? "ring-2 ring-white/30 ring-offset-1 ring-offset-black" : "opacity-50 group-hover:opacity-80"
            )}
            style={{
              borderRadius: "50%",
              backgroundColor: MOOD_COLORS[n],
            }}
          />
          <span className="text-[9px] font-black tracking-[0.1em] uppercase text-white/30 group-hover:text-white/50">
            {MOOD_LABELS[n]}
          </span>
        </button>
      ))}
    </div>
  );
}
