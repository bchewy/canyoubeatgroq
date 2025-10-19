"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import ModelIcon from "@/components/ModelIcon";

type RacerProgress = {
  model: string;
  provider: string;
  progress: number; // 0-100
  finished: boolean;
  finishTime?: number;
};

type GameState = "waiting" | "countdown" | "racing" | "finished";

const WORDS = [
  "algorithm",
  "typescript",
  "javascript",
  "database",
  "architecture",
  "performance",
  "optimization",
  "authentication",
  "deployment",
  "infrastructure",
  "middleware",
  "asynchronous",
  "polymorphism",
  "encapsulation",
  "parallelism",
];

export default function TypeRacerPage() {
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [word, setWord] = useState("");
  const [userInput, setUserInput] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [finishTime, setFinishTime] = useState<number | null>(null);
  const [racers, setRacers] = useState<RacerProgress[]>([]);
  const [aiResultsLoading, setAiResultsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startGame = useCallback(() => {
    // Pick random word
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWord(randomWord);
    setUserInput("");
    setFinishTime(null);
    setRacers([]);
    
    // Start countdown
    setGameState("countdown");
    let count = 3;
    setCountdown(count);

    const timer = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        setGameState("racing");
        setStartTime(Date.now());
        inputRef.current?.focus();
      }
    }, 1000);

    // Fetch AI race results
    setAiResultsLoading(true);
    fetch("/api/typeracer/race", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: randomWord }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.results) {
          setRacers(data.results.map((r: { model: string; provider: string; timeMs: number }) => ({
            model: r.model,
            provider: r.provider,
            progress: 0,
            finished: false,
            finishTime: r.timeMs,
          })));
        }
      })
      .catch((err) => {
        console.error("[typeracer] Failed to get AI race times:", err);
      })
      .finally(() => {
        setAiResultsLoading(false);
      });
  }, []);

  // Auto-focus input when racing starts
  useEffect(() => {
    if (gameState === "racing") {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [gameState]);

  // Update AI progress based on real API times
  useEffect(() => {
    if (gameState !== "racing" || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      setRacers(prev => prev.map(racer => {
        if (racer.finished) return racer;
        
        // Progress based on actual API response time
        const progress = Math.min(100, (elapsed / (racer.finishTime || 1000)) * 100);
        
        if (progress >= 100 && !racer.finished) {
          return {
            ...racer,
            progress: 100,
            finished: true,
          };
        }
        
        return { ...racer, progress };
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [gameState, startTime]);

  // Handle user typing
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== "racing") return;
    
    const value = e.target.value;
    setUserInput(value);

    // Check if finished
    if (value === word) {
      const elapsed = Date.now() - startTime!;
      
      setFinishTime(elapsed);
      setGameState("finished");
      
      // Check if user won
      const userWon = racers.every(r => elapsed < (r.finishTime || Infinity));
      if (userWon) {
        const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!reduce) {
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        }
      }
    }
  }, [gameState, word, startTime, racers]);

  const userProgress = word ? (userInput.length / word.length) * 100 : 0;
  const allRacersWithUser = [
    { model: "You", provider: "Human", progress: userProgress, finished: gameState === "finished", finishTime },
    ...racers
  ].sort((a, b) => {
    if (a.finished && b.finished) return (a.finishTime || 0) - (b.finishTime || 0);
    if (a.finished) return -1;
    if (b.finished) return 1;
    return b.progress - a.progress;
  });

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-64 flex flex-col items-center gap-4 sm:gap-6">
      <div className="w-full max-w-4xl space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/65 hover:text-white transition">
              ← Back
            </Link>
            <h1 className="text-xl font-semibold text-white">TypeRacer vs AI</h1>
          </div>
        </div>

        {/* Waiting */}
        {gameState === "waiting" && (
          <div className="border border-white/20 rounded-lg p-6 sm:p-8 bg-black/30 backdrop-blur-sm space-y-4">
            <div className="text-white">
              <h2 className="text-lg font-medium mb-2">Ready to Race?</h2>
              <p className="text-sm text-white/65 mb-4">
                Type the word as fast as you can. Race against real AI model API response times to see who finishes first!
              </p>
            </div>
            <button
              onClick={startGame}
              className="w-full px-4 py-3 rounded-md bg-[var(--accent)] text-white shadow-[0_6px_20px_rgba(255,92,57,.25)] font-medium"
            >
              Start Race
            </button>
          </div>
        )}

        {/* Countdown */}
        {gameState === "countdown" && (
          <div className="border border-white/20 rounded-lg p-6 sm:p-8 bg-black/30 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-base sm:text-lg text-white mb-4">Get ready...</div>
              <div className="text-6xl font-bold py-8 text-white">{countdown}</div>
            </div>
          </div>
        )}

        {/* Racing */}
        {(gameState === "racing" || gameState === "finished") && (
          <div className="space-y-4">
            {/* Word to type */}
            <div className="border border-white/20 rounded-lg p-8 bg-black/30 backdrop-blur-sm">
              <div className="text-4xl sm:text-6xl text-center text-white font-mono font-bold tracking-wider">
                {word.split('').map((char, i) => {
                  const typed = userInput[i];
                  const isCorrect = typed === char;
                  const isTyped = i < userInput.length;
                  
                  return (
                    <span
                      key={i}
                      className={
                        isTyped
                          ? isCorrect
                            ? "text-green-400"
                            : "text-red-400 bg-red-900/30"
                          : "text-white/50"
                      }
                    >
                      {char}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Input */}
            <div className="border border-white/20 rounded-lg p-4 bg-black/30 backdrop-blur-sm">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={handleInputChange}
                disabled={gameState === "finished"}
                className="w-full px-4 py-3 border border-white/20 rounded-md bg-black/20 text-white placeholder:text-white/50 font-mono"
                placeholder="Start typing..."
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
              />
            </div>

            {/* Progress bars */}
            <div className="border border-white/20 rounded-lg p-4 bg-black/30 backdrop-blur-sm space-y-3">
              <div className="text-sm font-semibold text-white/80 mb-3">
                Race Progress:
                {aiResultsLoading && (
                  <span className="ml-2 text-xs text-amber-400/80">
                    (loading AI times...)
                  </span>
                )}
              </div>
              {allRacersWithUser.map((racer, idx) => (
                <div key={racer.model} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {idx === 0 && racer.finished && gameState === "finished" && (
                        <span className="text-lg">🏆</span>
                      )}
                      {racer.model === "You" ? (
                        <span className="font-semibold text-white">{racer.model}</span>
                      ) : (
                        <>
                          <ModelIcon provider={racer.provider} modelName={racer.model} className="w-4 h-4" />
                          <span className="text-white/80">{racer.model}</span>
                        </>
                      )}
                    </div>
                    <div className="text-white/60 text-xs font-mono">
                      {racer.finished 
                        ? `${((racer.finishTime || 0) / 1000).toFixed(3)}s`
                        : `${racer.progress.toFixed(0)}%`
                      }
                    </div>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-100 ${
                        racer.model === "You" 
                          ? "bg-gradient-to-r from-orange-400 to-red-500" 
                          : "bg-gradient-to-r from-blue-400 to-blue-600"
                      }`}
                      style={{ width: `${racer.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Results */}
            {gameState === "finished" && (
              <div className="space-y-4 relative z-20">
                <div className={`border rounded-lg p-6 backdrop-blur-sm ${
                  allRacersWithUser[0].model === "You"
                    ? "bg-green-950/40 border-green-500/40"
                    : "bg-red-950/30 border-red-500/30"
                }`}>
                  <div className={`text-2xl font-bold mb-2 ${
                    allRacersWithUser[0].model === "You" ? "text-green-400" : "text-red-400"
                  }`}>
                    {allRacersWithUser[0].model === "You" ? "🏆 You Win!" : "🤖 AI Wins!"}
                  </div>
                  <div className="text-sm text-white/90">
                    Your time: <span className="font-mono font-semibold">{((finishTime || 0) / 1000).toFixed(3)}s</span>
                  </div>
                  {allRacersWithUser[0].model !== "You" && (
                    <div className="text-sm text-white/70">
                      Winner: <span className="font-semibold">{allRacersWithUser[0].model}</span> ({((allRacersWithUser[0].finishTime || 0) / 1000).toFixed(3)}s)
                    </div>
                  )}
                </div>

                {/* Full Results Leaderboard */}
                <div className="border border-white/20 rounded-lg p-4 bg-black/30 backdrop-blur-sm">
                  <div className="text-sm font-semibold text-white/80 mb-3">Full Results:</div>
                  <div className="space-y-2">
                    {allRacersWithUser.map((racer, idx) => (
                      <div
                        key={racer.model}
                        className={`flex items-center justify-between py-2 px-3 rounded-md ${
                          idx === 0
                            ? "bg-green-500/20 border border-green-500/30"
                            : "bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-white/60 font-mono text-xs w-5 flex-shrink-0">
                            #{idx + 1}
                          </span>
                          {idx === 0 && (
                            <span className="text-lg flex-shrink-0">🏆</span>
                          )}
                          {racer.model === "You" ? (
                            <span className="font-semibold text-white">You</span>
                          ) : (
                            <div className="flex items-center gap-2 min-w-0">
                              <ModelIcon provider={racer.provider} modelName={racer.model} className="w-4 h-4 flex-shrink-0" />
                              <span className="text-white/90 truncate">{racer.model}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="font-mono text-white font-semibold">
                            {((racer.finishTime || 0) / 1000).toFixed(3)}s
                          </span>
                          {idx > 0 && (
                            <span className="text-xs text-white/50 font-mono">
                              +{(((racer.finishTime || 0) - (allRacersWithUser[0].finishTime || 0)) / 1000).toFixed(3)}s
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setGameState("waiting");
                    setUserInput("");
                    setStartTime(null);
                  }}
                  className="w-full px-4 py-3 rounded-md bg-[var(--accent)] text-white shadow-[0_6px_20px_rgba(255,92,57,.25)] font-medium mb-8"
                >
                  Race Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

