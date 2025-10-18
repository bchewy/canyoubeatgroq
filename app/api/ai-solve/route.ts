import { NextResponse } from "next/server";
import { getProblemById } from "@/lib/problems";
import { solveWithAllModels } from "@/lib/ai";
import { selectGeneratedProblemForSeed } from "@/lib/questionBanks";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { problemId, seed, allowAllModels } = (await req.json()) as { problemId: string; seed: string; allowAllModels?: boolean };
    if (!problemId || !seed) return NextResponse.json({ error: "missing_params" }, { status: 400 });
    let problem = getProblemById(problemId);
    if (!problem) {
      if (problemId.startsWith("gen-")) {
        const parts = problemId.split("-");
        const topicKey = parts[1];
        const nonce = parts[parts.length - 1];
        const topicMap: Record<string, "math" | "words" | "logic" | "sequence" | "emoji"> = {
          math: "math",
          words: "words",
          logic: "logic",
          seq: "sequence",
          emoji: "emoji",
        };
        const t = topicMap[topicKey!];
        if (t) {
          problem = selectGeneratedProblemForSeed(`${seed}:${nonce}`, t);
        }
      }
    }
    if (!problem) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const results = await solveWithAllModels(problem, allowAllModels ?? false);
    return NextResponse.json({ 
      results: results.map((r) => ({
        model: r.model,
        provider: r.provider,
        aiAnswer: r.answer,
        aiTimeMs: r.timeMs,
      })),
      cached: false,
    });
  } catch {
    const body = await req.json().catch(() => null);
    const seed = body?.seed ?? "";
    const problemId = body?.problemId ?? "";
    return NextResponse.json({ error: "ai_unavailable", seed, problemId }, { status: 503 });
  }
}


