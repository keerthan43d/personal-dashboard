"use client";
import { formatMoney } from "@/lib/utils/format";

export type SummaryItem = {
  label: string;
  value: number;
  tone: "neutral" | "red" | "green";
  sign?: "+" | "−" | "";
};

const TONE: Record<SummaryItem["tone"], string> = {
  neutral: "#FFFFFF",
  red: "#FF5C5C",
  green: "#2ECC71",
};

export function SummaryCards({ items }: { items: SummaryItem[] }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((it) => (
        <div key={it.label} className="border border-white/8 bg-white/[0.018] px-4 py-3">
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-white/35">
            {it.label}
          </p>
          <p
            className="text-[18px] font-mono font-bold tabular-nums mt-1.5"
            style={{ color: TONE[it.tone] }}
          >
            {it.sign ?? ""}
            {formatMoney(Math.abs(it.value))}
          </p>
        </div>
      ))}
    </div>
  );
}
