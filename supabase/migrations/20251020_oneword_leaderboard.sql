create extension if not exists pgcrypto;

create table if not exists public.oneword_leaderboard_results (
  id uuid primary key default gen_random_uuid(),
  user_handle text not null,
  topic text not null,
  question text not null,
  expected_answer text not null,
  user_answer text not null,
  user_time_ms integer not null,
  user_correct boolean not null,
  ai_models_beaten text[] not null,
  num_ai_beaten integer not null,
  created_at timestamptz not null default now()
);

create index if not exists oneword_lb_rank_idx on public.oneword_leaderboard_results
  (user_correct, num_ai_beaten desc, user_time_ms asc, created_at desc);

create index if not exists oneword_lb_user_idx on public.oneword_leaderboard_results
  (user_handle, user_correct, num_ai_beaten desc, user_time_ms asc);

alter table public.oneword_leaderboard_results enable row level security;

drop policy if exists "read-oneword-lb" on public.oneword_leaderboard_results;
create policy "read-oneword-lb" on public.oneword_leaderboard_results for select using (true);

