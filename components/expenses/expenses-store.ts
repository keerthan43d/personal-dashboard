"use client";
import { create } from "zustand";
import {
  getMoneyBalance,
  setMoneyBalance,
  listExpenses,
  createExpense,
  deleteExpense,
  type MoneyBalance,
  type Expense,
  type ExpenseInput,
} from "@/lib/db/expenses-repository";

type State = {
  balance: MoneyBalance | null;
  expenses: Expense[];
  loaded: boolean;

  load: () => Promise<void>;
  addExpense: (input: ExpenseInput) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  updateBalance: (patch: { bank: number; cash: number }) => Promise<void>;
};

export const useExpensesStore = create<State>()((set, get) => ({
  balance: null,
  expenses: [],
  loaded: false,

  load: async () => {
    try {
      const [balance, expenses] = await Promise.all([
        getMoneyBalance(),
        listExpenses(),
      ]);
      set({ balance, expenses, loaded: true });
    } catch (e) {
      console.error("[Expenses] load error — migration may not have run yet:", e);
      set({ loaded: true });
    }
  },

  addExpense: async (input) => {
    const balance = get().balance;
    if (!balance) return;
    const expense = await createExpense(input);
    // Income adds to the account, expense deducts from it.
    const delta = input.type === "income" ? input.amount : -input.amount;
    const current = input.account === "bank" ? balance.bank : balance.cash;
    const updated = await setMoneyBalance(balance.id, {
      [input.account]: current + delta,
    });
    set((s) => ({ expenses: [expense, ...s.expenses], balance: updated }));
  },

  removeExpense: async (id) => {
    const balance = get().balance;
    const expense = get().expenses.find((e) => e.id === id);
    await deleteExpense(id);
    if (balance && expense) {
      // Reverse the transaction: refund an expense, claw back income.
      const delta = expense.type === "income" ? -expense.amount : expense.amount;
      const current = expense.account === "bank" ? balance.bank : balance.cash;
      const updated = await setMoneyBalance(balance.id, {
        [expense.account]: current + delta,
      });
      set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id), balance: updated }));
    } else {
      set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
    }
  },

  updateBalance: async (patch) => {
    const balance = get().balance;
    if (!balance) return;
    const updated = await setMoneyBalance(balance.id, patch);
    set({ balance: updated });
  },
}));
