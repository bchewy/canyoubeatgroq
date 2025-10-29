import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = supabasePublic();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    // Get total coding challenges completed
    const { count: codingChallenges } = await supabase
      .from("leaderboard_results")
      .select("*", { count: "exact", head: true });

    // Get total typeracer races
    const { count: typeracerRaces } = await supabase
      .from("typeracer_leaderboard_results")
      .select("*", { count: "exact", head: true });

    // Get total oneword challenges
    const { count: onewordChallenges } = await supabase
      .from("oneword_leaderboard_results")
      .select("*", { count: "exact", head: true });

    // Get unique players across all games
    const [codingPlayers, typeracerPlayers, onewordPlayers] =
      await Promise.all([
        supabase
          .from("leaderboard_results")
          .select("user_handle", { count: "exact" }),
        supabase
          .from("typeracer_leaderboard_results")
          .select("user_handle", { count: "exact" }),
        supabase
          .from("oneword_leaderboard_results")
          .select("user_handle", { count: "exact" }),
      ]);

    // Combine and count unique players
    const allPlayers = new Set([
      ...(codingPlayers.data?.map((p) => p.user_handle) || []),
      ...(typeracerPlayers.data?.map((p) => p.user_handle) || []),
      ...(onewordPlayers.data?.map((p) => p.user_handle) || []),
    ]);

    const totalChallenges =
      (codingChallenges || 0) +
      (typeracerRaces || 0) +
      (onewordChallenges || 0);

    return NextResponse.json({
      totalChallenges,
      totalPlayers: allPlayers.size,
      codingChallenges: codingChallenges || 0,
      typeracerRaces: typeracerRaces || 0,
      onewordChallenges: onewordChallenges || 0,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

