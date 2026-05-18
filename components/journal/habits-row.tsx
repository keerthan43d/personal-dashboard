"use client";
import { cn } from "@/lib/utils";
import type { JournalHabit } from "@/lib/db/schemas";

interface Props {
  habits:   JournalHabit[];
  checked:  Record<string, boolean>;
  onChange: (checked: Record<string, boolean>) => void;
}

export function HabitsRow({ habits, checked, onChange }: Props) {
  const active = habits.filter((h) => h.active);

  if (active.length === 0) {
    return (
      <p className="text-xs text-white/25 italic">
        No habits configured. Add some in Settings → Habits.
      </p>
    );
  }

  function toggle(name: string) {
    onChange({ ...checked, [name]: !checked[name] });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {active.map((h) => (
        <button
          key={h.id}
          onClick={() => toggle(h.name)}
          className={cn(
            "px-3 py-1.5 text-[11px] font-black tracking-[0.1em] uppercase border transition-all duration-100",
            checked[h.name]
              ? "border-[#FFD600]/50 bg-[#FFD600]/8 text-[#FFD600]"
              : "border-white/10 text-white/35 hover:border-white/20 hover:text-white/55"
          )}
        >
          {h.name}
        </button>
      ))}
    </div>
  );
}
