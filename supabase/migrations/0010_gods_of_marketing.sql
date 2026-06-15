-- ─── pgvector ────────────────────────────────────────────────
-- Enable via Supabase Dashboard → Database → Extensions if this errors.
create extension if not exists vector;

-- ─── Marketing Gods (personas) ────────────────────────────────
create table if not exists marketing_gods (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  title               text not null default '',
  tagline             text,
  avatar_url          text,
  system_instructions text not null default '',
  created_at          timestamptz not null default now()
);
alter table marketing_gods disable row level security;

-- ─── Source Material ─────────────────────────────────────────
create table if not exists god_sources (
  id         uuid primary key default gen_random_uuid(),
  god_id     uuid not null references marketing_gods(id) on delete cascade,
  kind       text not null check (kind in ('paste', 'file', 'web')),
  title      text not null,
  content    text not null,
  created_at timestamptz not null default now()
);
alter table god_sources disable row level security;
create index if not exists god_sources_god_id_idx on god_sources(god_id);

-- ─── Vector Chunks (RAG) ─────────────────────────────────────
create table if not exists god_chunks (
  id         uuid primary key default gen_random_uuid(),
  god_id     uuid not null references marketing_gods(id) on delete cascade,
  source_id  uuid not null references god_sources(id) on delete cascade,
  content    text not null,
  embedding  vector(1536),
  created_at timestamptz not null default now()
);
alter table god_chunks disable row level security;
create index if not exists god_chunks_god_id_idx on god_chunks(god_id);
create index if not exists god_chunks_embedding_idx on god_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 10);

-- ─── Match function (cosine top-k) ───────────────────────────
create or replace function match_god_chunks(
  p_god_id    uuid,
  p_embedding vector(1536),
  p_k         int default 6
)
returns table(id uuid, source_id uuid, content text, similarity float)
language sql stable
as $$
  select
    gc.id,
    gc.source_id,
    gc.content,
    1 - (gc.embedding <=> p_embedding) as similarity
  from god_chunks gc
  where gc.god_id = p_god_id
    and gc.embedding is not null
  order by gc.embedding <=> p_embedding
  limit p_k;
$$;
