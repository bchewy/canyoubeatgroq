-- Update OneWord leaderboard indexes to prioritize speed over AI models beaten

-- Drop old indexes
drop index if exists public.oneword_lb_rank_idx;
drop index if exists public.oneword_lb_user_idx;

-- Create new indexes with speed as primary sort
create index oneword_lb_rank_idx on public.oneword_leaderboard_results
  (user_correct, user_time_ms asc, num_ai_beaten desc, created_at desc);

create index oneword_lb_user_idx on public.oneword_leaderboard_results
  (user_handle, user_correct, user_time_ms asc, num_ai_beaten desc);

