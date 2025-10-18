import type { Problem } from "@/lib/types";
import { createHash } from "node:crypto";

export type Topic = "mixed" | "math" | "words" | "logic" | "sequence" | "emoji";

export const TOPIC_LABELS: Record<Topic, string> = {
  mixed: "Mixed",
  math: "Mental Math",
  words: "Word Play",
  logic: "Logic",
  sequence: "Sequences",
  emoji: "Emoji Math",
};

function hash32(s: string): number {
  const h = createHash("sha256").update(s).digest();
  // fold first 4 bytes to 32-bit int
  return h.readUInt32BE(0);
}

function rng(seed: number) {
  // xorshift32
  let x = seed || 123456789;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
}

function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)]!;
}

function mathProblem(seed: string): Problem {
  const r = rng(hash32("math:" + seed));
  const a = 10 + Math.floor(r() * 20); // 10..29
  const b = 2 + Math.floor(r() * 9);   // 2..10
  const c = 1 + Math.floor(r() * 10);  // 1..10
  const form = r() < 0.5 ? "mul-sub" : "add-mul";
  if (form === "mul-sub") {
    const prompt = `What is ${a} × ${b} − ${c}?`;
    const answer = String(a * b - c);
    return { id: `gen-math-${seed.slice(0, 8)}`, type: "short", prompt, answer };
  } else {
    const prompt = `What is ${a} + ${b} × ${c}?`;
    const answer = String(a + b * c);
    return { id: `gen-math-${seed.slice(0, 8)}`, type: "short", prompt, answer };
  }
}

function wordProblem(seed: string): Problem {
  const r = rng(hash32("words:" + seed));
  const words = ["stressed", "drawer", "banana", "human", "groq"];
  const w = pick(words, r);
  const idx = 3; // third char of reversed
  const reversed = w.split("").reverse().join("");
  const answer = (reversed[idx - 1] || "").toUpperCase();
  const prompt = `Reverse the word '${w}' and give the ${idx}rd character of the result.`;
  return { id: `gen-words-${seed.slice(0, 8)}`, type: "short", prompt, answer };
}

function logicProblem(seed: string): Problem {
  const r = rng(hash32("logic:" + seed));
  const sets = [
    { choices: ["SQUARE", "TRIANGLE", "CIRCLE", "RECTANGLE"], answer: "CIRCLE" },
    { choices: ["RED", "BLUE", "SEVEN", "GREEN"], answer: "SEVEN" },
    { choices: ["DOG", "CAT", "BIRD", "CAR"], answer: "CAR" },
  ];
  const s = pick(sets, r);
  return {
    id: `gen-logic-${seed.slice(0, 8)}`,
    type: "mcq",
    prompt: "Odd one out:",
    choices: s.choices,
    answer: s.answer,
  };
}

function sequenceProblem(seed: string): Problem {
  const r = rng(hash32("seq:" + seed));
  if (r() < 0.5) {
    // Fibonacci-like starting at 2,3
    const seq = [2, 3, 5, 8, 13];
    const prompt = `${seq.join(", ")}, __`;
    return { id: `gen-seq-${seed.slice(0, 8)}`, type: "short", prompt: `Fill the blank: ${prompt}`, answer: "21" };
  } else {
    // Arithmetic progression
    const a = 3 + Math.floor(r() * 5); // 3..7
    const d = 2 + Math.floor(r() * 4); // 2..5
    const seq = [a, a + d, a + 2 * d, a + 3 * d];
    const prompt = `${seq.join(", ")}, __`;
    const answer = String(a + 4 * d);
    return { id: `gen-seq-${seed.slice(0, 8)}`, type: "short", prompt: `Fill the blank: ${prompt}`, answer };
  }
}

function emojiProblem(seed: string): Problem {
  const r = rng(hash32("emoji:" + seed));
  const map = [
    { a: "😀", av: 3, b: "😎", bv: 5 },
    { a: "🔥", av: 4, b: "❄️", bv: 2 },
  ];
  const m = pick(map, r);
  const prompt = `If ${m.a}=${m.av} and ${m.b}=${m.bv}, what is ${m.a}+${m.b}?`;
  const answer = String(m.av + m.bv);
  return { id: `gen-emoji-${seed.slice(0, 8)}`, type: "short", prompt, answer };
}

export function selectGeneratedProblemForSeed(seed: string, topic: Topic): Problem {
  switch (topic) {
    case "math":
      return mathProblem(seed);
    case "words":
      return wordProblem(seed);
    case "logic":
      return logicProblem(seed);
    case "sequence":
      return sequenceProblem(seed);
    case "emoji":
      return emojiProblem(seed);
    case "mixed":
    default:
      // rotate across topics for mixed
      const topics: Topic[] = ["math", "words", "logic", "sequence", "emoji"];
      const t = topics[hash32("mix:" + seed) % topics.length]!;
      return selectGeneratedProblemForSeed(seed, t);
  }
}


