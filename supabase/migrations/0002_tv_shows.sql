-- Add TV Shows table
-- Run this in your Supabase project: SQL Editor → New query → paste → Run

create table if not exists tv_shows (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  creator     text,
  year        integer,
  poster_url  text,
  tmdb_id     integer,
  genres      text[] not null default '{}',
  status      text not null default 'watchlist'
              check (status in ('watched','watching','watchlist')),
  rating      integer check (rating between 1 and 10),
  notes       text,
  watched_at  text,
  seasons     integer,
  episodes    integer,
  network     text,
  created_at  timestamptz not null default now()
);

alter table tv_shows disable row level security;
