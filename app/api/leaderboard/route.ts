import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/leaderboard";
import { getDailySeed } from "@/lib/seed";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const seed = url.searchParams.get("seed") || getDailySeed();
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));
  const entries = await getLeaderboard(seed, limit);
  return NextResponse.json({ entries });
}


