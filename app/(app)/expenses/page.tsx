"use client";
import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExpensesStore } from "@/components/expenses/expenses-store";
import { BalanceCards } from "@/components/expenses/balance-cards";
import { AddExpenseForm } from "@/components/expenses/add-expense-form";
import { ExpenseList } from "@/components/expenses/expense-list";
import { WeeklyView } from "@/components/expenses/weekly-view";
import { MonthlyView } from "@/components/expenses/monthly-view";
import { EditBalanceDialog } from "@/components/expenses/edit-balance-dialog";

type View = "daily" | "weekly" | "monthly";

export default function ExpensesPage() {
  const { load, loaded } = useExpensesStore();
  const [editOpen, setEditOpen] = useState(false);
  const [view, setView] = useState<View>("daily");

  useEffect(() => {
    if (!loaded) load();
  }, [loaded, load]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-[#FFD600]" strokeWidth={1.5} />
          <div>
            <h1 className="text-[18px] font-black tracking-[0.1em] uppercase text-white leading-none">
              EXPENSES
            </h1>
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/30 mt-1">
              TRACK YOUR MONEY · BANK &amp; CASH
            </p>
          </div>
        </div>

        {/* View tabs */}
        <div className="flex items-center gap-1">
          {(["daily", "weekly", "monthly"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-3 py-1.5 text-[10px] font-black tracking-[0.12em] uppercase transition-all",
                view === v
                  ? "bg-[#FFD600] text-black"
                  : "text-white/40 hover:text-white border border-white/10 hover:border-white/20"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {!loaded ? (
          <div className="flex items-center justify-center py-28">
            <div className="flex flex-col items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#FFD600] border-t-transparent animate-spin" />
              <p className="text-[10px] font-black tracking-[0.14em] uppercase text-white/30">
                LOADING
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-6 max-w-4xl">
            <BalanceCards onEdit={() => setEditOpen(true)} />
            <AddExpenseForm />
            {view === "daily" && <ExpenseList />}
            {view === "weekly" && <WeeklyView />}
            {view === "monthly" && <MonthlyView />}
          </div>
        )}
      </div>

      <EditBalanceDialog open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  );
}
