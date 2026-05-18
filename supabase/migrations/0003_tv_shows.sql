create table if not exists tv_shows (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  creator    text,
  year       integer,
  poster_url text,
  tmdb_id    integer,
  genres     text[] not null default '{}',
  status     text not null default 'watchlist',
  rating     integer check (rating between 1 and 10),
  notes      text,
  watched_at text,
  seasons    integer,
  episodes   integer,
  network    text,
  created_at timestamptz not null default now()
);

create index if not exists tv_shows_status_idx on tv_shows(status);

alter table tv_shows disable row level security;
