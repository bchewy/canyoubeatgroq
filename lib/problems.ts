import { Problem } from "@/lib/types";
import { createHash } from "node:crypto";

export const PROBLEMS: Problem[] = [
  {
    id: "q-mental-01",
    type: "short",
    prompt: "What is 17 × 4 − 13?",
    answer: "55",
  },
  {
    id: "q-string-01",
    type: "short",
    prompt: "Reverse the word 'stressed' and give the 3rd character of the result.",
    answer: "E",
  },
  {
    id: "q-logic-01",
    type: "mcq",
    prompt: "Odd one out:",
    choices: ["SQUARE", "TRIANGLE", "CIRCLE", "RECTANGLE"],
    answer: "CIRCLE",
  },
  {
    id: "q-emoji-01",
    type: "short",
    prompt: "If 😀=3 and 😎=5, what is 😀+😎?",
    answer: "8",
  },
  {
    id: "q-seq-01",
    type: "short",
    prompt: "Fill the blank: 2, 3, 5, 8, 13, __",
    answer: "21",
  },
  {
    id: "q-text-01",
    type: "short",
    prompt: "Uppercase the last 3 letters of 'banana' and reverse them.",
    answer: "ANA",
  },
  {
    id: "q-math-02",
    type: "mcq",
    prompt: "Which equals 3?",
    choices: ["7-3", "10/3", "9/3", "2+2"],
    answer: "9/3",
  },
  {
    id: "q-letters-01",
    type: "short",
    prompt: "Take 'HUMAN', shift each letter back by 1, then give the middle letter.",
    answer: "L",
  },
];

export function getProblemById(id: string): Problem | undefined {
  return PROBLEMS.find((p) => p.id === id);
}

export function selectProblemForSeed(seed: string): Problem {
  // Stable selection based on seed
  const hash = createHash("sha256").update(seed).digest("hex");
  const num = parseInt(hash.slice(0, 8), 16);
  const idx = num % PROBLEMS.length;
  return PROBLEMS[idx]!;
}

export function sanitizeProblem(problem: Problem): Omit<Problem, "answer"> {
  const { answer: _omit, ...rest } = problem;
  return rest;
}


