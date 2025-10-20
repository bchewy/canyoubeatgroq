"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  const [handle, setHandle] = useState<string>("");
  const [needHandle, setNeedHandle] = useState(false);
  const aiResultsLoadingRef = useRef(false);
  const aiResultsRef = useRef<AiResult[]>([]);

  useEffect(() => {
    const savedHandle = typeof window !== "undefined" ? localStorage.getItem("beatbot_handle") : null;
    if (savedHandle) {
      setHandle(savedHandle);
    } else {
      setNeedHandle(true);
    }
  }, []);

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
      setAiResults([]);
      aiResultsRef.current = [];
      setAiResultsLoading(true);
      aiResultsLoadingRef.current = true;
      fetch("/api/oneword/ai-solve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionData.question }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.results) {
            setAiResults(data.results);
            aiResultsRef.current = data.results;
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
          aiResultsLoadingRef.current = false;
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

    setError(null);
    setGameState("judging");

    // If AI results are still loading, wait for them
    if (aiResultsLoadingRef.current) {
      console.log("[oneword] User submitted early, waiting for AI results...");
      const maxWaitTime = 10000; // 10 seconds max
      const startWait = Date.now();
      while (aiResultsLoadingRef.current && Date.now() - startWait < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      console.log(`[oneword] Waited ${Date.now() - startWait}ms for AI results, got ${aiResultsRef.current.length} results`);
    }

    // Warn if no AI results (but continue anyway)
    if (aiResultsRef.current.length === 0) {
      console.warn("[oneword] No AI results available after waiting, submitting anyway");
    } else {
      console.log(`[oneword] Submitting with ${aiResultsRef.current.length} AI results`);
    }

    try {
      // Get judgment
      const judgeRes = await fetch("/api/oneword/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.question,
          userAnswer: userAnswer.trim(),
          aiAnswers: aiResultsRef.current.map((ai) => ({ model: ai.model, answer: ai.answer, timeMs: ai.timeMs })),
          expectedAnswer: question.expectedAnswer,
          topic: topic,
          userTimeMs: timeMs,
          userHandle: handle.trim() || undefined,
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
  }, [question, userAnswer, startTime, aiResults, aiResultsLoading, topic, handle]);

  const resetGame = useCallback(() => {
    setGameState("topic-input");
    setTopic("");
    setQuestion(null);
    setCountdown(3);
    setUserAnswer("");
    setUserTimeMs(null);
    setAiResults([]);
    aiResultsRef.current = [];
    setAiResultsLoading(false);
    aiResultsLoadingRef.current = false;
    setJudgment(null);
    setError(null);
    setStartTime(null);
  }, []);

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-32 flex flex-col items-center gap-4 sm:gap-6">
      <div className="w-full max-w-2xl space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/65 hover:text-white transition">
              ← Back
            </Link>
            <h1 className="text-xl font-semibold text-white">One-Word Challenge</h1>
          </div>
          <div className="text-sm text-white/65">{handle ? `@${handle}` : ""}</div>
        </div>

        {error && (
          <div className="border border-red-500/40 rounded-lg p-4 bg-red-950/40 backdrop-blur-sm text-red-400">
            {error}
          </div>
        )}

        {/* Topic Input */}
        {gameState === "topic-input" && (
          <div className="border border-white/20 rounded-lg p-4 sm:p-6 bg-black/30 backdrop-blur-sm space-y-3 sm:space-y-4">
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
          <div className="border border-white/20 rounded-lg p-6 sm:p-8 bg-black/30 backdrop-blur-sm">
            <div className="text-center text-white">
              <div className="text-base sm:text-lg mb-2">Generating question about &quot;{topic}&quot;...</div>
              <div className="text-xs sm:text-sm text-white/65">Using groq/compound-mini</div>
            </div>
          </div>
        )}

        {/* Countdown */}
        {gameState === "countdown" && question && (
          <div className="border border-white/20 rounded-lg p-4 sm:p-6 bg-black/30 backdrop-blur-sm space-y-3 sm:space-y-4">
            <div className="text-base sm:text-lg font-medium text-white mb-2">{question.question}</div>
            <div className="text-center text-4xl sm:text-6xl font-bold py-6 sm:py-8 text-white">{countdown}</div>
          </div>
        )}

        {/* Answering */}
        {gameState === "answering" && question && (
          <div className="border border-white/20 rounded-lg p-4 sm:p-6 bg-black/30 backdrop-blur-sm space-y-3 sm:space-y-4">
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
          <div className="border border-white/20 rounded-lg p-6 sm:p-8 bg-black/30 backdrop-blur-sm">
            <div className="text-center space-y-3 sm:space-y-4">
              <div className="text-base sm:text-lg font-medium text-white">Judging answers...</div>
              <div className="flex items-center justify-center gap-2 text-white/65">
                <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 rounded-full bg-white/80 animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
              <div className="text-xs sm:text-sm text-white/50">Using groq/compound to reason...</div>
            </div>
          </div>
        )}

        {/* Results */}
        {gameState === "results" && question && judgment && (
          <div className="space-y-3 sm:space-y-4">
            {/* Winner Banner */}
            <div
              className={`border rounded-lg p-4 sm:p-6 backdrop-blur-sm ${
                judgment.winner === "user"
                  ? "bg-green-950/40 border-green-500/40"
                  : judgment.winner === "ai"
                  ? "bg-red-950/30 border-red-500/30"
                  : "bg-amber-950/30 border-amber-500/30"
              }`}
            >
              <div
                className={`text-xl sm:text-2xl font-bold mb-2 ${
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
              <div className="text-xs sm:text-sm text-white/80">
                Question: <span className="font-medium">{question.question}</span>
              </div>
            </div>

            {/* Judge Reasoning */}
            <div className="border border-white/20 rounded-lg p-3 sm:p-4 bg-black/30 backdrop-blur-sm">
              <div className="text-xs sm:text-sm font-semibold text-white/80 mb-2">
                🧠 Judge&apos;s Reasoning (groq/compound):
              </div>
              <div className="text-xs sm:text-sm text-white/90 whitespace-pre-wrap font-mono bg-black/20 p-2 sm:p-3 rounded">
                {judgment.reasoning}
              </div>
            </div>

            {/* User Answer */}
            <div className="border border-white/20 rounded-lg p-3 sm:p-4 bg-black/30 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-xs sm:text-sm text-white/65">Your Answer:</div>
                  <div className="text-base sm:text-lg font-medium text-white truncate">{userAnswer}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div
                    className={`text-base sm:text-xl font-bold ${
                      judgment.userCorrect ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {judgment.userCorrect ? "✓ Correct" : "✗ Incorrect"}
                  </div>
                  <div className="text-xs sm:text-sm text-white/65">{userTimeMs} ms</div>
                </div>
              </div>
            </div>

            {/* AI Results */}
            <div className="border border-white/20 rounded-lg p-3 sm:p-4 bg-black/30 backdrop-blur-sm">
              <div className="text-xs sm:text-sm font-semibold text-white/80 mb-3">AI Models:</div>
              {judgment.aiResults.length === 0 ? (
                <div className="text-xs sm:text-sm text-amber-400/80 py-4 text-center">
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
                        className="flex items-center justify-between py-2 border-b border-white/10 last:border-0 gap-2"
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                          <span
                            className={`text-base sm:text-lg flex-shrink-0 ${
                              ai.correct ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {ai.correct ? "✓" : "✗"}
                          </span>
                          <ModelIcon
                            provider={aiResult?.provider}
                            modelName={ai.model}
                            className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0"
                          />
                          <span className="text-xs sm:text-sm text-white font-medium truncate">{ai.model}</span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs sm:text-sm text-white font-mono">{ai.answer || "(no answer)"}</div>
                          {aiResult && (
                            <div className="text-[10px] sm:text-xs text-white/50">{aiResult.timeMs} ms</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Expected Answer */}
            <div className="border border-white/20 rounded-lg p-3 sm:p-4 bg-black/30 backdrop-blur-sm">
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

      {/* Handle gate modal */}
      {needHandle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" aria-modal="true">
          <div className="w-full max-w-sm bg-white rounded-lg p-4 sm:p-5 space-y-3 text-black" role="dialog" aria-labelledby="handle-title">
            <div id="handle-title" className="text-lg font-semibold text-black">Choose a handle</div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = handle.trim().slice(0, 20).replace(/[^a-zA-Z0-9_\-.]/g, "");
                if (!v) return;
                localStorage.setItem("beatbot_handle", v);
                setHandle(v);
                setNeedHandle(false);
              }}
              className="space-y-3"
            >
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="your handle"
                className="w-full px-3 py-2 border rounded-md text-black placeholder:text-black"
                autoFocus
              />
              <button type="submit" className="w-full rounded-md px-4 py-2 bg-[var(--accent)] text-white">Save & Continue</button>
            </form>
            <button
              className="text-xs text-black underline"
              onClick={() => {
                const v = "anon";
                localStorage.setItem("beatbot_handle", v);
                setHandle(v);
                setNeedHandle(false);
              }}
            >
              Continue as anon
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

