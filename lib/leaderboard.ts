import type { LeaderboardEntry } from "@/lib/types";
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

export async function getLeaderboard(seed: string, limit = 50): Promise<LeaderboardEntry[]> {
  const sb = supabasePublic() || supabaseAdmin();
  if (!sb) throw new Error("Supabase URL or anon key missing");

  // Fetch top entries sorted by performance (not alphabetically by username)
  const { data, error } = await sb
    .from("leaderboard_results")
    .select("user_handle, win_margin_ms, user_time_ms, ai_time_ms, ai_model, problem_id, created_at")
    .eq("seed", seed)
    .order("win_margin_ms", { ascending: false })
    .order("user_time_ms", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit * 3); // Fetch more to account for deduplication

  if (error) throw error;

  // Manual deduplication: keep only best entry per user
  const seen = new Map<string, LeaderboardEntry>();
  (data || []).forEach((r) => {
    const key = r.user_handle;
    const entry: LeaderboardEntry = {
      userHandle: r.user_handle as string,
      winMarginMs: r.win_margin_ms as number,
      userTimeMs: r.user_time_ms as number,
      aiTimeMs: r.ai_time_ms as number,
      aiModel: r.ai_model as string,
      problemId: r.problem_id as string,
      createdAt: new Date(r.created_at as string).getTime(),
    };
    
    const existing = seen.get(key);
    if (!existing || entry.winMarginMs > existing.winMarginMs) {
      seen.set(key, entry);
    }
  });

  // Sort by win margin and return top N
  return Array.from(seen.values())
    .sort((a, b) => {
      if (b.winMarginMs !== a.winMarginMs) return b.winMarginMs - a.winMarginMs;
      if (a.userTimeMs !== b.userTimeMs) return a.userTimeMs - b.userTimeMs;
      return b.createdAt - a.createdAt;
    })
    .slice(0, limit);
}


