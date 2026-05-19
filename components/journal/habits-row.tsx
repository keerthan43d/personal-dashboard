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
      <p className="text-xs text-white/70 italic">
        No habits configured. Add some in Settings → Habits.
      </p>
    );
  }

  function toggle(name: string) {
    onChange({ ...checked, [name]: !checked[name] });
  }

  const doneCount   = active.filter((h) => checked[h.name]).length;
  const totalCount  = active.length;

  return (
    <div className="space-y-3">
      {totalCount > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-0.5 bg-white/8">
            <div
              className="h-full bg-[#FFD600] transition-all duration-300"
              style={{ width: `${(doneCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="text-[9px] font-black tracking-[0.12em] uppercase text-white/75">
            {doneCount}/{totalCount}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {active.map((h) => {
          const isDone = !!checked[h.name];
          return (
            <button
              key={h.id}
              onClick={() => toggle(h.name)}
              className={cn(
                "relative px-3 py-1.5 text-[10px] font-black tracking-[0.1em] uppercase border transition-all duration-150 cursor-pointer overflow-hidden",
                isDone
                  ? "border-[#FFD600]/60 text-[#FFD600] bg-[#FFD600]/8"
                  : "border-white/10 text-white/75 hover:border-white/22 hover:text-white/60 hover:bg-white/[0.02]"
              )}
              style={
                isDone
                  ? { boxShadow: "0 0 10px rgba(255,214,0,0.12)" }
                  : undefined
              }
            >
              {isDone && (
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#FFD600]" />
              )}
              {h.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
