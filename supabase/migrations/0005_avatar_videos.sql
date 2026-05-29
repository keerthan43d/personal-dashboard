-- AI Avatar Video generations (LTX 2.3 via RunPod Serverless).
create table if not exists avatar_videos (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  status         text not null default 'IN_QUEUE',
  runpod_job_id  text,
  script         text not null,
  reference_text text,
  motion_prompt  text,
  image_name     text,
  audio_name     text,
  video_url      text,
  error          text
);

create index if not exists avatar_videos_created_idx on avatar_videos(created_at desc);
create index if not exists avatar_videos_job_idx on avatar_videos(runpod_job_id);

alter table avatar_videos disable row level security;

-- Public bucket to persist finished mp4s (download from RunPod -> store here).
insert into storage.buckets (id, name, public)
values ('avatar-videos', 'avatar-videos', true)
on conflict (id) do nothing;
