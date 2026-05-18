"use client";
import { cn } from "@/lib/utils";
import { ENERGY_LABELS } from "@/lib/journal-constants";

interface Props {
  value?: number;
  onChange: (v: number) => void;
}

export function EnergyPicker({ value, onChange }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(value === n ? 0 : n)}
            title={`Energy: ${ENERGY_LABELS[n]}`}
            className={cn(
              "w-8 h-3 transition-all duration-150",
              (value ?? 0) >= n
                ? "bg-[#FFD600]"
                : "bg-white/10 hover:bg-white/20"
            )}
          />
        ))}
      </div>
      {value ? (
        <span className="text-[10px] font-black tracking-[0.1em] uppercase text-white/60">
          {ENERGY_LABELS[value]}
        </span>
      ) : (
        <span className="text-[10px] font-black tracking-[0.1em] uppercase text-white/35">
          tap to set
        </span>
      )}
    </div>
  );
}
