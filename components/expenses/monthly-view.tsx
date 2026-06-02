"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  addMonths,
  format,
} from "date-fns";
import { useExpensesStore } from "./expenses-store";
import { SummaryCards } from "./summary-cards";
import { CategoryBars } from "./category-bars";
import { SpendBarChart, type BarDatum } from "./spend-bar-chart";

export function MonthlyView() {
  const expenses = useExpensesStore((s) => s.expenses);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));

  const { totalSpent, totalIncome, net, categories, chart } = useMemo(() => {
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    const start = format(startOfMonth(viewMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(viewMonth), "yyyy-MM-dd");
    const daysInMonth = getDaysInMonth(viewMonth);

    const monthTx = expenses.filter((e) => e.spentAt >= start && e.spentAt <= end);
    const totalSpent = monthTx.filter((e) => e.type === "expense").reduce((a, e) => a + e.amount, 0);
    const totalIncome = monthTx.filter((e) => e.type === "income").reduce((a, e) => a + e.amount, 0);

    const categories: Record<string, number> = {};
    for (const e of monthTx) {
      if (e.type !== "expense") continue;
      const c = e.category || "Other";
      categories[c] = (categories[c] ?? 0) + e.amount;
    }

    const chart: BarDatum[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const spent = monthTx
        .filter((e) => e.spentAt === iso && e.type === "expense")
        .reduce((a, e) => a + e.amount, 0);
      chart.push({ label: String(d), amount: spent });
    }

    return { totalSpent, totalIncome, net: totalIncome - totalSpent, categories, chart };
  }, [expenses, viewMonth]);

  return (
    <div className="flex flex-col gap-6">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setViewMonth((v) => addMonths(v, -1))}
          className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white border border-white/10 hover:border-white/25 transition-all"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[13px] font-black tracking-[0.1em] uppercase text-white">
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={() => setViewMonth((v) => addMonths(v, 1))}
          className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white border border-white/10 hover:border-white/25 transition-all"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <SummaryCards
        items={[
          { label: "Total spent", value: totalSpent, tone: "red", sign: "−" },
          { label: "Income", value: totalIncome, tone: "green", sign: "+" },
          { label: "Net", value: net, tone: net >= 0 ? "green" : "red", sign: net >= 0 ? "+" : "−" },
        ]}
      />

      <div className="border border-white/8 bg-white/[0.018]">
        <div className="flex items-center gap-0 border-b border-white/8">
          <div className="w-0.5 self-stretch bg-[#FFD600]" />
          <span className="px-4 py-2.5 text-[10px] font-black tracking-[0.16em] uppercase text-white/70">
            DAILY SPEND · THIS MONTH
          </span>
        </div>
        <div className="p-4">
          <SpendBarChart data={chart} interval={2} />
        </div>
      </div>

      <CategoryBars title="BY CATEGORY · THIS MONTH" categories={categories} />
    </div>
  );
}
