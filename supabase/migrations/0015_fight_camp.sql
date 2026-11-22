-- ─── Fight Camp V2 ──────────────────────────────────────────────
-- Replaces the old single-row 90-Day Fight Camp (0013). A camp now has a
-- length, a mode (cut / maintain) and optional fight date, so multiple camps
-- can roll over and old ones live on as "past camps". A day can hold up to two
-- sessions — one MMA, one gym. Nutrition (food library / saved meals / food
-- log) and a daily body check-in round out the logging core.
-- Single-user app: RLS disabled like the rest.

-- 1) CAMP ───────────────────────────────────────────────────────
create table if not exists fc_camps (
  id            uuid primary key default gen_random_uuid(),
  name          text not null default 'Fight Camp',
  start_date    text not null,                       -- yyyy-MM-dd (day 1)
  length_days   int  not null default 30,
  fight_date    text,                                -- yyyy-MM-dd (optional)
  mode          text not null default 'cut'
                  check (mode in ('cut', 'maintain')),
  weight_start  numeric,                             -- kg at camp start
  weight_target numeric,                             -- kg goal
  status        text not null default 'active'
                  check (status in ('active', 'done')),
  created_at    timestamptz not null default now()
);
alter table fc_camps disable row level security;
-- At most one active camp at a time.
create unique index if not exists fc_camps_one_active_idx
  on fc_camps(status) where status = 'active';

-- 2) SESSION — one MMA or one gym session per day ────────────────
create table if not exists fc_sessions (
  id           uuid primary key default gen_random_uuid(),
  camp_id      uuid references fc_camps(id) on delete cascade,
  log_date     text not null,                        -- yyyy-MM-dd
  kind         text not null check (kind in ('mma', 'gym')),
  -- MMA fields
  focus        text,                                 -- striking / wrestling / bjj / sparring / conditioning
  duration_min int,
  effort       int,                                  -- 1..10
  spar_rounds  jsonb not null default '[]'::jsonb,   -- [{ round, partner, length, result:'win'|'even'|'loss', note }]
  learnings    jsonb not null default '[]'::jsonb,   -- [{ text, type:'mistake'|'fix'|'technique', tags:[] }]
  -- GYM fields
  gym_entries  jsonb not null default '[]'::jsonb,   -- [{ exerciseId, name, muscle, sets:[{ weight, reps, isPR }] }]
  note         text,
  updated_at   timestamptz not null default now()
);
alter table fc_sessions disable row level security;
create index if not exists fc_sessions_log_date_idx on fc_sessions(log_date);
create index if not exists fc_sessions_camp_id_idx  on fc_sessions(camp_id);
-- One MMA and one gym session per calendar day.
create unique index if not exists fc_sessions_day_kind_idx on fc_sessions(log_date, kind);

-- 3) EXERCISE LIBRARY ───────────────────────────────────────────
create table if not exists fc_exercises (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  muscle     text,                                   -- chest / back / legs / shoulders / arms / core / full
  is_sample  boolean not null default false,
  created_at timestamptz not null default now()
);
alter table fc_exercises disable row level security;

-- 4) FOOD LIBRARY — macros per serving ──────────────────────────
create table if not exists fc_foods (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  serving    text,                                   -- "100 g", "1 roti", "1 scoop"
  kcal       numeric not null default 0,
  protein    numeric not null default 0,
  carbs      numeric not null default 0,
  fat        numeric not null default 0,
  is_sample  boolean not null default false,
  created_at timestamptz not null default now()
);
alter table fc_foods disable row level security;

-- 5) SAVED MEALS — log a whole meal in one click ────────────────
create table if not exists fc_meals (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slot       text,                                   -- default slot when logged
  items      jsonb not null default '[]'::jsonb,     -- [{ name, qty, kcal, protein, carbs, fat }] (snapshot)
  is_sample  boolean not null default false,
  created_at timestamptz not null default now()
);
alter table fc_meals disable row level security;

-- 6) FOOD LOG — per-day entries ─────────────────────────────────
create table if not exists fc_food_log (
  id         uuid primary key default gen_random_uuid(),
  log_date   text not null,                          -- yyyy-MM-dd
  slot       text not null default 'meal'
               check (slot in ('breakfast', 'lunch', 'snack', 'dinner', 'meal')),
  label      text not null,                          -- what was eaten
  kcal       numeric not null default 0,
  protein    numeric not null default 0,
  carbs      numeric not null default 0,
  fat        numeric not null default 0,
  sort       int not null default 0,
  created_at timestamptz not null default now()
);
alter table fc_food_log disable row level security;
create index if not exists fc_food_log_date_idx on fc_food_log(log_date);

-- 7) DAILY CHECK-IN — body signals ──────────────────────────────
create table if not exists fc_checkins (
  log_date    text primary key,                      -- yyyy-MM-dd
  weight      numeric,
  sleep_hours numeric,
  soreness    int,                                   -- 1..5
  energy      int,                                   -- 1..5
  updated_at  timestamptz not null default now()
);
alter table fc_checkins disable row level security;

-- 8) SETTINGS — macro targets (single row) ──────────────────────
create table if not exists fc_settings (
  id             text primary key default 'main',
  weight_unit    text not null default 'kg',
  kcal_target    numeric not null default 2200,
  protein_target numeric not null default 160,
  carbs_target   numeric not null default 200,
  fat_target     numeric not null default 60,
  updated_at     timestamptz not null default now()
);
alter table fc_settings disable row level security;
insert into fc_settings (id) values ('main') on conflict (id) do nothing;

-- ─── Starter library (deletable — marked is_sample) ─────────────
-- Guarded with NOT EXISTS so re-applying this migration can't duplicate
-- the seed rows (the uuid PK would never trigger ON CONFLICT).
insert into fc_exercises (name, muscle, is_sample)
select v.name, v.muscle, true
from (values
  ('Back Squat','legs'),('Deadlift','back'),('Bench Press','chest'),
  ('Overhead Press','shoulders'),('Pull-up','back'),('Barbell Row','back'),
  ('Romanian Deadlift','legs'),('Dumbbell Curl','arms'),('Dips','chest'),
  ('Hanging Leg Raise','core')
) as v(name, muscle)
where not exists (select 1 from fc_exercises);

insert into fc_foods (name, serving, kcal, protein, carbs, fat, is_sample)
select v.name, v.serving, v.kcal, v.protein, v.carbs, v.fat, true
from (values
  ('Roti','1 roti',120,3,18,3),
  ('White rice','100 g',130,2.7,28,0.3),
  ('Dal (cooked)','100 g',116,9,20,0.4),
  ('Chicken breast','100 g',165,31,0,3.6),
  ('Whole egg','1 egg',72,6,0.4,5),
  ('Egg white','1 white',17,3.6,0.2,0.1),
  ('Soya chunks','100 g',345,52,33,0.5),
  ('Sprouts','100 g',30,3,6,0.2),
  ('Whey (1 scoop)','1 scoop',120,24,3,1.5),
  ('Curd / dahi','100 g',98,11,3.4,4.3)
) as v(name, serving, kcal, protein, carbs, fat)
where not exists (select 1 from fc_foods);

-- ─── Migrate the old 90-day camp + its sessions ─────────────────
-- The old camp (0013) becomes a finished 90-day camp; its logged MMA days
-- carry over so nothing is lost. Old disciplines/rounds fold into focus/note.
do $$
declare
  c   record;
  cid uuid;
begin
  if exists (select 1 from information_schema.tables where table_name = 'mma_challenge') then
    select * into c from mma_challenge where id = 'main';
    if found and not exists (select 1 from fc_camps) then
      insert into fc_camps (name, start_date, length_days, mode, status)
      values ('90-Day Fight Camp', c.start_date, 90, 'maintain', 'done')
      returning id into cid;

      insert into fc_sessions (camp_id, log_date, kind, focus, effort, note)
      select
        cid,
        s.log_date,
        'mma',
        nullif(array_to_string(array(select jsonb_array_elements_text(s.disciplines)), ', '), ''),
        s.intensity,
        trim(both ' ·' from coalesce(s.note, '') ||
          case when s.rounds > 0 then ' · ' || s.rounds || ' rounds' else '' end)
      from mma_sessions s
      on conflict (log_date, kind) do nothing;
    end if;
  end if;
end $$;
