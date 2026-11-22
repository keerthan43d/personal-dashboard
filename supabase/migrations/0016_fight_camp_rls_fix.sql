-- ─── Fight Camp — RLS fix + seed backfill ───────────────────────
-- On the live DB the fc_* tables came up with row-level security ENABLED
-- and no policy, so the anon client (this single-user app) could neither
-- read nor write them. The rest of the app runs RLS-disabled; bring these
-- tables in line, make sure the settings row + starter library exist, and
-- nudge PostgREST to reload its schema cache. Safe to run more than once.

alter table fc_camps     disable row level security;
alter table fc_sessions  disable row level security;
alter table fc_exercises disable row level security;
alter table fc_foods     disable row level security;
alter table fc_meals     disable row level security;
alter table fc_food_log  disable row level security;
alter table fc_checkins  disable row level security;
alter table fc_settings  disable row level security;

-- Settings row (idempotent on its text PK).
insert into fc_settings (id) values ('main') on conflict (id) do nothing;

-- Seed the starter exercise library only if it is still empty.
insert into fc_exercises (name, muscle, is_sample)
select v.name, v.muscle, true
from (values
  ('Back Squat','legs'),('Deadlift','back'),('Bench Press','chest'),
  ('Overhead Press','shoulders'),('Pull-up','back'),('Barbell Row','back'),
  ('Romanian Deadlift','legs'),('Dumbbell Curl','arms'),('Dips','chest'),
  ('Hanging Leg Raise','core')
) as v(name, muscle)
where not exists (select 1 from fc_exercises);

-- Seed the starter food library only if it is still empty.
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

-- Refresh the API schema cache so the tables resolve immediately.
notify pgrst, 'reload schema';
