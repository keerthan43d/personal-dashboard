-- ─── Journal To-Dos (daily plans that carry forward until done) ──
create table if not exists journal_todos (
  id         uuid primary key default gen_random_uuid(),
  text       text not null,
  done       boolean not null default false,
  due_date   text not null,          -- yyyy-MM-dd: the day this to-do currently lives on
  done_at    text,                   -- yyyy-MM-dd when it was completed
  created_at timestamptz not null default now()
);
alter table journal_todos disable row level security;
create index if not exists journal_todos_due_date_idx on journal_todos (due_date);
