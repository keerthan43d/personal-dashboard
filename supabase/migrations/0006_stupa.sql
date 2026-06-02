-- ─── Stupa Tags ──────────────────────────────────────────────
create table if not exists stupa_tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text not null default '#FFD600',
  created_at timestamptz not null default now()
);
alter table stupa_tags disable row level security;

-- ─── Stupa Videos ────────────────────────────────────────────
create table if not exists stupa_videos (
  id            uuid primary key default gen_random_uuid(),
  platform      text not null check (platform in ('youtube', 'instagram')),
  url           text not null,
  video_id      text,
  title         text not null,
  thumbnail_url text,
  note          text,
  created_at    timestamptz not null default now()
);
alter table stupa_videos disable row level security;
create index if not exists stupa_videos_created_at_idx on stupa_videos (created_at desc);

-- ─── Stupa Thoughts (Reflections) ────────────────────────────
create table if not exists stupa_thoughts (
  id         uuid primary key default gen_random_uuid(),
  content    text not null,
  created_at timestamptz not null default now()
);
alter table stupa_thoughts disable row level security;
create index if not exists stupa_thoughts_created_at_idx on stupa_thoughts (created_at desc);

-- ─── Junction: Video ↔ Tag ───────────────────────────────────
create table if not exists stupa_video_tags (
  video_id uuid not null references stupa_videos(id) on delete cascade,
  tag_id   uuid not null references stupa_tags(id) on delete cascade,
  primary key (video_id, tag_id)
);
alter table stupa_video_tags disable row level security;

-- ─── Junction: Thought ↔ Tag ─────────────────────────────────
create table if not exists stupa_thought_tags (
  thought_id uuid not null references stupa_thoughts(id) on delete cascade,
  tag_id     uuid not null references stupa_tags(id) on delete cascade,
  primary key (thought_id, tag_id)
);
alter table stupa_thought_tags disable row level security;
