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
    // Use efficient RPC function with COUNT(DISTINCT) - returns only integers, no row data
    const { data, error } = await supabase.rpc("get_game_stats");

    if (error) throw error;

    const stats = data?.[0] || {
      coding_challenges: 0,
      typeracer_races: 0,
      oneword_challenges: 0,
      coding_players: 0,
      typeracer_players: 0,
      oneword_players: 0,
      total_unique_players: 0,
    };

    const totalChallenges =
      Number(stats.coding_challenges || 0) +
      Number(stats.typeracer_races || 0) +
      Number(stats.oneword_challenges || 0);

    // True unique players across all games (computed by SQL UNION + COUNT DISTINCT)
    const totalPlayers = Number(stats.total_unique_players || 0);

    return NextResponse.json({
      totalChallenges,
      totalPlayers,
      codingChallenges: Number(stats.coding_challenges || 0),
      typeracerRaces: Number(stats.typeracer_races || 0),
      onewordChallenges: Number(stats.oneword_challenges || 0),
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

