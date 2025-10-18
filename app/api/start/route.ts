import { NextResponse } from "next/server";
import { getDailySeed } from "@/lib/seed";
import { sanitizeProblem, selectProblemForSeed } from "@/lib/problems";
import { selectGeneratedProblemForSeed, type Topic } from "@/lib/questionBanks";
import { randomUUID } from "node:crypto";
import { signStartToken } from "@/lib/hmac";
import type { StartTokenPayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { seed?: string; topic?: Topic };
    const seed = typeof body.seed === "string" && body.seed.trim() ? body.seed.trim() : getDailySeed();
    const topic = (body.topic as Topic) || "mixed";
    const nonce = randomUUID().slice(0, 8);
    const base = topic === "mixed" ? selectProblemForSeed(seed) : selectGeneratedProblemForSeed(`${seed}:${nonce}`, topic);
    const problem = topic === "mixed" ? base : { ...base, id: `${base.id}_${nonce}` };
    const issuedAtMs = Date.now();
    const payload: StartTokenPayload = {
      v: "v1",
      issuedAtMs,
      seed,
      problemId: problem.id,
    };
    const startToken = signStartToken(payload);
    const expiresAt = issuedAtMs + 35_000;
    // No KV cache; problem can be deterministically reconstructed from seed + id if needed
    return NextResponse.json({ problem: sanitizeProblem(problem), startToken, seed, topic, expiresAt });
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
}


