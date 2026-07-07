-- ─── Hourly Log (9 AM–7 PM fixed blocks, one note per hour) ────
-- One row per day; notes is a map of start-hour (24h, as string) → text.
create table if not exists journal_hour_logs (
  log_date   text primary key,            -- yyyy-MM-dd
  notes      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table journal_hour_logs disable row level security;
