-- ─── 90-Day MMA Fight Camp ──────────────────────────────────────
-- One camp at a time (single row, id = 'main'). Training days are every
-- day EXCEPT Sunday and Monday — those are enforced in the UI.
create table if not exists mma_challenge (
  id         text primary key default 'main',
  start_date text not null,             -- yyyy-MM-dd (day 1 of 90)
  created_at timestamptz not null default now()
);
alter table mma_challenge disable row level security;

-- One logged session per day.
create table if not exists mma_sessions (
  log_date    text primary key,         -- yyyy-MM-dd
  disciplines jsonb not null default '[]'::jsonb,
  rounds      int  not null default 0,
  intensity   int,                      -- 1–5
  note        text,
  updated_at  timestamptz not null default now()
);
alter table mma_sessions disable row level security;
