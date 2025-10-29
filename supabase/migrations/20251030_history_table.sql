create extension if not exists pgcrypto;

create table if not exists public.history (
  id uuid primary key default gen_random_uuid(),
  user_handle text not null,
  game_type text not null check (game_type in ('puzzle', 'oneword', 'typeracer')),
  score_value numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists history_created_at_idx on public.history
  (created_at desc);

create index if not exists history_user_idx on public.history
  (user_handle, created_at desc);

alter table public.history enable row level security;

drop policy if exists "read-history" on public.history;
create policy "read-history" on public.history for select using (true);

