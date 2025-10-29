import { NextResponse } from "next/server";
import { verifyStartToken } from "@/lib/hmac";
import { getProblemById } from "@/lib/problems";
import { normalizeAnswer } from "@/lib/normalize";
import { addLeaderboard, insertHistoryEntry } from "@/lib/leaderboard";
import { solveWithAllModels } from "@/lib/ai";
import { selectGeneratedProblemForSeed } from "@/lib/questionBanks";

export const runtime = "nodejs";

function sanitizeHandle(raw?: string): string {
  const s = (raw || "").trim().slice(0, 20);
  const cleaned = s.replace(/[^a-zA-Z0-9_\-\.]/g, "");
  return cleaned || "anon";
}

type CachedAiResult = {
  model: string;
  provider?: string;
  timeMs: number;
  answer: string;
  beaten: boolean;
};

export async function POST(req: Request) {
  try {
    const { problemId, startToken, userAnswer, desiredHandle, cachedAiResults, allowAllModels } = (await req.json()) as {
      problemId: string;
      startToken: string;
      userAnswer: string;
      desiredHandle?: string;
      cachedAiResults?: CachedAiResult[] | null;
      allowAllModels?: boolean;
    };
    if (!problemId || !startToken) return NextResponse.json({ error: "missing_params" }, { status: 400 });

    const payload = verifyStartToken(startToken);
    if (!payload) return NextResponse.json({ error: "invalid_token" }, { status: 400 });
    if (payload.problemId !== problemId) return NextResponse.json({ error: "mismatch_problem" }, { status: 400 });

    const now = Date.now();
    const COUNTDOWN_MS = 3_000;
    const startedAtMs = payload.issuedAtMs + COUNTDOWN_MS;
    const userTimeMs = Math.max(0, now - startedAtMs);
    if (now - payload.issuedAtMs > 35_000) {
      // Even on timeout, compute AI time so the user can see it
      const problemT = getProblemById(problemId);
      if (problemT) {
        const correctAnswer = normalizeAnswer(problemT.answer);
        // Use cached results if available, otherwise compute
        const modelResults = cachedAiResults && cachedAiResults.length > 0
          ? cachedAiResults.map((r) => ({
              model: r.model,
              provider: r.provider,
              timeMs: r.timeMs,
              answer: r.answer,
              beaten: false,
            }))
          : (await solveWithAllModels(problemT, allowAllModels ?? false)).map((r) => ({
              model: r.model,
              provider: r.provider,
              timeMs: r.timeMs,
              answer: r.answer,
              beaten: false,
            }));
        return NextResponse.json({ 
          outcome: "timeout", 
          userTimeMs, 
          correctAnswer,
          modelResults,
        });
      }
      return NextResponse.json({ outcome: "timeout", userTimeMs, modelResults: [] });
    }

    let problem = getProblemById(problemId);
    if (!problem) {
      // Fallback: reconstruct generated problem from id
      if (problemId.startsWith("gen-")) {
        const lastUnderscore = problemId.lastIndexOf("_");
        if (lastUnderscore > 0) {
          const nonce = problemId.substring(lastUnderscore + 1);
          const baseId = problemId.substring(0, lastUnderscore);
          const parts = baseId.split("-");
          const topicKey = parts[1];
          const topicMap: Record<string, "math" | "words" | "logic" | "sequence" | "emoji"> = {
            math: "math",
            words: "words",
            logic: "logic",
            seq: "sequence",
            emoji: "emoji",
          };
          const t = topicMap[topicKey!];
          if (t) {
            problem = selectGeneratedProblemForSeed(`${payload.seed}:${nonce}`, t);
          }
        }
      }
    }
    if (!problem) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const user = normalizeAnswer(userAnswer || "");
    const correct = normalizeAnswer(problem.answer);
    
    // Get results from all AI models (use cached if available)
    const results = cachedAiResults && cachedAiResults.length > 0
      ? cachedAiResults.map((r) => ({
          model: r.model,
          provider: r.provider,
          answer: r.answer,
          timeMs: r.timeMs,
        }))
      : await solveWithAllModels(problem, allowAllModels ?? false);
    
    if (!user || user !== correct) {
      // Wrong answer - show all model results
      const modelResults = results.map((r) => ({
        model: r.model,
        provider: r.provider,
        timeMs: r.timeMs,
        answer: r.answer,
        beaten: false,
      }));
      return NextResponse.json({ 
        outcome: "wrong", 
        userTimeMs, 
        correctAnswer: correct,
        modelResults,
      });
    }

    // Correct answer - check which models were beaten
    const modelResults = results.map((r) => {
      const winMargin = r.timeMs - userTimeMs;
      const beaten = userTimeMs < r.timeMs;
      return {
        model: r.model,
        provider: r.provider,
        timeMs: r.timeMs,
        answer: r.answer,
        beaten,
        winMarginMs: winMargin,
      };
    });

    const anyWin = modelResults.some((r) => r.beaten);
    const outcome = anyWin ? "win" : "loss";

    // Save leaderboard entry for each model beaten
    let savedToLb = false;
    const handle = sanitizeHandle(desiredHandle);
    if (anyWin) {
      for (const modelResult of modelResults) {
        if (modelResult.beaten && modelResult.winMarginMs > 0) {
          const entry = {
            userHandle: handle,
            winMarginMs: modelResult.winMarginMs,
            userTimeMs,
            aiTimeMs: modelResult.timeMs,
            aiModel: modelResult.model,
            problemId,
            createdAt: now,
          };
          await addLeaderboard(payload.seed, entry);
          savedToLb = true;
        }
      }
    }
    
    // Save to history (always save for correct answers, regardless of win/loss)
    console.log("[submit] Saving to history for puzzle game:", {
      userHandle: handle,
      gameType: 'puzzle',
      scoreValue: userTimeMs,
      createdAt: now,
    });
    try {
      await insertHistoryEntry({
        userHandle: handle,
        gameType: 'puzzle',
        scoreValue: userTimeMs,
        createdAt: now,
      });
      console.log("[submit] Successfully saved to history");
    } catch (historyError) {
      console.error("[submit] Failed to save to history:", historyError);
      console.error("[submit] Error details:", JSON.stringify(historyError, null, 2));
    }

    return NextResponse.json({ 
      outcome, 
      userTimeMs, 
      correctAnswer: correct,
      modelResults,
      savedToLb,
    });
  } catch (e) {
    console.error("[submit] Error:", e);
    return NextResponse.json({ error: "bad_request", details: String(e) }, { status: 400 });
  }
}


