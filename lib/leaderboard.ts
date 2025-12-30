import type { LeaderboardEntry, OneWordLeaderboardEntry, TypeRacerLeaderboardEntry, HistoryEntry } from "@/lib/types";
import { supabaseAdmin, supabasePublic } from "@/lib/db";

export async function addLeaderboard(seed: string, entry: LeaderboardEntry) {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("Supabase service role key missing");

  // First check if entry exists and if new score is better
  const { data: existing } = await sb
    .from("leaderboard_results")
    .select("win_margin_ms")
    .eq("seed", seed)
    .eq("problem_id", entry.problemId)
    .eq("user_handle", entry.userHandle)
    .eq("ai_model", entry.aiModel)
    .single();

  // Only insert if no existing entry or if new score is better
  if (!existing || entry.winMarginMs > existing.win_margin_ms) {
    const { error } = await sb.from("leaderboard_results").upsert({
      seed,
      problem_id: entry.problemId,
      user_handle: entry.userHandle,
      user_time_ms: entry.userTimeMs,
      ai_time_ms: entry.aiTimeMs,
      ai_model: entry.aiModel,
      win_margin_ms: entry.winMarginMs,
    }, {
      onConflict: 'seed,problem_id,user_handle,ai_model'
    });
    if (error) throw error;
  }
}

export async function getLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const sb = supabasePublic() || supabaseAdmin();
  if (!sb) throw new Error("Supabase URL or anon key missing");

  // Use efficient RPC function with DISTINCT ON (no full table scan)
  const { data, error } = await sb.rpc("get_top_leaderboard", { lim: limit });

  if (error) throw error;

  return (data || []).map((r: {
    user_handle: string;
    win_margin_ms: number;
    user_time_ms: number;
    ai_time_ms: number;
    problem_id: string;
    created_at: string;
    all_models: string;
  }) => ({
    userHandle: r.user_handle,
    winMarginMs: r.win_margin_ms,
    userTimeMs: r.user_time_ms,
    aiTimeMs: r.ai_time_ms,
    aiModel: r.all_models, // Already aggregated by the SQL function
    problemId: r.problem_id,
    createdAt: new Date(r.created_at).getTime(),
  }));
}

export async function addOneWordLeaderboard(entry: {
  userHandle: string;
  topic: string;
  question: string;
  expectedAnswer: string;
  userAnswer: string;
  userTimeMs: number;
  userCorrect: boolean;
  aiModelsBeaten: string[];
}) {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("Supabase service role key missing");

  const { error } = await sb.from("oneword_leaderboard_results").insert({
    user_handle: entry.userHandle,
    topic: entry.topic,
    question: entry.question,
    expected_answer: entry.expectedAnswer,
    user_answer: entry.userAnswer,
    user_time_ms: entry.userTimeMs,
    user_correct: entry.userCorrect,
    ai_models_beaten: entry.aiModelsBeaten,
    num_ai_beaten: entry.aiModelsBeaten.length,
  });
  
  if (error) throw error;
}

export async function getOneWordLeaderboard(limit = 50): Promise<OneWordLeaderboardEntry[]> {
  const sb = supabasePublic() || supabaseAdmin();
  if (!sb) throw new Error("Supabase URL or anon key missing");

  // Use efficient RPC function with DISTINCT ON (no full table scan)
  const { data, error } = await sb.rpc("get_top_oneword_leaderboard", { lim: limit });

  if (error) throw error;

  // RPC returns one entry per user, but we still need final sort + limit
  return (data || [])
    .map((r: {
      user_handle: string;
      topic: string;
      user_time_ms: number;
      ai_models_beaten: string[];
      num_ai_beaten: number;
      created_at: string;
    }) => ({
      userHandle: r.user_handle,
      topic: r.topic,
      userTimeMs: r.user_time_ms,
      aiModelsBeaten: r.ai_models_beaten,
      numAiBeaten: r.num_ai_beaten,
      createdAt: new Date(r.created_at).getTime(),
    }))
    .sort((a: OneWordLeaderboardEntry, b: OneWordLeaderboardEntry) => {
      if (a.userTimeMs !== b.userTimeMs) return a.userTimeMs - b.userTimeMs;
      if (b.numAiBeaten !== a.numAiBeaten) return b.numAiBeaten - a.numAiBeaten;
      return b.createdAt - a.createdAt;
    })
    .slice(0, limit);
}

export async function addTypeRacerLeaderboard(entry: {
  userHandle: string;
  word: string;
  userTimeMs: number;
  aiModelsBeaten: string[];
}) {
  const sb = supabaseAdmin();
  if (!sb) throw new Error("Supabase service role key missing");

  const { error } = await sb.from("typeracer_leaderboard_results").insert({
    user_handle: entry.userHandle,
    word: entry.word,
    user_time_ms: entry.userTimeMs,
    ai_models_beaten: entry.aiModelsBeaten,
    num_ai_beaten: entry.aiModelsBeaten.length,
  });
  
  if (error) throw error;
}

export async function getTypeRacerLeaderboard(limit = 50): Promise<TypeRacerLeaderboardEntry[]> {
  const sb = supabasePublic() || supabaseAdmin();
  if (!sb) throw new Error("Supabase URL or anon key missing");

  // Use efficient RPC function with DISTINCT ON (no full table scan)
  const { data, error } = await sb.rpc("get_top_typeracer_leaderboard", { lim: limit });

  if (error) throw error;

  // RPC returns one entry per user, but we still need final sort + limit
  return (data || [])
    .map((r: {
      user_handle: string;
      word: string;
      user_time_ms: number;
      ai_models_beaten: string[];
      num_ai_beaten: number;
      created_at: string;
    }) => ({
      userHandle: r.user_handle,
      word: r.word,
      userTimeMs: r.user_time_ms,
      aiModelsBeaten: r.ai_models_beaten,
      numAiBeaten: r.num_ai_beaten,
      createdAt: new Date(r.created_at).getTime(),
    }))
    .sort((a: TypeRacerLeaderboardEntry, b: TypeRacerLeaderboardEntry) => {
      if (a.userTimeMs !== b.userTimeMs) return a.userTimeMs - b.userTimeMs;
      if (b.numAiBeaten !== a.numAiBeaten) return b.numAiBeaten - a.numAiBeaten;
      return b.createdAt - a.createdAt;
    })
    .slice(0, limit);
}

export async function insertHistoryEntry(entry: HistoryEntry) {
  console.log("[insertHistoryEntry] Attempting to insert:", {
    userHandle: entry.userHandle,
    gameType: entry.gameType,
    scoreValue: entry.scoreValue,
    createdAt: entry.createdAt,
  });
  
  const sb = supabaseAdmin();
  if (!sb) {
    console.error("[insertHistoryEntry] Supabase admin client not available");
    throw new Error("Supabase service role key missing");
  }

  const { data, error } = await sb.from("history").insert({
    user_handle: entry.userHandle,
    game_type: entry.gameType,
    score_value: entry.scoreValue,
  }).select();
  
  if (error) {
    console.error("[insertHistoryEntry] Database error:", error);
    throw error;
  }
  
  console.log("[insertHistoryEntry] Successfully inserted:", data);
}

export async function getHistory(limit = 50): Promise<HistoryEntry[]> {
  const sb = supabasePublic() || supabaseAdmin();
  if (!sb) throw new Error("Supabase URL or anon key missing");

  const { data, error } = await sb
    .from("history")
    .select("user_handle, game_type, score_value, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((r) => ({
    userHandle: r.user_handle as string,
    gameType: r.game_type as 'puzzle' | 'oneword' | 'typeracer',
    scoreValue: r.score_value as number,
    createdAt: new Date(r.created_at as string).getTime(),
  }));
}

