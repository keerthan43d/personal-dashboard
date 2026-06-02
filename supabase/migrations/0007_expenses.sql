-- ─── Money Balance (singleton: bank + cash) ──────────────────
create table if not exists money_balance (
  id           uuid primary key default gen_random_uuid(),
  bank_balance numeric(14,2) not null default 0,
  cash_balance numeric(14,2) not null default 0,
  updated_at   timestamptz not null default now()
);
alter table money_balance disable row level security;

-- ─── Expenses ────────────────────────────────────────────────
create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  amount      numeric(14,2) not null,
  description text not null,
  account     text not null check (account in ('bank', 'cash')),
  category    text,
  spent_at    text not null,
  created_at  timestamptz not null default now()
);
alter table expenses disable row level security;
create index if not exists expenses_spent_at_idx on expenses (spent_at desc);
