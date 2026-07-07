"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { getHourLog, saveHourLog, type HourNotes } from "@/lib/db/hour-log-repository";

// Rigid schedule: 9 AM → 7 PM as ten one-hour blocks (start hours, 24h).
const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18] as const;

function to12(h: number): { h12: number; mer: "AM" | "PM" } {
  const mer = h < 12 ? "AM" : "PM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return { h12, mer };
}

function blockLabel(h: number): string {
  const s = to12(h);
  const e = to12(h + 1);
  return s.mer === e.mer
    ? `${s.h12}–${e.h12} ${s.mer}`
    : `${s.h12} ${s.mer}–${e.h12} ${e.mer}`;
}

interface Props {
  /** The day being viewed (yyyy-MM-dd). */
  entryDate: string;
  /** The real current date (yyyy-MM-dd) — used to highlight the live hour. */
  today: string;
}

export function HourLogSection({ entryDate, today }: Props) {
  const [notes, setNotes] = useState<HourNotes>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<HourNotes>({});

  // Load this day's log; reset when the date changes.
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    (async () => {
      try {
        const data = await getHourLog(entryDate);
        if (cancelled) return;
        setNotes(data);
        latest.current = data;
      } catch (e) {
        console.error("[HourLog] load error — migration may not have run yet:", e);
        if (!cancelled) { setNotes({}); latest.current = {}; }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [entryDate]);

  const scheduleSave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setSaving(true);
    timer.current = setTimeout(async () => {
      try {
        await saveHourLog(entryDate, latest.current);
      } catch (e) {
        console.error("[HourLog] save error:", e);
      } finally {
        setSaving(false);
      }
    }, 700);
  }, [entryDate]);

  function onChange(hour: number, value: string) {
    setNotes((prev) => {
      const next = { ...prev };
      if (value) next[hour] = value;
      else delete next[hour];
      latest.current = next;
      return next;
    });
    scheduleSave();
  }

  const isToday = entryDate === today;
  const nowHour = new Date().getHours();

  return (
    <div className="space-y-1.5">
      {HOURS.map((h) => {
        const active = isToday && nowHour === h;
        return (
          <div
            key={h}
            className={cn(
              "flex items-stretch border bg-white/[0.02] transition-colors",
              active ? "border-[#F59E0B]/40" : "border-white/8"
            )}
          >
            <div
              className={cn(
                "w-[104px] flex-shrink-0 flex items-center gap-1.5 px-3 border-r text-[10px] font-black tracking-[0.04em] uppercase tabular-nums",
                active ? "border-[#F59E0B]/30 text-[#F59E0B]" : "border-white/8 text-white/45"
              )}
            >
              {active && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] flex-shrink-0"
                  style={{ boxShadow: "0 0 6px rgba(245,158,11,0.7)" }}
                />
              )}
              {blockLabel(h)}
            </div>
            <input
              value={notes[h] ?? ""}
              onChange={(e) => onChange(h, e.target.value)}
              placeholder="—"
              disabled={!loaded}
              autoComplete="off"
              data-1p-ignore
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white/85 placeholder:text-white/20 outline-none focus:bg-white/[0.02] min-w-0 disabled:opacity-50"
            />
          </div>
        );
      })}

      {saving && (
        <p className="text-[9px] font-black tracking-[0.12em] uppercase text-white/40 pt-0.5">
          Saving…
        </p>
      )}
    </div>
  );
}
