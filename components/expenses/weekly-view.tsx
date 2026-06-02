"use client";
import { useMemo } from "react";
import { startOfWeek, addDays, format, isSameDay, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/utils/format";
import { useExpensesStore } from "./expenses-store";
import { SummaryCards } from "./summary-cards";
import { CategoryBars } from "./category-bars";
import { SpendBarChart, type BarDatum } from "./spend-bar-chart";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeeklyView() {
  const expenses = useExpensesStore((s) => s.expenses);

  const { days, totalSpent, totalIncome, txCount, categories, chart } = useMemo(() => {
    const now = new Date();
    const monday = startOfWeek(now, { weekStartsOn: 1 });

    const days = DAY_NAMES.map((name, i) => {
      const date = addDays(monday, i);
      const iso = format(date, "yyyy-MM-dd");
      const dayTx = expenses.filter((e) => e.spentAt === iso);
      const spent = dayTx.filter((e) => e.type === "expense").reduce((a, e) => a + e.amount, 0);
      const count = dayTx.length;
      return { name, date, iso, spent, count, isToday: isSameDay(date, now) };
    });

    const weekTx = expenses.filter((e) => days.some((d) => d.iso === e.spentAt));
    const totalSpent = weekTx.filter((e) => e.type === "expense").reduce((a, e) => a + e.amount, 0);
    const totalIncome = weekTx.filter((e) => e.type === "income").reduce((a, e) => a + e.amount, 0);
    const txCount = weekTx.filter((e) => e.type === "expense").length;

    const categories: Record<string, number> = {};
    for (const e of weekTx) {
      if (e.type !== "expense") continue;
      const c = e.category || "Other";
      categories[c] = (categories[c] ?? 0) + e.amount;
    }

    const chart: BarDatum[] = days.map((d) => ({
      label: d.name,
      amount: d.spent,
      highlight: d.isToday,
    }));

    return { days, totalSpent, totalIncome, txCount, categories, chart };
  }, [expenses]);

  const avg = totalSpent / 7;

  return (
    <div className="flex flex-col gap-6">
      {/* Week grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => (
          <div
            key={d.iso}
            className={cn(
              "border bg-white/[0.018] px-2 py-3 text-center",
              d.isToday ? "border-[#FFD600]" : "border-white/8"
            )}
          >
            <p className="text-[9px] font-black tracking-[0.08em] uppercase text-white/35">
              {d.name}
            </p>
            <p className="text-[12px] font-mono font-bold text-white mt-1.5 tabular-nums">
              {d.spent ? formatMoney(d.spent) : "–"}
            </p>
            <p className="text-[9px] font-mono text-white/25 mt-0.5 h-3">
              {d.count ? `${d.count} tx` : ""}
            </p>
          </div>
        ))}
      </div>

      <SummaryCards
        items={[
          { label: "Total spent", value: totalSpent, tone: "red", sign: "−" },
          { label: "Daily avg", value: avg, tone: "neutral" },
          { label: "Income", value: totalIncome, tone: "green", sign: "+" },
        ]}
      />

      <CategoryBars title="BY CATEGORY · THIS WEEK" categories={categories} />

      <div className="border border-white/8 bg-white/[0.018]">
        <div className="flex items-center gap-0 border-b border-white/8">
          <div className="w-0.5 self-stretch bg-[#FFD600]" />
          <span className="px-4 py-2.5 text-[10px] font-black tracking-[0.16em] uppercase text-white/70">
            DAILY SPEND · THIS WEEK
          </span>
        </div>
        <div className="p-4">
          <SpendBarChart data={chart} />
        </div>
      </div>
    </div>
  );
}
