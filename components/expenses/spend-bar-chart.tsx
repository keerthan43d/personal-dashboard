"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { COLORS } from "./constants";

export type BarDatum = { label: string; amount: number; highlight?: boolean };

type Props = {
  data: BarDatum[];
  height?: number;
  interval?: number;
};

export function SpendBarChart({ data, height = 160, interval = 0 }: Props) {
  const hasData = data.some((d) => d.amount > 0);

  if (!hasData) {
    return (
      <div
        className="flex items-center justify-center text-white/20 text-[11px] font-mono"
        style={{ height }}
      >
        No spend to chart
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
          interval={interval}
        />
        <YAxis
          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9, fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${v}`}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 0 }}
          labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontFamily: "monospace" }}
          itemStyle={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}
          formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Spent"]}
        />
        <Bar dataKey="amount" name="Spent">
          {data.map((d, i) => (
            <Cell key={i} fill={d.highlight ? "#FFFFFF" : COLORS.bank} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
