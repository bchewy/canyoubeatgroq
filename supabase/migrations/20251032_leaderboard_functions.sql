-- Efficient leaderboard functions using DISTINCT ON to avoid full table scans

-- Speed Challenge: Get top N users with their best entry + aggregated models
create or replace function get_top_leaderboard(lim integer default 50)
returns table (
  user_handle text,
  win_margin_ms integer,
  user_time_ms integer,
  ai_time_ms integer,
  ai_model text,
  problem_id text,
  created_at timestamptz,
  all_models text
) language sql stable as $$
  with user_best as (
    -- Get each user's best entry using DISTINCT ON
    select distinct on (lr.user_handle)
      lr.user_handle,
      lr.win_margin_ms,
      lr.user_time_ms,
      lr.ai_time_ms,
      lr.ai_model,
      lr.problem_id,
      lr.created_at
    from leaderboard_results lr
    order by lr.user_handle, lr.win_margin_ms desc, lr.user_time_ms asc, lr.created_at desc
  ),
  user_models as (
    -- Aggregate all unique models per user
    select 
      lr.user_handle,
      string_agg(distinct lr.ai_model, ',' order by lr.ai_model) as all_models
    from leaderboard_results lr
    where lr.user_handle in (select ub.user_handle from user_best ub order by ub.win_margin_ms desc limit lim)
    group by lr.user_handle
  )
  select 
    ub.user_handle,
    ub.win_margin_ms,
    ub.user_time_ms,
    ub.ai_time_ms,
    ub.ai_model,
    ub.problem_id,
    ub.created_at,
    coalesce(um.all_models, ub.ai_model) as all_models
  from user_best ub
  left join user_models um on ub.user_handle = um.user_handle
  order by ub.win_margin_ms desc, ub.user_time_ms asc, ub.created_at desc
  limit lim;
$$;

-- One-Word Challenge: Get top N users with their best (fastest correct) entry
create or replace function get_top_oneword_leaderboard(lim integer default 50)
returns table (
  user_handle text,
  topic text,
  user_time_ms integer,
  ai_models_beaten text[],
  num_ai_beaten integer,
  created_at timestamptz
) language sql stable as $$
  select distinct on (olr.user_handle)
    olr.user_handle,
    olr.topic,
    olr.user_time_ms,
    olr.ai_models_beaten,
    olr.num_ai_beaten,
    olr.created_at
  from oneword_leaderboard_results olr
  where olr.user_correct = true
  order by olr.user_handle, olr.user_time_ms asc, olr.num_ai_beaten desc, olr.created_at desc
  limit lim * 2;  -- Fetch extra then sort in outer query
$$;

-- TypeRacer: Get top N users with their best (fastest) entry
create or replace function get_top_typeracer_leaderboard(lim integer default 50)
returns table (
  user_handle text,
  word text,
  user_time_ms integer,
  ai_models_beaten text[],
  num_ai_beaten integer,
  created_at timestamptz
) language sql stable as $$
  select distinct on (tlr.user_handle)
    tlr.user_handle,
    tlr.word,
    tlr.user_time_ms,
    tlr.ai_models_beaten,
    tlr.num_ai_beaten,
    tlr.created_at
  from typeracer_leaderboard_results tlr
  order by tlr.user_handle, tlr.user_time_ms asc, tlr.num_ai_beaten desc, tlr.created_at desc
  limit lim * 2;  -- Fetch extra then sort in outer query
$$;

-- Stats: Efficient unique player count using COUNT(DISTINCT)
create or replace function get_game_stats()
returns table (
  coding_challenges bigint,
  typeracer_races bigint,
  oneword_challenges bigint,
  coding_players bigint,
  typeracer_players bigint,
  oneword_players bigint,
  total_unique_players bigint
) language sql stable as $$
  select
    (select count(*) from leaderboard_results) as coding_challenges,
    (select count(*) from typeracer_leaderboard_results) as typeracer_races,
    (select count(*) from oneword_leaderboard_results) as oneword_challenges,
    (select count(distinct user_handle) from leaderboard_results) as coding_players,
    (select count(distinct user_handle) from typeracer_leaderboard_results) as typeracer_players,
    (select count(distinct user_handle) from oneword_leaderboard_results) as oneword_players,
    (select count(distinct user_handle) from (
      select user_handle from leaderboard_results
      union
      select user_handle from typeracer_leaderboard_results
      union
      select user_handle from oneword_leaderboard_results
    ) all_players) as total_unique_players;
$$;
