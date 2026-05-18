"use client";
import { useRouter } from "next/navigation";
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, format, isSameDay, isToday, parseISO,
} from "date-fns";
import { cn } from "@/lib/utils";
import { MOOD_COLORS } from "@/lib/journal-constants";
import type { JournalEntry } from "@/lib/db/schemas";

interface Props {
  entries:     JournalEntry[];
  activeDate:  string; // "YYYY-MM-DD"
  currentMonth?: Date;
}

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarStrip({ entries, activeDate, currentMonth }: Props) {
  const router = useRouter();
  const month  = currentMonth ?? new Date();
  const days   = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const offset = getDay(startOfMonth(month)); // 0=Sun

  const entryMap = new Map(entries.map((e) => [e.date, e]));

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black tracking-[0.12em] uppercase text-white/35">
        {format(month, "MMMM yyyy")}
      </p>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-0.5">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[8px] font-black tracking-[0.08em] uppercase text-white/20 py-1">
            {d}
          </div>
        ))}

        {/* Empty cells before first day */}
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const entry   = entryMap.get(dateStr);
          const isActive = dateStr === activeDate;
          const todayDay = isToday(day);

          return (
            <button
              key={dateStr}
              onClick={() => router.push(`/journal?date=${dateStr}`)}
              className={cn(
                "relative flex flex-col items-center justify-center h-8 transition-all duration-100",
                "text-[11px] font-black",
                isActive
                  ? "text-white"
                  : entry
                    ? "text-white/60 hover:text-white/80"
                    : "text-white/20 hover:text-white/40",
                isActive && "border border-[#FFD600]/50 bg-[#FFD600]/5",
                !isActive && todayDay && "border border-white/15",
                !isActive && !todayDay && "hover:bg-white/[0.03]"
              )}
            >
              {format(day, "d")}
              {entry?.mood && (
                <span
                  className="absolute bottom-0.5 w-1.5 h-1.5"
                  style={{ borderRadius: "50%", backgroundColor: MOOD_COLORS[entry.mood] }}
                />
              )}
              {entry && !entry.mood && (
                <span
                  className="absolute bottom-0.5 w-1.5 h-1.5 bg-white/20"
                  style={{ borderRadius: "50%" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
