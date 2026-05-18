-- Journal entries (one per day)
create table if not exists journal_entries (
  id             uuid primary key default gen_random_uuid(),
  date           text not null unique,  -- "YYYY-MM-DD"
  mood           integer check (mood between 1 and 5),
  energy         integer check (energy between 1 and 5),
  free_write     text,
  wins           text[] not null default '{}',
  ideas          text[] not null default '{}',
  tomorrow_focus text,
  habits         jsonb not null default '{}',
  updated_at     timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

-- Problem solving log
create table if not exists problem_logs (
  id                    uuid primary key default gen_random_uuid(),
  entry_date            text not null,   -- "YYYY-MM-DD"
  title                 text not null,
  what_the_problem_was  text,
  context               text,
  what_didnt_work       text,
  what_solved_it        text,
  why_it_worked         text,
  tags                  text[] not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists problem_logs_entry_date_idx on problem_logs(entry_date);
create index if not exists problem_logs_tags_idx on problem_logs using gin(tags);

-- Habit definitions (user-managed)
create table if not exists journal_habits (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  "order"    integer not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

alter table journal_entries disable row level security;
alter table problem_logs    disable row level security;
alter table journal_habits  disable row level security;
