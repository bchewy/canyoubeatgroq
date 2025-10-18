export type Problem = {
  id: string;
  type: "mcq" | "short";
  prompt: string;
  choices?: string[];
  answer: string;
};

export type StartTokenPayload = {
  v: "v1";
  issuedAtMs: number;
  seed: string;
  problemId: string;
};

export type GameResult = {
  seed: string;
  problemId: string;
  userHandle: string;
  userTimeMs: number;
  aiTimeMs: number;
  aiModel: string;
  winMarginMs: number; // aiTimeMs - userTimeMs
  outcome: "win" | "loss" | "timeout" | "wrong";
  createdAt: number;
};

export type LeaderboardEntry = Pick<
  GameResult,
  "userHandle" | "winMarginMs" | "userTimeMs" | "aiTimeMs" | "aiModel" | "problemId" | "createdAt"
>;

export type AiSolveCache = {
  answer: string;
  aiTimeMs: number;
  createdAt: number;
};

export type AiModelResult = {
  model: string;
  provider?: string;
  answer: string;
  timeMs: number;
};


