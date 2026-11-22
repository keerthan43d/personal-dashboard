"use client";
import { useMemo } from "react";
import { parseISO, differenceInCalendarDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer, Tooltip } from "recharts";
import type { Camp } from "@/lib/db/fight-camp-repository";
import { Micro, COPPER, GREEN, AMBER } from "./shared";

/**
 * Cut chart (spec §8): plots the weight TREND (rolling average of the last 7
 * weigh-ins) against a straight planned line from start → target weight, so a
 * single heavy/light day doesn't swing the read. Pace comes from the engine.
 */
export function CutChart({ camp, weights, trendWeight, progressPct, onPace }: {
  camp: Camp;
  weights: { date: string; weight: number }[];
  trendWeight: number | null;
  progressPct: number | null;
  onPace: boolean | null;
}) {
  const start = parseISO(camp.startDate);
  const wStart = camp.weightStart ?? (weights.length ? weights[0].weight : null);
  const wTarget = camp.weightTarget;

  const data = useMemo(() => {
    const pts = weights
      .filter((w) => w.date >= camp.startDate)
      .map((w) => ({ day: differenceInCalendarDays(parseISO(w.date), start) + 1, weight: w.weight }))
      .filter((p) => p.day >= 1 && p.day <= camp.lengthDays)
      .sort((a, b) => a.day - b.day);
    // Rolling 7-point trend + planned straight line at each weigh-in day.
    return pts.map((p, i) => {
      const window = pts.slice(Math.max(0, i - 6), i + 1).map((x) => x.weight);
      const trend = Math.round((window.reduce((a, b) => a + b, 0) / window.length) * 10) / 10;
      const planned = wStart != null && wTarget != null
        ? Math.round((wStart + (wTarget - wStart) * (p.day / camp.lengthDays)) * 10) / 10
        : null;
      return { day: p.day, trend, planned };
    });
  }, [weights, camp, start, wStart, wTarget]);

  const yDomain: [number, number] | undefined = wTarget != null && wStart != null
    ? [Math.min(wTarget, trendWeight ?? wTarget) - 1, Math.max(wStart, data[0]?.trend ?? wStart) + 1]
    : undefined;

  return (
    <div className="border border-white/8 bg-white/[0.015] p-3.5">
      <div className="flex items-center justify-between mb-2">
        <Micro>
          {camp.mode === "cut" ? "Cut" : "Weight"} trend
          {wStart != null && wTarget != null ? ` · ${wStart} → ${wTarget} kg` : ""}
        </Micro>
        {progressPct != null && (
          <span className="text-[9px] font-black tracking-[0.1em] uppercase tabular-nums" style={{ color: onPace ? GREEN : AMBER }}>
            {progressPct}% · {onPace ? "On pace" : "Behind"}
          </span>
        )}
      </div>

      {data.length < 2 ? (
        <div className="flex items-center justify-center h-[150px] text-[10px] font-bold tracking-[0.06em] uppercase text-white/25 text-center px-6">
          Log your weight in the daily check-in for a couple of days to see the cut curve.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 6, right: 8, left: -22, bottom: 0 }}>
            <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontFamily: "monospace" }} axisLine={false} tickLine={false}
              ticks={[1, Math.round(camp.lengthDays / 2), camp.lengthDays]} domain={[1, camp.lengthDays]} type="number" />
            <YAxis domain={yDomain ?? ["dataMin - 1", "dataMax + 1"]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }} axisLine={false} tickLine={false} width={40} />
            {wTarget != null && (
              <ReferenceLine y={wTarget} stroke={GREEN} strokeDasharray="4 3" strokeWidth={1}
                label={{ value: `target ${wTarget}`, fill: "rgba(107,217,138,0.7)", fontSize: 8, position: "insideBottomRight" }} />
            )}
            <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0 }}
              labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }} itemStyle={{ fontSize: 11 }}
              labelFormatter={(d) => `Day ${d}`} formatter={(v, n) => [`${v} kg`, n === "trend" ? "Trend" : "Planned"]} />
            {wStart != null && wTarget != null && (
              <Line type="linear" dataKey="planned" stroke="rgba(255,255,255,0.25)" strokeWidth={1} strokeDasharray="3 3" dot={false} activeDot={false} isAnimationActive={false} />
            )}
            <Line type="monotone" dataKey="trend" stroke={COPPER} strokeWidth={1.8} dot={{ r: 2, fill: COPPER }} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
