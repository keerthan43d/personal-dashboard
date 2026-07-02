-- ─── Track which month the current data belongs to ──────────────
alter table money_balance add column if not exists period text;

-- ─── Archived months (Previous Expenses) ────────────────────────
create table if not exists expense_archives (
  id            uuid primary key default gen_random_uuid(),
  period        text not null,                 -- yyyy-MM being closed out
  label         text not null,                 -- e.g. "June 2026"
  bank_closing  numeric(14,2) not null default 0,
  cash_closing  numeric(14,2) not null default 0,
  income_total  numeric(14,2) not null default 0,
  expense_total numeric(14,2) not null default 0,
  txn_count     int not null default 0,
  transactions  jsonb not null default '[]'::jsonb,   -- full transaction snapshot
  created_at    timestamptz not null default now()
);
alter table expense_archives disable row level security;
create index if not exists expense_archives_created_at_idx on expense_archives (created_at desc);
