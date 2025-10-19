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

  // Fetch ALL entries for the seed, sorted by performance
  const { data, error } = await sb
    .from("leaderboard_results")
    .select("user_handle, win_margin_ms, user_time_ms, ai_time_ms, ai_model, problem_id, created_at")
    .eq("seed", seed)
    .order("win_margin_ms", { ascending: false })
    .order("user_time_ms", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Group by user and collect all their entries
  const userEntries = new Map<string, LeaderboardEntry[]>();
  (data || []).forEach((r) => {
    const handle = r.user_handle as string;
    const entry: LeaderboardEntry = {
      userHandle: handle,
      winMarginMs: r.win_margin_ms as number,
      userTimeMs: r.user_time_ms as number,
      aiTimeMs: r.ai_time_ms as number,
      aiModel: r.ai_model as string,
      problemId: r.problem_id as string,
      createdAt: new Date(r.created_at as string).getTime(),
    };
    
    if (!userEntries.has(handle)) {
      userEntries.set(handle, []);
    }
    userEntries.get(handle)!.push(entry);
  });

  // For each user, find their best entry and aggregate all models beaten
  const seen = new Map<string, LeaderboardEntry>();
  userEntries.forEach((entries, handle) => {
    // Sort user's entries by win margin to find their best
    const sorted = entries.sort((a, b) => {
      if (b.winMarginMs !== a.winMarginMs) return b.winMarginMs - a.winMarginMs;
      if (a.userTimeMs !== b.userTimeMs) return a.userTimeMs - b.userTimeMs;
      return b.createdAt - a.createdAt;
    });
    
    // Use the best entry as the base, but collect all models beaten
    const best = sorted[0];
    const allModels = entries.map(e => e.aiModel);
    const uniqueModels = Array.from(new Set(allModels)).sort();
    
    // Store best entry with aggregated model info
    // We'll use a special format: "model1,model2,model3" if multiple
    seen.set(handle, {
      ...best,
      aiModel: uniqueModels.length > 1 ? uniqueModels.join(',') : uniqueModels[0],
    });
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


