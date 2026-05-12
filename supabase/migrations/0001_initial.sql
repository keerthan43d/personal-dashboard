-- CommandChamber — initial schema
-- Run this in your Supabase project: SQL Editor → New query → paste → Run

create table if not exists clients (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  company      text,
  email        text,
  avatar       text,
  status       text not null default 'active'
               check (status in ('active','paused','done','archived')),
  hourly_rate  numeric,
  currency     text not null default 'USD',
  notes        text,
  created_at   timestamptz not null default now(),
  archived_at  timestamptz
);

create table if not exists projects (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references clients(id) on delete cascade,
  title           text not null,
  description     text,
  status          text not null default 'active'
                  check (status in ('active','blocked','review','done')),
  deadline        text,
  payment_amount  numeric,
  payment_status  text not null default 'unpaid'
                  check (payment_status in ('unpaid','partial','paid')),
  notes           text,
  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create table if not exists tasks (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  client_id    uuid not null references clients(id) on delete cascade,
  title        text not null,
  done         boolean not null default false,
  "order"      integer not null default 0,
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists time_logs (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  project_id  uuid references projects(id) on delete set null,
  date        text not null,
  hours       numeric not null,
  description text,
  created_at  timestamptz not null default now()
);

create table if not exists deliverables (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references clients(id) on delete cascade,
  project_id   uuid references projects(id) on delete set null,
  title        text not null,
  type         text not null default 'other'
               check (type in ('video','design','copy','brand','code','strategy','other')),
  url          text,
  delivered_at text not null,
  notes        text,
  created_at   timestamptz not null default now()
);

create table if not exists books (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  author      text not null,
  cover_url   text,
  isbn        text,
  genre       text,
  status      text not null default 'wishlist'
              check (status in ('reading','finished','dnf','wishlist')),
  rating      integer check (rating between 1 and 5),
  takeaways   text[] not null default '{}',
  started_at  text,
  finished_at text,
  notes       text,
  pages       integer,
  created_at  timestamptz not null default now()
);

create table if not exists movies (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  director    text,
  year        integer,
  poster_url  text,
  tmdb_id     integer,
  genres      text[] not null default '{}',
  status      text not null default 'watchlist'
              check (status in ('watched','watching','watchlist')),
  rating      integer check (rating between 1 and 5),
  notes       text,
  watched_at  text,
  runtime     integer,
  created_at  timestamptz not null default now()
);

-- RLS is disabled for personal use.
-- To add auth later: enable RLS and add policies scoped to auth.uid().
alter table clients      disable row level security;
alter table projects     disable row level security;
alter table tasks        disable row level security;
alter table time_logs    disable row level security;
alter table deliverables disable row level security;
alter table books        disable row level security;
alter table movies       disable row level security;
