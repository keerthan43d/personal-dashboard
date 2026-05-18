"use client";
import { cn } from "@/lib/utils";
import { MOOD_COLORS, MOOD_LABELS } from "@/lib/journal-constants";

interface Props {
  value?: number;
  onChange: (v: number) => void;
}

export function MoodPicker({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-4">
      {[1, 2, 3, 4, 5].map((n) => {
        const isSelected = value === n;
        const color = MOOD_COLORS[n];
        return (
          <button
            key={n}
            onClick={() => onChange(value === n ? 0 : n)}
            title={MOOD_LABELS[n]}
            className={cn(
              "flex flex-col items-center gap-2.5 cursor-pointer transition-all duration-150 group"
            )}
          >
            <div
              className={cn(
                "w-11 h-11 border-2 transition-all duration-200",
                isSelected
                  ? "border-white/40 scale-110"
                  : "border-transparent opacity-35 hover:opacity-70 hover:scale-105"
              )}
              style={{
                backgroundColor: color,
                boxShadow: isSelected
                  ? `0 0 24px ${color}80, 0 0 8px ${color}50, inset 0 1px 0 rgba(255,255,255,0.18)`
                  : "none",
              }}
            />
            <span
              className={cn(
                "text-[8px] font-black tracking-[0.14em] uppercase transition-all duration-150",
                isSelected ? "text-white" : "text-white/25 group-hover:text-white/50"
              )}
              style={isSelected ? { color: color } : undefined}
            >
              {MOOD_LABELS[n]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
