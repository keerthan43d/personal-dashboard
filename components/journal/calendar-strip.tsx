"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, format, isToday, parseISO, addMonths, subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOOD_COLORS, MOOD_LABELS } from "@/lib/journal-constants";
import type { JournalEntry } from "@/lib/db/schemas";

interface Props {
  entries:      JournalEntry[];
  activeDate:   string;
  currentMonth?: Date;
}

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function CalendarStrip({ entries, activeDate, currentMonth }: Props) {
  const router = useRouter();
  const [viewMonth, setViewMonth] = useState<Date>(currentMonth ?? new Date());

  // Resync the viewed month when the selected date jumps to a different month
  // (e.g. day-nav or picking a day), but otherwise let the arrows browse freely.
  const monthKey = format(currentMonth ?? new Date(), "yyyy-MM");
  const prevKeyRef = useRef(monthKey);
  useEffect(() => {
    if (prevKeyRef.current !== monthKey) {
      setViewMonth(currentMonth ?? new Date());
      prevKeyRef.current = monthKey;
    }
  }, [monthKey, currentMonth]);

  const month  = viewMonth;
  const days   = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const offset = getDay(startOfMonth(month));

  const entryMap  = new Map(entries.map((e) => [e.date, e]));

  // Mood frequency for this month's entries
  const moodCount = entries
    .filter((e) => e.date.startsWith(format(month, "yyyy-MM")))
    .reduce((acc, e) => {
      if (e.mood) acc[e.mood] = (acc[e.mood] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

  const hasMoodData = Object.keys(moodCount).length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-4 bg-[#FFD600]" />
          <p className="text-[10px] font-black tracking-[0.14em] uppercase text-white">
            {format(month, "MMMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMonth((m) => subMonths(m, 1))}
            className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white border border-white/10 hover:border-white/25 transition-all cursor-pointer"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white border border-white/10 hover:border-white/25 transition-all cursor-pointer"
            aria-label="Next month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mood legend */}
      {hasMoodData && (
        <div className="flex items-center gap-3 flex-wrap">
          {[1, 2, 3, 4, 5].map((n) =>
            moodCount[n] ? (
              <div key={n} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2"
                  style={{ backgroundColor: MOOD_COLORS[n] }}
                />
                <span className="text-[8px] font-black tracking-[0.08em] uppercase text-white/70">
                  {moodCount[n]}
                </span>
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[7px] font-black tracking-[0.08em] uppercase text-white/60 py-1">
            {d}
          </div>
        ))}

        {Array.from({ length: offset }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {days.map((day) => {
          const dateStr  = format(day, "yyyy-MM-dd");
          const entry    = entryMap.get(dateStr);
          const isActive = dateStr === activeDate;
          const todayDay = isToday(day);
          const moodColor = entry?.mood ? MOOD_COLORS[entry.mood] : null;

          return (
            <button
              key={dateStr}
              onClick={() => router.push(`/journal?date=${dateStr}`)}
              className={cn(
                "relative flex flex-col items-center justify-center h-8 transition-all duration-150 cursor-pointer",
                "text-[10px] font-black",
                isActive
                  ? "text-white border border-[#FFD600]/70 bg-[#FFD600]/8"
                  : entry
                  ? "text-white hover:text-white/90 hover:bg-white/[0.04]"
                  : "text-white/60 hover:text-white/45 hover:bg-white/[0.03]",
                !isActive && todayDay && "border border-white/20"
              )}
              style={
                isActive
                  ? { boxShadow: "0 0 12px rgba(255,214,0,0.15)" }
                  : undefined
              }
            >
              {format(day, "d")}
              {moodColor && (
                <div
                  className="absolute bottom-0.5 w-1.5 h-1.5"
                  style={{ backgroundColor: moodColor }}
                />
              )}
              {entry && !entry.mood && (
                <div className="absolute bottom-0.5 w-1.5 h-1.5 bg-white/20" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
