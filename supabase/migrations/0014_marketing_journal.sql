-- ─── Marketing Journal ──────────────────────────────────────────
-- A four-level tree for tracking client marketing work:
--   client → service → campaign → learning
-- Every child cascades on delete, so removing a client wipes its whole
-- subtree in one operation. Single-user app: RLS disabled like the rest.

-- 1) CLIENT — a business I work with
create table if not exists mkt_clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  industry    text,
  city        text,
  color       text,                 -- hex accent used when there's no logo
  logo_url    text,
  status      text not null default 'active'
                check (status in ('active', 'paused', 'past')),
  contact     text,                 -- main contact person (optional)
  website     text,                 -- website URL (optional)
  started_at  text,                 -- yyyy-MM-dd — when I started with them
  notes       text,
  is_sample   boolean not null default false,  -- seeded demo data
  created_at  timestamptz not null default now()
);
alter table mkt_clients disable row level security;

-- 2) SERVICE — something I provide to a client
create table if not exists mkt_services (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references mkt_clients(id) on delete cascade,
  type        text not null,        -- free text: Google Ads, Meta Ads, SEO, …
  status      text not null default 'active'
                check (status in ('active', 'paused', 'finished')),
  start_date  text,                 -- yyyy-MM-dd
  end_date    text,                 -- yyyy-MM-dd
  fee         numeric,              -- monthly retainer or project fee (nullable)
  fee_kind    text,                 -- 'monthly' | 'project' (nullable)
  description text,                 -- scope of work
  is_sample   boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table mkt_services disable row level security;
create index if not exists mkt_services_client_id_idx on mkt_services(client_id);

-- 3) CAMPAIGN — a specific push inside a service. Every result metric is
--    nullable; a website project simply leaves cost-per-lead empty.
create table if not exists mkt_campaigns (
  id            uuid primary key default gen_random_uuid(),
  service_id    uuid not null references mkt_services(id) on delete cascade,
  name          text not null,
  goal          text,
  start_date    text,               -- yyyy-MM-dd
  end_date      text,               -- yyyy-MM-dd
  status        text not null default 'planning'
                  check (status in ('planning', 'running', 'finished')),
  budget_spent  numeric,
  leads         integer,
  conversions   integer,
  cost_per_lead numeric,
  reach         integer,
  clicks        integer,
  verdict       text                -- 'worked' | 'mixed' | 'didnt' (nullable)
                  check (verdict is null or verdict in ('worked', 'mixed', 'didnt')),
  is_sample     boolean not null default false,
  created_at    timestamptz not null default now()
);
alter table mkt_campaigns disable row level security;
create index if not exists mkt_campaigns_service_id_idx on mkt_campaigns(service_id);

-- 4) LEARNING — one lesson from a campaign
create table if not exists mkt_learnings (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references mkt_campaigns(id) on delete cascade,
  type        text not null default 'worked'
                check (type in ('worked', 'didnt')),
  lesson      text not null,
  tags        jsonb not null default '[]'::jsonb,   -- free-text tag array
  repeat      boolean not null default false,       -- "repeat this" flag
  is_sample   boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table mkt_learnings disable row level security;
create index if not exists mkt_learnings_campaign_id_idx on mkt_learnings(campaign_id);
