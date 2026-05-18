"use client";
import { cn } from "@/lib/utils";
import { ENERGY_LABELS } from "@/lib/journal-constants";

const LEVEL_STYLES: Record<number, { bg: string; glow: string; text: string }> = {
  1: { bg: "#334155", glow: "rgba(51,65,85,0.6)",    text: "#94A3B8" },
  2: { bg: "#1D4ED8", glow: "rgba(29,78,216,0.6)",   text: "#93C5FD" },
  3: { bg: "#D97706", glow: "rgba(217,119,6,0.6)",   text: "#FCD34D" },
  4: { bg: "#FFD600", glow: "rgba(255,214,0,0.6)",   text: "#FFD600" },
  5: { bg: "#FFFFFF", glow: "rgba(255,255,255,0.5)", text: "#FFFFFF" },
};

interface Props {
  value?: number;
  onChange: (v: number) => void;
}

export function EnergyPicker({ value, onChange }: Props) {
  const activeStyle = value ? LEVEL_STYLES[value] : null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const isFilled = (value ?? 0) >= n;
          const isActive = value === n;
          const style = LEVEL_STYLES[n];
          return (
            <button
              key={n}
              onClick={() => onChange(value === n ? 0 : n)}
              title={`Energy: ${ENERGY_LABELS[n]}`}
              className={cn(
                "w-10 h-2.5 cursor-pointer transition-all duration-200 hover:h-3.5"
              )}
              style={{
                backgroundColor: isFilled ? style.bg : "rgba(255,255,255,0.08)",
                boxShadow: isActive ? `0 0 12px ${style.glow}` : "none",
              }}
            />
          );
        })}
      </div>

      <span
        className="text-[10px] font-black tracking-[0.14em] uppercase transition-colors duration-200"
        style={{ color: activeStyle ? activeStyle.text : "rgba(255,255,255,0.25)" }}
      >
        {value ? ENERGY_LABELS[value] : "TAP TO SET"}
      </span>
    </div>
  );
}
