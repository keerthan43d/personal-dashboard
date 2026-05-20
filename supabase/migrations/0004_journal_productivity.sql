-- ─── ONE Project ──────────────────────────────────────────────
create table if not exists one_project (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  milestones  jsonb not null default '[]',
  target_date text,
  started_at  text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table one_project disable row level security;

-- ─── Deep Work Logs ──────────────────────────────────────────
create table if not exists deep_work_logs (
  id               uuid primary key default gen_random_uuid(),
  entry_date       text not null,
  start_time       text not null,
  end_time         text,
  duration_minutes integer,
  description      text,
  category         text check (category in ('project', 'client')) default 'project',
  mode             text check (mode in ('stopwatch', 'pomodoro')) default 'stopwatch',
  created_at       timestamptz not null default now()
);
alter table deep_work_logs disable row level security;
create index if not exists deep_work_logs_entry_date_idx on deep_work_logs (entry_date);

-- ─── Urge Logs ───────────────────────────────────────────────
create table if not exists urge_logs (
  id         uuid primary key default gen_random_uuid(),
  entry_date text not null,
  urge       text not null,
  avoiding   text,
  logged_at  timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table urge_logs disable row level security;
create index if not exists urge_logs_entry_date_idx on urge_logs (entry_date);

-- ─── Weekly Scorecards ───────────────────────────────────────
create table if not exists weekly_scorecards (
  id                uuid primary key default gen_random_uuid(),
  week_start        text unique not null,
  deep_work_score   integer check (deep_work_score between 1 and 5),
  shipped_score     integer check (shipped_score between 1 and 5),
  one_project_score integer check (one_project_score between 1 and 5),
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
alter table weekly_scorecards disable row level security;

-- ─── Ship Logs ───────────────────────────────────────────────
create table if not exists ship_logs (
  id          uuid primary key default gen_random_uuid(),
  entry_date  text not null,
  title       text not null,
  description text,
  url         text,
  type        text check (type in ('feature', 'page', 'pitch', 'video', 'design', 'other')) default 'other',
  created_at  timestamptz not null default now()
);
alter table ship_logs disable row level security;
create index if not exists ship_logs_entry_date_idx on ship_logs (entry_date);
