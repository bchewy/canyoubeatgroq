"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import ModelIcon from "@/components/ModelIcon";

type OneWordQuestion = {
  question: string;
  expectedAnswer: string;
};

type AiResult = {
  model: string;
  provider: string;
  answer: string;
  timeMs: number;
};

type JudgmentResult = {
  reasoning: string;
  userCorrect: boolean;
  aiResults: { model: string; answer: string; correct: boolean }[];
  winner: "user" | "ai" | "tie";
};

type GameState = "topic-input" | "loading" | "countdown" | "answering" | "judging" | "results";

export default function OneWordPage() {
  const [gameState, setGameState] = useState<GameState>("topic-input");
  const [topic, setTopic] = useState("");
  const [question, setQuestion] = useState<OneWordQuestion | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [userAnswer, setUserAnswer] = useState("");
  const [userTimeMs, setUserTimeMs] = useState<number | null>(null);
  const [aiResults, setAiResults] = useState<AiResult[]>([]);
  const [aiResultsLoading, setAiResultsLoading] = useState(false);
  const [judgment, setJudgment] = useState<JudgmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const generateQuestion = useCallback(async () => {
    if (!topic.trim()) return;

    setError(null);
    setGameState("loading");

    try {
      // Generate question
      const genRes = await fetch("/api/oneword/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!genRes.ok) {
        throw new Error("Failed to generate question");
      }

      const questionData = (await genRes.json()) as OneWordQuestion;
      setQuestion(questionData);

      // Start countdown
      setGameState("countdown");
      let count = 3;
      setCountdown(count);

      const timer = setInterval(() => {
        count -= 1;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(timer);
          setGameState("answering");
          setStartTime(Date.now());
        }
      }, 1000);

      // Pre-fetch AI answers
      setAiResultsLoading(true);
      fetch("/api/oneword/ai-solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionData.question }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.results) {
            setAiResults(data.results);
            console.log(`[oneword] Got ${data.results.length} AI results`);
          } else {
            console.warn("[oneword] No AI results returned:", data);
          }
        })
        .catch((err) => {
          console.error("[oneword] Failed to get AI answers:", err);
        })
        .finally(() => {
          setAiResultsLoading(false);
        });
    } catch (err) {
      console.error("Error generating question:", err);
      setError("Failed to generate question. Please try again.");
      setGameState("topic-input");
    }
  }, [topic]);

  const submitAnswer = useCallback(async () => {
    if (!question || !userAnswer.trim() || !startTime) return;

    const endTime = Date.now();
    const timeMs = endTime - startTime;
    setUserTimeMs(timeMs);

    // Validate one word
    if (userAnswer.trim().split(/\s+/).length > 1) {
      setError("Please enter only ONE word!");
      return;
    }

    // Wait for AI results if still loading
    if (aiResultsLoading) {
      console.log("[oneword] Waiting for AI results to finish loading...");
      setError("Please wait, AI models are still answering...");
      return;
    }

    // Warn if no AI results (but continue anyway)
    if (aiResults.length === 0) {
      console.warn("[oneword] No AI results available, submitting anyway");
    } else {
      console.log(`[oneword] Submitting with ${aiResults.length} AI results`);
    }

    setError(null);
    setGameState("judging");

    try {
      // Get judgment
      const judgeRes = await fetch("/api/oneword/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.question,
          userAnswer: userAnswer.trim(),
          aiAnswers: aiResults.map((ai) => ({ model: ai.model, answer: ai.answer })),
          expectedAnswer: question.expectedAnswer,
        }),
      });

      if (!judgeRes.ok) {
        throw new Error("Failed to judge answers");
      }

      const judgmentData = (await judgeRes.json()) as JudgmentResult;
      setJudgment(judgmentData);
      setGameState("results");

      // Confetti if user wins
      const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduce && judgmentData.winner === "user") {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error("Error judging answers:", err);
      setError("Failed to judge answers. Please try again.");
      setGameState("answering");
    }
  }, [question, userAnswer, startTime, aiResults, aiResultsLoading]);

  const resetGame = useCallback(() => {
    setGameState("topic-input");
    setTopic("");
    setQuestion(null);
    setCountdown(3);
    setUserAnswer("");
    setUserTimeMs(null);
    setAiResults([]);
    setAiResultsLoading(false);
    setJudgment(null);
    setError(null);
    setStartTime(null);
  }, []);

  return (
    <div className="min-h-screen p-6 pb-32 flex flex-col items-center gap-6">
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/65 hover:text-white transition">
              ← Back
            </Link>
            <h1 className="text-xl font-semibold text-white">One-Word Challenge</h1>
          </div>
        </div>

        {error && (
          <div className="border border-red-500/40 rounded-lg p-4 bg-red-950/40 backdrop-blur-sm text-red-400">
            {error}
          </div>
        )}

        {/* Topic Input */}
        {gameState === "topic-input" && (
          <div className="border border-white/20 rounded-lg p-6 bg-black/30 backdrop-blur-sm space-y-4">
            <div className="text-white">
              <h2 className="text-lg font-medium mb-2">Choose Your Topic</h2>
              <p className="text-sm text-white/65 mb-4">
                Enter any topic and we&apos;ll generate a trivia question. You and the AI models will
                compete to answer with just ONE WORD!
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                generateQuestion();
              }}
              className="space-y-3"
            >
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., dinosaurs, chemistry, movies..."
                className="w-full px-4 py-3 border border-white/20 rounded-md bg-black/20 text-white placeholder:text-white/50"
                autoFocus
              />
              <button
                type="submit"
                disabled={!topic.trim()}
                className="w-full px-4 py-3 rounded-md bg-[var(--accent)] text-white disabled:opacity-50 shadow-[0_6px_20px_rgba(255,92,57,.25)] font-medium"
              >
                Generate Question
              </button>
            </form>
          </div>
        )}

        {/* Loading */}
        {gameState === "loading" && (
          <div className="border border-white/20 rounded-lg p-8 bg-black/30 backdrop-blur-sm">
            <div className="text-center text-white">
              <div className="text-lg mb-2">Generating question about &quot;{topic}&quot;...</div>
              <div className="text-sm text-white/65">Using groq/compound-mini</div>
            </div>
          </div>
        )}

        {/* Countdown */}
        {gameState === "countdown" && question && (
          <div className="border border-white/20 rounded-lg p-6 bg-black/30 backdrop-blur-sm space-y-4">
            <div className="text-lg font-medium text-white mb-2">{question.question}</div>
            <div className="text-center text-6xl font-bold py-8 text-white">{countdown}</div>
          </div>
        )}

        {/* Answering */}
        {gameState === "answering" && question && (
          <div className="border border-white/20 rounded-lg p-6 bg-black/30 backdrop-blur-sm space-y-4">
            <div className="text-lg font-medium text-white mb-4">{question.question}</div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitAnswer();
              }}
              className="flex items-center gap-2"
            >
              <label htmlFor="answer" className="sr-only">
                Your one-word answer
              </label>
              <input
                id="answer"
                type="text"
                value={userAnswer}
                onChange={(e) => {
                  const val = e.target.value;
                  // Only allow single word (no spaces)
                  if (!val.includes(" ")) {
                    setUserAnswer(val);
                  }
                }}
                placeholder="type one word"
                className="flex-1 px-4 py-3 border border-white/20 rounded-md bg-black/20 text-white placeholder:text-white/50"
                autoFocus
              />
              <button
                type="submit"
                disabled={!userAnswer.trim()}
                className="px-6 py-3 rounded-md bg-[var(--accent)] text-white disabled:opacity-50 shadow-[0_6px_20px_rgba(255,92,57,.25)] font-medium"
              >
                Submit
              </button>
            </form>
            <div className="text-xs text-white/50 text-center">
              Only one word allowed (no spaces)
            </div>
            {aiResultsLoading && (
              <div className="text-xs text-amber-400/80 text-center flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400/80 animate-pulse"></div>
                AI models are still answering...
              </div>
            )}
          </div>
        )}

        {/* Judging */}
        {gameState === "judging" && question && (
          <div className="border border-white/20 rounded-lg p-8 bg-black/30 backdrop-blur-sm">
            <div className="text-center space-y-4">
              <div className="text-lg font-medium text-white">Judging answers...</div>
              <div className="flex items-center justify-center gap-2 text-white/65">
                <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
              <div className="text-sm text-white/50">Using groq/compound to reason...</div>
            </div>
          </div>
        )}

        {/* Results */}
        {gameState === "results" && question && judgment && (
          <div className="space-y-4">
            {/* Winner Banner */}
            <div
              className={`border rounded-lg p-6 backdrop-blur-sm ${
                judgment.winner === "user"
                  ? "bg-green-950/40 border-green-500/40"
                  : judgment.winner === "ai"
                  ? "bg-red-950/30 border-red-500/30"
                  : "bg-amber-950/30 border-amber-500/30"
              }`}
            >
              <div
                className={`text-2xl font-bold mb-2 ${
                  judgment.winner === "user"
                    ? "text-green-400"
                    : judgment.winner === "ai"
                    ? "text-red-400"
                    : "text-amber-400"
                }`}
              >
                {judgment.winner === "user" && "🏆 You Win!"}
                {judgment.winner === "ai" && "🤖 AI Wins"}
                {judgment.winner === "tie" && "🤝 It&apos;s a Tie!"}
              </div>
              <div className="text-sm text-white/80">
                Question: <span className="font-medium">{question.question}</span>
              </div>
            </div>

            {/* Judge Reasoning */}
            <div className="border border-white/20 rounded-lg p-4 bg-black/30 backdrop-blur-sm">
              <div className="text-sm font-semibold text-white/80 mb-2">
                🧠 Judge&apos;s Reasoning (groq/compound):
              </div>
              <div className="text-sm text-white/90 whitespace-pre-wrap font-mono bg-black/20 p-3 rounded">
                {judgment.reasoning}
              </div>
            </div>

            {/* User Answer */}
            <div className="border border-white/20 rounded-lg p-4 bg-black/30 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-white/65">Your Answer:</div>
                  <div className="text-lg font-medium text-white">{userAnswer}</div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-xl font-bold ${
                      judgment.userCorrect ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {judgment.userCorrect ? "✓ Correct" : "✗ Incorrect"}
                  </div>
                  <div className="text-sm text-white/65">{userTimeMs} ms</div>
                </div>
              </div>
            </div>

            {/* AI Results */}
            <div className="border border-white/20 rounded-lg p-4 bg-black/30 backdrop-blur-sm">
              <div className="text-sm font-semibold text-white/80 mb-3">AI Models:</div>
              {judgment.aiResults.length === 0 ? (
                <div className="text-sm text-amber-400/80 py-4 text-center">
                  No AI model results available. This may happen if the API is slow or there was an error.
                  <div className="text-xs text-white/50 mt-2">Check the console for details.</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {judgment.aiResults.map((ai) => {
                    const aiResult = aiResults.find((r) => r.model === ai.model);
                    return (
                      <div
                        key={ai.model}
                        className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-lg ${
                              ai.correct ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {ai.correct ? "✓" : "✗"}
                          </span>
                          <ModelIcon
                            provider={aiResult?.provider}
                            modelName={ai.model}
                            className="w-4 h-4"
                          />
                          <span className="text-white font-medium">{ai.model}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-mono">{ai.answer || "(no answer)"}</div>
                          {aiResult && (
                            <div className="text-xs text-white/50">{aiResult.timeMs} ms</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Expected Answer */}
            <div className="border border-white/20 rounded-lg p-4 bg-black/30 backdrop-blur-sm">
              <div className="text-sm text-white/65">Expected Answer:</div>
              <div className="text-lg font-medium text-white">{question.expectedAnswer}</div>
            </div>

            {/* Play Again */}
            <button
              onClick={resetGame}
              className="w-full px-4 py-3 rounded-md bg-[var(--accent)] text-white shadow-[0_6px_20px_rgba(255,92,57,.25)] font-medium"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

