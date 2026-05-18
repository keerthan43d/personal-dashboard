"use client";
import { useMemo } from "react";
import { format, subDays, parseISO } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Dot,
} from "recharts";
import { MOOD_COLORS } from "@/lib/journal-constants";
import type { JournalEntry } from "@/lib/db/schemas";

interface Props {
  entries: JournalEntry[];
  days:    30 | 90 | 365;
}

export function MoodChart({ entries, days }: Props) {
  const data = useMemo(() => {
    const since = format(subDays(new Date(), days), "yyyy-MM-dd");
    const filtered = entries
      .filter((e) => e.date >= since && (e.mood || e.energy))
      .sort((a, b) => a.date.localeCompare(b.date));

    return filtered.map((e) => ({
      date:   format(parseISO(e.date), days <= 30 ? "MMM d" : "MMM d"),
      mood:   e.mood   ?? null,
      energy: e.energy ?? null,
      rawDate: e.date,
    }));
  }, [entries, days]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[160px] text-white/20 text-sm">
        No mood data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="date"
          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
          interval={days <= 30 ? 3 : days <= 90 ? 9 : 30}
        />
        <YAxis
          domain={[0, 6]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0 }}
          labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontFamily: "monospace" }}
          itemStyle={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}
        />
        <Line
          type="monotone"
          dataKey="mood"
          stroke="#FFD600"
          strokeWidth={1.5}
          dot={(props) => {
            const { cx, cy, value } = props;
            if (!value) return <></>;
            return (
              <circle
                cx={cx} cy={cy} r={4}
                fill={MOOD_COLORS[value as number] ?? "#FFD600"}
                stroke="none"
              />
            );
          }}
          connectNulls
          name="Mood"
        />
        <Line
          type="monotone"
          dataKey="energy"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth={1.5}
          dot={false}
          connectNulls
          name="Energy"
          strokeDasharray="4 2"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
