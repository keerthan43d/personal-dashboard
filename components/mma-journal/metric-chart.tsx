"use client";
import { useMemo, useId } from "react";
import { format, parseISO } from "date-fns";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import type { MmaMetric, MetricType } from "@/lib/db/mma-journal-repository";

interface Props {
  metrics: MmaMetric[];
  type: MetricType;
  color: string;
  height?: number;
}

export function MetricChart({ metrics, type, color, height = 96 }: Props) {
  const gradId = useId().replace(/:/g, "");
  const data = useMemo(() => {
    return metrics
      .filter((m) => m.type === type)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((m) => ({ date: format(parseISO(m.date), "MMM d"), value: m.value }));
  }, [metrics, type]);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center border border-dashed border-white/8 text-white/20 text-[10px] font-black uppercase tracking-[0.14em]"
        style={{ height }}
      >
        No trend yet
      </div>
    );
  }

  const isRating = type !== "weight";
  const axis = {
    stroke: "rgba(255,255,255,0.28)",
    fontSize: 9,
    fontFamily: "var(--font-jbmono, monospace)",
  };

  const tooltip = (
    <Tooltip
      cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1 }}
      contentStyle={{ background: "#000", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 0, padding: "4px 8px" }}
      labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 9, fontFamily: "var(--font-jbmono, monospace)", textTransform: "uppercase", letterSpacing: "0.1em" }}
      itemStyle={{ color, fontSize: 11, fontWeight: 700 }}
    />
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      {isRating ? (
        <LineChart data={data} margin={{ top: 6, right: 4, left: -26, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: axis.stroke, fontSize: axis.fontSize, fontFamily: axis.fontFamily }}
            axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={26} />
          <YAxis domain={[0, 10]} ticks={[0, 5, 10]} width={38}
            tick={{ fill: axis.stroke, fontSize: axis.fontSize }} axisLine={false} tickLine={false} />
          {tooltip}
          <Line type="stepAfter" dataKey="value" stroke={color} strokeWidth={2}
            dot={{ r: 2, fill: color, stroke: "none" }} activeDot={{ r: 4, fill: color }} name={type} />
        </LineChart>
      ) : (
        <AreaChart data={data} margin={{ top: 6, right: 4, left: -26, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: axis.stroke, fontSize: axis.fontSize, fontFamily: axis.fontFamily }}
            axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={26} />
          <YAxis domain={["auto", "auto"]} width={38}
            tick={{ fill: axis.stroke, fontSize: axis.fontSize }} axisLine={false} tickLine={false} />
          {tooltip}
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2}
            fill={`url(#${gradId})`} dot={{ r: 2, fill: color, stroke: "none" }} activeDot={{ r: 4, fill: color }} name={type} />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}
