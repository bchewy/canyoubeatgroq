create extension if not exists pgcrypto;

create table if not exists public.typeracer_leaderboard_results (
  id uuid primary key default gen_random_uuid(),
  user_handle text not null,
  word text not null,
  user_time_ms integer not null,
  ai_models_beaten text[] not null,
  num_ai_beaten integer not null,
  created_at timestamptz not null default now()
);

create index if not exists typeracer_lb_rank_idx on public.typeracer_leaderboard_results
  (user_time_ms asc, num_ai_beaten desc, created_at desc);

create index if not exists typeracer_lb_user_idx on public.typeracer_leaderboard_results
  (user_handle, user_time_ms asc, num_ai_beaten desc);

alter table public.typeracer_leaderboard_results enable row level security;

drop policy if exists "read-typeracer-lb" on public.typeracer_leaderboard_results;
create policy "read-typeracer-lb" on public.typeracer_leaderboard_results for select using (true);

