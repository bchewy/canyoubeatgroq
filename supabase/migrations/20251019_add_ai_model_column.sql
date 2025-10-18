-- Add ai_model column to existing table
alter table public.leaderboard_results 
  add column if not exists ai_model text not null default 'llama-3.1-70b-versatile';

-- Drop old index
drop index if exists lb_seed_rank_idx;

-- Remove duplicates - keep only the best (highest win_margin) entry per user+problem+model
delete from public.leaderboard_results a
using public.leaderboard_results b
where a.id < b.id
  and a.seed = b.seed
  and a.problem_id = b.problem_id
  and a.user_handle = b.user_handle
  and a.ai_model = b.ai_model
  and a.win_margin_ms <= b.win_margin_ms;

-- Create new composite index for efficient querying by seed, model, and ranking
create index if not exists lb_seed_model_rank_idx on public.leaderboard_results
  (seed, ai_model, win_margin_ms desc, user_time_ms asc, created_at desc);

-- Create unique index to ensure only one entry per user+problem+model combination
create unique index if not exists lb_user_problem_model_unique_idx 
  on public.leaderboard_results (seed, problem_id, user_handle, ai_model);

