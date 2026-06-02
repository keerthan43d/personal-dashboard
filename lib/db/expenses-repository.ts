"use client";
import { v4 as uuid } from "uuid";
import { getSupabase } from "./supabase-client";

export type ExpenseAccount = "bank" | "cash";
export type TxType = "expense" | "income";

export type MoneyBalance = {
  id: string;
  bank: number;
  cash: number;
  updatedAt: string;
};

export type Expense = {
  id: string;
  amount: number;
  description: string;
  account: ExpenseAccount;
  category: string | null;
  type: TxType;
  spentAt: string; // YYYY-MM-DD
  createdAt: string;
};

export type ExpenseInput = {
  amount: number;
  description: string;
  account: ExpenseAccount;
  category?: string | null;
  type: TxType;
  spentAt: string;
};

const now = () => new Date().toISOString();

function fail(error: { message: string } | null, ctx: string): never {
  throw new Error(`[Expenses] ${ctx}: ${error?.message ?? "unknown error"}`);
}

type BalanceRow = {
  id: string;
  bank_balance: number | string;
  cash_balance: number | string;
  updated_at: string;
};

function fromBalanceRow(r: BalanceRow): MoneyBalance {
  return {
    id: r.id,
    bank: Number(r.bank_balance),
    cash: Number(r.cash_balance),
    updatedAt: r.updated_at,
  };
}

type ExpenseRow = {
  id: string;
  amount: number | string;
  description: string;
  account: string;
  category: string | null;
  type: string | null;
  spent_at: string;
  created_at: string;
};

function fromExpenseRow(r: ExpenseRow): Expense {
  return {
    id: r.id,
    amount: Number(r.amount),
    description: r.description,
    account: r.account as ExpenseAccount,
    category: r.category ?? null,
    type: (r.type as TxType) ?? "expense",
    spentAt: r.spent_at,
    createdAt: r.created_at,
  };
}

// ─── Balance (singleton) ──────────────────────────────────────

export async function getMoneyBalance(): Promise<MoneyBalance> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("money_balance")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) fail(error, "getMoneyBalance");
  if (data) return fromBalanceRow(data as BalanceRow);

  // No row yet — create the singleton with zero balances.
  const row = { id: uuid(), bank_balance: 0, cash_balance: 0, updated_at: now() };
  const { data: created, error: e2 } = await sb
    .from("money_balance")
    .insert(row)
    .select()
    .single();
  if (e2) fail(e2, "getMoneyBalance(create)");
  return fromBalanceRow(created as BalanceRow);
}

export async function setMoneyBalance(
  id: string,
  patch: { bank?: number; cash?: number }
): Promise<MoneyBalance> {
  const upd: Record<string, unknown> = { updated_at: now() };
  if (patch.bank !== undefined) upd.bank_balance = patch.bank;
  if (patch.cash !== undefined) upd.cash_balance = patch.cash;
  const { data, error } = await getSupabase()
    .from("money_balance")
    .update(upd)
    .eq("id", id)
    .select()
    .single();
  if (error) fail(error, "setMoneyBalance");
  return fromBalanceRow(data as BalanceRow);
}

// ─── Expenses ─────────────────────────────────────────────────

export async function listExpenses(): Promise<Expense[]> {
  const { data, error } = await getSupabase()
    .from("expenses")
    .select("*")
    .order("spent_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) fail(error, "listExpenses");
  return ((data ?? []) as ExpenseRow[]).map(fromExpenseRow);
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const row = {
    id: uuid(),
    amount: input.amount,
    description: input.description,
    account: input.account,
    category: input.category ?? null,
    type: input.type,
    spent_at: input.spentAt,
    created_at: now(),
  };
  const { data, error } = await getSupabase()
    .from("expenses")
    .insert(row)
    .select()
    .single();
  if (error) fail(error, "createExpense");
  return fromExpenseRow(data as ExpenseRow);
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await getSupabase().from("expenses").delete().eq("id", id);
  if (error) fail(error, "deleteExpense");
}
