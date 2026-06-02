-- ─── Add transaction type (expense | income) to expenses ─────
alter table expenses
  add column if not exists type text not null default 'expense'
  check (type in ('expense', 'income'));
