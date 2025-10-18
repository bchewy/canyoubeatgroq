create extension if not exists pgcrypto;

create table if not exists public.leaderboard_results (
  id uuid primary key default gen_random_uuid(),
  seed text not null,
  problem_id text not null,
  user_handle text not null,
  user_time_ms integer not null,
  ai_time_ms integer not null,
  win_margin_ms integer not null,
  created_at timestamptz not null default now()
);

create index if not exists lb_seed_rank_idx on public.leaderboard_results
  (seed, win_margin_ms desc, user_time_ms asc, created_at desc);

alter table public.leaderboard_results enable row level security;

drop policy if exists "read-lb" on public.leaderboard_results;
create policy "read-lb" on public.leaderboard_results for select using (true);


