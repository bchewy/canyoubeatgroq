import { NextResponse } from "next/server";
import { addTypeRacerLeaderboard, insertHistoryEntry } from "@/lib/leaderboard";

export const runtime = "nodejs";

function sanitizeHandle(input: string): string {
  return input
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .substring(0, 32);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userHandle, word, userTimeMs, aiResults } = body;

    if (!userHandle || !word || !userTimeMs || !aiResults) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const handle = sanitizeHandle(userHandle);
    if (!handle) {
      return NextResponse.json(
        { error: "Invalid handle" },
        { status: 400 }
      );
    }

    // Find AI models that user beat
    const aiModelsBeaten = aiResults
      .filter((ai: { model: string; timeMs: number }) => userTimeMs < ai.timeMs)
      .map((ai: { model: string }) => ai.model);

    // Only save if user beat at least one AI
    if (aiModelsBeaten.length > 0) {
      await addTypeRacerLeaderboard({
        userHandle: handle,
        word,
        userTimeMs,
        aiModelsBeaten,
      });
    }

    // Save to history (always save)
    console.log("[typeracer/submit] Saving to history for typeracer game:", {
      userHandle: handle,
      gameType: 'typeracer',
      scoreValue: userTimeMs,
      createdAt: Date.now(),
    });
    try {
      await insertHistoryEntry({
        userHandle: handle,
        gameType: 'typeracer',
        scoreValue: userTimeMs,
        createdAt: Date.now(),
      });
      console.log("[typeracer/submit] Successfully saved to history");
    } catch (historyError) {
      console.error("[typeracer/submit] Failed to save to history:", historyError);
      console.error("[typeracer/submit] Error details:", JSON.stringify(historyError, null, 2));
    }

    return NextResponse.json({ 
      success: true,
      aiModelsBeaten,
      savedToLb: aiModelsBeaten.length > 0,
    });
  } catch (e) {
    console.error("[typeracer/submit] Error:", e);
    return NextResponse.json(
      { error: "Failed to save result" },
      { status: 500 }
    );
  }
}

