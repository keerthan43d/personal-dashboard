-- Fix movie rating constraint to allow 1-10 (was 1-5)
-- Run this in your Supabase project: SQL Editor → New query → paste → Run

alter table movies drop constraint if exists movies_rating_check;
alter table movies add constraint movies_rating_check check (rating between 1 and 10);
