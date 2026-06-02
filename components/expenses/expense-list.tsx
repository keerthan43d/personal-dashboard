"use client";
import { Landmark, Coins, Trash2, Receipt } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { formatMoney } from "@/lib/utils/format";
import { useExpensesStore } from "./expenses-store";
import type { Expense } from "@/lib/db/expenses-repository";

function fmtDate(iso: string): string {
  const d = parseISO(iso);
  return isValid(d) ? format(d, "EEE · dd MMM yyyy") : iso;
}

function ExpenseRow({ expense }: { expense: Expense }) {
  const removeExpense = useExpensesStore((s) => s.removeExpense);
  const isBank = expense.account === "bank";
  const isIncome = expense.type === "income";

  return (
    <div className="group flex items-center gap-3 border border-white/8 bg-white/[0.02] px-3 py-2.5 hover:border-white/15 transition-colors">
      {/* Account badge */}
      <span
        className="flex items-center gap-1 text-[8px] font-black tracking-[0.08em] uppercase px-1.5 py-1 border shrink-0"
        style={{
          color: isBank ? "#FFD600" : "#00C9A7",
          borderColor: isBank ? "rgba(255,214,0,0.4)" : "rgba(0,201,167,0.4)",
        }}
      >
        {isBank ? <Landmark className="w-2.5 h-2.5" /> : <Coins className="w-2.5 h-2.5" />}
        {expense.account}
      </span>

      {/* Description + category */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white truncate">{expense.description}</p>
        {expense.category && (
          <p className="text-[10px] text-white/35 mt-0.5 truncate uppercase tracking-[0.08em] font-bold">
            {expense.category}
          </p>
        )}
      </div>

      {/* Amount */}
      <span
        className="text-[14px] font-mono font-bold tabular-nums shrink-0"
        style={{ color: isIncome ? "#2ECC71" : "#FF5C5C" }}
      >
        {isIncome ? "+" : "−"}
        {formatMoney(expense.amount)}
      </span>

      {/* Delete */}
      <button
        onClick={() => removeExpense(expense.id)}
        className="text-white/20 hover:text-[#E60012] transition-colors opacity-0 group-hover:opacity-100 shrink-0"
        aria-label="Delete transaction (reverses the balance)"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ExpenseList() {
  const expenses = useExpensesStore((s) => s.expenses);

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Receipt className="w-8 h-8 text-white/10" strokeWidth={1.5} />
        <p className="text-[11px] font-black tracking-[0.12em] uppercase text-white/20">
          No transactions yet
        </p>
        <p className="text-[10px] text-white/15 font-mono">
          Add one above — deduct an expense or log income
        </p>
      </div>
    );
  }

  // Group by spent_at date (already sorted desc by the query).
  const groups: { date: string; items: Expense[]; spent: number }[] = [];
  for (const e of expenses) {
    let g = groups.find((x) => x.date === e.spentAt);
    if (!g) {
      g = { date: e.spentAt, items: [], spent: 0 };
      groups.push(g);
    }
    g.items.push(e);
    if (e.type === "expense") g.spent += e.amount;
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <div key={group.date} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-[0.12em] uppercase text-white/40">
              {fmtDate(group.date)}
            </span>
            {group.spent > 0 && (
              <span className="text-[10px] font-mono font-bold text-[#FF5C5C]/70 tabular-nums">
                −{formatMoney(group.spent)}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {group.items.map((e) => (
              <ExpenseRow key={e.id} expense={e} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
