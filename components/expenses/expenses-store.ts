"use client";
import { create } from "zustand";
import { format } from "date-fns";
import {
  getMoneyBalance,
  setMoneyBalance,
  listExpenses,
  createExpense,
  deleteExpense,
  deleteAllExpenses,
  createArchive,
  listArchives,
  deleteArchive,
  type MoneyBalance,
  type Expense,
  type ExpenseInput,
  type ExpenseArchive,
  type ArchivedTxn,
} from "@/lib/db/expenses-repository";

// ── Period helpers ────────────────────────────────────────────
const currentPeriod = () => format(new Date(), "yyyy-MM");
const periodLabel = (p: string) => {
  const d = new Date(`${p}-01T00:00:00`);
  return isNaN(d.getTime()) ? p : format(d, "MMMM yyyy");
};

function toArchivedTxns(expenses: Expense[]): ArchivedTxn[] {
  return expenses.map((e) => ({
    amount: e.amount,
    description: e.description,
    account: e.account,
    category: e.category,
    type: e.type,
    spentAt: e.spentAt,
  }));
}

/** Build the archive payload for a month's data. */
function buildArchive(period: string, balance: MoneyBalance, expenses: Expense[]) {
  let incomeTotal = 0;
  let expenseTotal = 0;
  for (const e of expenses) {
    if (e.type === "income") incomeTotal += e.amount;
    else expenseTotal += e.amount;
  }
  return {
    period,
    label: periodLabel(period),
    bankClosing: balance.bank,
    cashClosing: balance.cash,
    incomeTotal,
    expenseTotal,
    transactions: toArchivedTxns(expenses),
  };
}

const hasActivity = (balance: MoneyBalance, expenses: Expense[]) =>
  expenses.length > 0 || balance.bank !== 0 || balance.cash !== 0;

type State = {
  balance: MoneyBalance | null;
  expenses: Expense[];
  archives: ExpenseArchive[];
  loaded: boolean;

  load: () => Promise<void>;
  addExpense: (input: ExpenseInput) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  updateBalance: (patch: { bank: number; cash: number }) => Promise<void>;
  resetMonth: () => Promise<void>;
  hardReset: () => Promise<void>;
  removeArchive: (id: string) => Promise<void>;
};

export const useExpensesStore = create<State>()((set, get) => ({
  balance: null,
  expenses: [],
  archives: [],
  loaded: false,

  load: async () => {
    try {
      const [balance, expenses] = await Promise.all([
        getMoneyBalance(),
        listExpenses(),
      ]);

      let finalBalance = balance;
      let finalExpenses = expenses;
      let archives: ExpenseArchive[] = [];

      // Monthly rollover + archives require migration 0011. Keep this best-effort
      // so the tab still works normally if the migration hasn't been applied yet.
      try {
        const cur = currentPeriod();
        if (balance.period && balance.period !== cur) {
          // Month rolled over — archive the old month (if it had activity), then zero out.
          if (hasActivity(balance, expenses)) {
            await createArchive(buildArchive(balance.period, balance, expenses));
          }
          await deleteAllExpenses();
          finalBalance = await setMoneyBalance(balance.id, { bank: 0, cash: 0, period: cur });
          finalExpenses = [];
        } else if (!balance.period) {
          // First run since this feature shipped — stamp the current period, keep data.
          finalBalance = await setMoneyBalance(balance.id, { period: cur });
        }
        archives = await listArchives();
      } catch (rollErr) {
        console.warn("[Expenses] archive/rollover unavailable — run migration 0011:", rollErr);
      }

      set({ balance: finalBalance, expenses: finalExpenses, archives, loaded: true });
    } catch (e) {
      console.error("[Expenses] load error:", e);
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

  // Soft reset — archive the current month to Previous Expenses, then zero out.
  resetMonth: async () => {
    const { balance, expenses } = get();
    if (!balance) return;
    const period = balance.period ?? currentPeriod();
    if (hasActivity(balance, expenses)) {
      await createArchive(buildArchive(period, balance, expenses));
    }
    await deleteAllExpenses();
    const updated = await setMoneyBalance(balance.id, { bank: 0, cash: 0, period: currentPeriod() });
    const archives = await listArchives();
    set({ expenses: [], balance: updated, archives });
  },

  // Hard reset — permanently delete the current month (no archive) and zero balances.
  hardReset: async () => {
    const { balance } = get();
    await deleteAllExpenses();
    let updated = balance;
    if (balance) {
      updated = await setMoneyBalance(balance.id, { bank: 0, cash: 0, period: currentPeriod() });
    }
    set({ expenses: [], balance: updated });
  },

  removeArchive: async (id) => {
    await deleteArchive(id);
    set((s) => ({ archives: s.archives.filter((a) => a.id !== id) }));
  },
}));
