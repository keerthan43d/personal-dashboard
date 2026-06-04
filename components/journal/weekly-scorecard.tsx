"use client";
import { useEffect, useCallback, useRef, useMemo } from "react";
import { startOfWeek, format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useProductivity } from "@/lib/hooks/use-productivity";
import type { WeeklyScorecardInput } from "@/lib/db/schemas";

const DIMENSIONS = [
  { key: "deepWorkScore",   label: "DEEP WORK",  sub: "did I protect blocks?" },
  { key: "shippedScore",    label: "SHIPPED",     sub: "did I ship something?" },
  { key: "oneProjectScore", label: "ONE FOCUS",   sub: "stayed on one project?" },
] as const;

type ScoreKey = (typeof DIMENSIONS)[number]["key"];

interface Props {
  /** The day being viewed in the journal (yyyy-MM-dd). Defaults to today. */
  date?: string;
}

export function WeeklyScorecard({ date }: Props) {
  const { scorecard, scorecards, loadScorecard, loadScorecards, saveScorecard } = useProductivity();
  const pendingRef = useRef<WeeklyScorecardInput | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const weekStart = useMemo(() => {
    const base = date ? parseISO(date) : new Date();
    return format(startOfWeek(base, { weekStartsOn: 1 }), "yyyy-MM-dd");
  }, [date]);

  const weekLabel = useMemo(() => {
    const base = date ? parseISO(date) : new Date();
    return `WEEK OF ${format(startOfWeek(base, { weekStartsOn: 1 }), "d MMM").toUpperCase()}`;
  }, [date]);

  useEffect(() => {
    loadScorecard(weekStart);
    loadScorecards();
  }, [weekStart, loadScorecard, loadScorecards]);

  // Debounced save
  const debouncedSave = useCallback(
    (data: WeeklyScorecardInput) => {
      pendingRef.current = data;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (pendingRef.current) {
          saveScorecard(pendingRef.current);
          pendingRef.current = null;
        }
      }, 600);
    },
    [saveScorecard],
  );

  // Flush any pending save when the week changes or on unmount, then reset
  // so optimistic values never carry across weeks.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (pendingRef.current) saveScorecard(pendingRef.current);
      pendingRef.current = null;
    };
  }, [weekStart, saveScorecard]);

  function handleScore(key: ScoreKey, value: number) {
    const current: WeeklyScorecardInput = {
      weekStart,
      deepWorkScore: scorecard?.deepWorkScore ?? undefined,
      shippedScore: scorecard?.shippedScore ?? undefined,
      oneProjectScore: scorecard?.oneProjectScore ?? undefined,
      ...pendingRef.current,
      [key]: value,
    };
    debouncedSave(current);
  }

  function getScore(key: ScoreKey): number | undefined {
    // Prefer pending (optimistic) over stored
    if (pendingRef.current && pendingRef.current[key] != null) {
      return pendingRef.current[key] as number;
    }
    return scorecard?.[key] ?? undefined;
  }

  // Compute average
  const scores = DIMENSIONS.map((d) => getScore(d.key)).filter((v): v is number => v != null);
  const average = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : null;

  // Compute streak: consecutive past weeks with all 3 scores filled
  const streak = useMemo(() => {
    if (!scorecards.length) return 0;
    const sorted = [...scorecards]
      .filter((s) => s.weekStart < weekStart)
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

    let count = 0;
    for (const sc of sorted) {
      if (sc.deepWorkScore != null && sc.shippedScore != null && sc.oneProjectScore != null) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }, [scorecards, weekStart]);

  return (
    <div className="border border-white/8 bg-white/[0.018] p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black tracking-[0.12em] uppercase text-white/60">
          {weekLabel}
        </span>
        {streak > 0 && (
          <span className="text-[9px] font-black tracking-[0.08em] text-[#FFD600]/70">
            {streak}w streak
          </span>
        )}
      </div>

      {/* Dimensions */}
      <div className="space-y-3">
        {DIMENSIONS.map(({ key, label }) => {
          const current = getScore(key);
          return (
            <div key={key} className="space-y-1.5">
              <span className="text-[9px] font-black tracking-[0.1em] uppercase text-white/60">
                {label}
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleScore(key, n)}
                    className={cn(
                      "w-5 h-5 border transition-all duration-150",
                      current != null && n <= current
                        ? "border-[#FFD600] bg-[#FFD600]"
                        : "border-white/15 hover:border-white/30 bg-transparent",
                    )}
                  />
                ))}
                {current != null && (
                  <span className="font-mono text-sm text-white ml-1.5">{current}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Average */}
      {average != null && (
        <div className="flex items-center justify-between pt-2 border-t border-white/8">
          <span className="text-[9px] font-black tracking-[0.1em] uppercase text-white/40">
            Average
          </span>
          <span className="font-mono text-sm text-[#FFD600]">
            {average.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}
