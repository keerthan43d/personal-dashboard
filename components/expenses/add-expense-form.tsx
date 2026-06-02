"use client";
import { useState } from "react";
import { Plus, Minus, Landmark, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExpensesStore } from "./expenses-store";
import { EXPENSE_CATEGORIES } from "./constants";
import type { ExpenseAccount, TxType } from "@/lib/db/expenses-repository";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function AddExpenseForm() {
  const addExpense = useExpensesStore((s) => s.addExpense);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [account, setAccount] = useState<ExpenseAccount>("bank");
  const [spentAt, setSpentAt] = useState(today());
  const [saving, setSaving] = useState<TxType | null>(null);

  const amountNum = parseFloat(amount);
  const valid = !Number.isNaN(amountNum) && amountNum > 0 && description.trim();

  const submit = async (type: TxType) => {
    if (!valid || saving) return;
    setSaving(type);
    try {
      await addExpense({
        amount: amountNum,
        description: description.trim(),
        account,
        category: category.trim() || null,
        type,
        spentAt,
      });
      setAmount("");
      setDescription("");
      setCategory("");
      setSpentAt(today());
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="border border-white/8 bg-white/[0.018]">
      <div className="flex items-center gap-0 border-b border-white/8">
        <div className="w-0.5 self-stretch bg-[#FFD600]" />
        <span className="px-4 py-2.5 text-[10px] font-black tracking-[0.16em] uppercase text-white">
          ADD TRANSACTION
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Row 1: amount + description */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative sm:w-40 flex-shrink-0">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[13px] font-mono">
              ₹
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 pl-7 pr-3 py-2 text-[14px] font-mono text-white placeholder:text-white/25 outline-none focus:border-white/30"
            />
          </div>
          <input
            type="text"
            placeholder="What was it for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1 bg-white/[0.04] border border-white/10 px-3 py-2 text-[13px] text-white placeholder:text-white/25 outline-none focus:border-white/30"
          />
        </div>

        {/* Row 2: account toggle + category + date */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center">
          <div className="flex items-center gap-1 flex-shrink-0">
            {(["bank", "cash"] as ExpenseAccount[]).map((acc) => (
              <button
                key={acc}
                type="button"
                onClick={() => setAccount(acc)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-[10px] font-black tracking-[0.1em] uppercase transition-all border",
                  account === acc
                    ? acc === "bank"
                      ? "bg-[#FFD600] text-black border-[#FFD600]"
                      : "bg-[#00C9A7] text-black border-[#00C9A7]"
                    : "text-white/40 border-white/10 hover:border-white/25 hover:text-white"
                )}
              >
                {acc === "bank" ? <Landmark className="w-3 h-3" /> : <Coins className="w-3 h-3" />}
                {acc}
              </button>
            ))}
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex-1 min-w-[140px] bg-white/[0.04] border border-white/10 px-3 py-2 text-[13px] text-white outline-none focus:border-white/30 [color-scheme:dark]"
          >
            <option value="" style={{ backgroundColor: "#0c0c0c", color: "#888" }}>
              Category (optional)
            </option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c} style={{ backgroundColor: "#0c0c0c", color: "#fff" }}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={spentAt}
            onChange={(e) => setSpentAt(e.target.value)}
            className="bg-white/[0.04] border border-white/10 px-3 py-2 text-[12px] font-mono text-white outline-none focus:border-white/30 [color-scheme:dark]"
          />
        </div>

        {/* Row 3: action buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => submit("expense")}
            disabled={!valid || saving !== null}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-[#E60012] text-white text-[10px] font-black tracking-[0.1em] uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white hover:text-black transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
            {saving === "expense" ? "DEDUCTING..." : "DEDUCT"}
          </button>
          <button
            type="button"
            onClick={() => submit("income")}
            disabled={!valid || saving !== null}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2ECC71] text-black text-[10px] font-black tracking-[0.1em] uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {saving === "income" ? "ADDING..." : "INCOME"}
          </button>
        </div>
      </div>
    </div>
  );
}
