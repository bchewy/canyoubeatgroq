"use client";

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import confetti from "canvas-confetti";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ModelIcon from "@/components/ModelIcon";
import html2canvas from "html2canvas";

type Problem = {
  id: string;
  type: "mcq" | "short";
  prompt: string;
  choices?: string[];
};

type StartResp = {
  problem: Problem;
  startToken: string;
  seed: string;
  expiresAt: number;
};

type ModelResult = {
  model: string;
  provider?: string;
  timeMs: number;
  answer: string;
  beaten: boolean;
  winMarginMs?: number;
};

type SubmitResp = {
  outcome?: "win" | "loss" | "timeout" | "wrong";
  userTimeMs?: number | null;
  modelResults?: ModelResult[];
  savedToLb?: boolean;
  error?: string;
  correctAnswer?: string | null;
};

function PlayPageContent() {
  const searchParams = useSearchParams();
  const allowAllModels = searchParams.get("allowAll") === "true";
  const [handle, setHandle] = useState("");
  const [needHandle, setNeedHandle] = useState(false);
  type Topic = "mixed" | "math" | "words" | "logic" | "sequence" | "emoji";
  const TOPIC_OPTIONS: { value: Topic; label: string }[] = [
    { value: "mixed", label: "Mixed" },
    { value: "math", label: "Mental Math" },
    { value: "words", label: "Word Play" },
    { value: "logic", label: "Logic" },
    { value: "sequence", label: "Sequences" },
    { value: "emoji", label: "Emoji Math" },
  ];
  const [topic, setTopic] = useState<Topic>("mixed");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [startToken, setStartToken] = useState<string>("");
  const [seed, setSeed] = useState<string>("");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<SubmitResp | null>(null);
  const issuedAtMsRef = useRef<number | null>(null);
  const cachedAiResultsRef = useRef<ModelResult[] | null>(null);
  const [showShareBanner, setShowShareBanner] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  const startRound = useCallback(async () => {
    setResult(null);
    setAnswer("");
    setCountdown(3);
    const res = await fetch("/api/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic }) });
    const data = (await res.json()) as StartResp;
    setProblem(data.problem);
    setStartToken(data.startToken);
    setSeed(data.seed);
    issuedAtMsRef.current = data.expiresAt - 35_000;

    // Fetch and cache AI results
    fetch("/api/ai-solve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId: data.problem.id, seed: data.seed, allowAllModels }),
    })
      .then((r) => r.json())
      .then((aiData) => {
        if (aiData.results) {
          // Convert to ModelResult format
          cachedAiResultsRef.current = aiData.results.map((r: { model: string; provider?: string; aiTimeMs: number; aiAnswer: string }) => ({
            model: r.model,
            provider: r.provider,
            timeMs: r.aiTimeMs,
            answer: r.aiAnswer,
            beaten: false,
          }));
        }
      })
      .catch(() => {
        cachedAiResultsRef.current = null;
      });

    // 3-2-1 countdown
    let t = 3;
    setCountdown(t);
    const timer = setInterval(() => {
      t -= 1;
      setCountdown(t);
      if (t <= 0) {
        clearInterval(timer);
        setCountdown(0);
      }
    }, 1000);
  }, [topic, allowAllModels]);

  useEffect(() => {
    const savedHandle = typeof window !== "undefined" ? localStorage.getItem("beatbot_handle") : null;
    const savedTopic = typeof window !== "undefined" ? (localStorage.getItem("beatbot_topic") as Topic | null) : null;
    if (savedTopic) setTopic(savedTopic);
    if (savedHandle) {
      setHandle(savedHandle);
      startRound();
    } else {
      setNeedHandle(true);
    }
  }, [startRound]);

  const canAnswer = useMemo(() => countdown === 0 && !result, [countdown, result]);

  const handleSubmit = useCallback(async (val?: string) => {
    if (!problem || !startToken || !canAnswer) return;
    const payload = {
      problemId: problem.id,
      startToken,
      userAnswer: (val ?? answer).trim(),
      desiredHandle: handle.trim(),
      cachedAiResults: cachedAiResultsRef.current,
      allowAllModels,
    };
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as SubmitResp;
    setResult(data);
    const reduce = typeof window !== "undefined" && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && data.outcome === "win") confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
  }, [problem, startToken, canAnswer, answer, handle, allowAllModels]);

  const deadlineMs = issuedAtMsRef.current ? issuedAtMsRef.current + 30_000 : null;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, []);

  const timeLeft = useMemo(() => {
    if (!deadlineMs) return 0;
    return Math.max(0, deadlineMs - now);
  }, [deadlineMs, now]);

  return (
    <div className="min-h-screen p-4 sm:p-6 pb-32 flex flex-col items-center gap-4 sm:gap-6">
      <div className="w-full max-w-2xl space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/65 hover:text-white transition">
              ← Back
            </Link>
            <h1 className="text-xl font-semibold text-white">Beat Groq?: Play</h1>
          </div>
          <div className="text-sm text-white/65">{handle ? `@${handle}` : ""}</div>
        </div>

        <div className="h-2 w-full bg-black/10 rounded overflow-hidden" role="progressbar" aria-label="Round progress" aria-valuemin={0} aria-valuemax={30000} aria-valuenow={Math.max(0, 30000 - timeLeft)}>
          <div className="h-full bg-[var(--accent)] transition-[width]" style={{ width: `${(Math.max(0, 30_000 - timeLeft) / 30_000) * 100}%` }} />
        </div>

        <div className="border border-white/20 rounded-lg p-3 sm:p-4 bg-black/30 backdrop-blur-sm">
          {!problem ? (
            <div className="text-white">Loading…</div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              <div className="text-sm text-white/65">Round seed: {seed}</div>
              <div className="text-lg font-medium text-white">{problem.prompt}</div>

              {countdown !== 0 ? (
                <div className="text-center text-3xl font-bold py-6 text-white">{countdown ?? ""}</div>
              ) : problem.type === "mcq" ? (
                <div className="grid grid-cols-2 gap-3">
                  {problem.choices?.map((c) => (
                    <button
                      key={c}
                      className="border border-white/20 rounded-md px-3 py-3 bg-black/20 hover:bg-black/40 disabled:opacity-50 text-white"
                      onClick={() => handleSubmit(c)}
                      disabled={!canAnswer}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  className="flex items-center gap-2"
                >
                  <label htmlFor="answer" className="sr-only">Your answer</label>
                  <input
                    id="answer"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="type answer"
                    className="flex-1 px-3 py-2 border border-white/20 rounded-md bg-black/20 text-white placeholder:text-white/50"
                    disabled={!canAnswer}
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-[var(--accent)] text-white disabled:opacity-50 shadow-[0_6px_20px_rgba(255,92,57,.25)]"
                    disabled={!canAnswer}
                  >
                    Submit
                  </button>
                </form>
              )}

              {result && (
                <div className={`mt-4 p-3 rounded-md border backdrop-blur-sm text-white ${
                  result.outcome === "win" 
                    ? "bg-green-950/40 border-green-500/40" 
                    : result.outcome === "loss" 
                    ? "bg-red-950/30 border-red-500/30"
                    : result.outcome === "wrong"
                    ? "bg-red-950/30 border-red-500/30"
                    : "bg-black/30 border-white/20"
                }`} aria-live="polite">
                  {!result.outcome && <div className="text-sm">Error. Try again.</div>}
                  {(result.outcome === "win" || result.outcome === "loss" || result.outcome === "wrong" || result.outcome === "timeout") && (
                    <div className="space-y-2">
                      <div className={`font-semibold ${
                        result.outcome === "win" 
                          ? "text-2xl text-green-400" 
                          : result.outcome === "loss"
                          ? "text-lg text-red-400"
                          : result.outcome === "wrong"
                          ? "text-lg text-red-400"
                          : "text-lg text-amber-400"
                      }`}>
                        {result.outcome === "win" && "🏆 Humanity +1"}
                        {result.outcome === "loss" && "Outpaced by silicon"}
                        {result.outcome === "wrong" && "Wrong answer"}
                        {result.outcome === "timeout" && "Timeout"}
                      </div>
                      <div className="text-sm font-mono">
                        You: {result.userTimeMs} ms
                      </div>
                      {result.modelResults && result.modelResults.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-white/65">AI Models:</div>
                          {result.modelResults.map((mr) => (
                            <div key={mr.model} className="text-sm font-mono flex items-center justify-between">
                              <span className={mr.beaten ? "text-green-600" : "text-red-600"}>
                                {mr.beaten ? "✓" : "✗"} <ModelIcon provider={mr.provider} modelName={mr.model} className="w-4 h-4 inline-block mr-1" /> {mr.model} {mr.provider && <span className="text-xs opacity-60">({mr.provider})</span>}
                              </span>
                              <span>
                                {mr.timeMs} ms
                                {mr.winMarginMs != null && mr.beaten && (
                                  <span className="text-green-600"> (+{mr.winMarginMs})</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="text-sm font-mono">
                        Correct: {result.correctAnswer ?? "—"}
                      </div>
                      {result.outcome === "win" && (
                        <div className="text-xs text-white/65">
                          {result.savedToLb ? "Saved to leaderboard." : "(Not saved)"}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="pt-2 flex items-center gap-3">
                    <a href="/play" className="text-sm underline text-white">Play again</a>
                    {(result.outcome === "win" || result.outcome === "loss") && (
                      <button
                        onClick={() => setShowShareBanner(true)}
                        className="text-sm px-3 py-1 rounded-md bg-black/40 hover:bg-black/60 border border-white/20 text-white transition"
                      >
                        Share to 𝕏
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
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
                localStorage.setItem("beatbot_topic", topic);
                setHandle(v);
                setNeedHandle(false);
                startRound();
              }}
              className="space-y-3"
            >
              <label className="text-sm block text-black">Topic</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value as Topic)}
                className="w-full px-3 py-2 border rounded-md text-black"
              >
                {TOPIC_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="your handle"
                className="w-full px-3 py-2 border rounded-md text-black placeholder:text-black"
                autoFocus
              />
              <button type="submit" className="w-full rounded-md px-4 py-2 bg-[var(--accent)] text-white">Save & Start</button>
            </form>
            <button
              className="text-xs text-black underline"
              onClick={() => {
                const v = "anon";
                localStorage.setItem("beatbot_handle", v);
                localStorage.setItem("beatbot_topic", topic);
                setHandle(v);
                setNeedHandle(false);
                startRound();
              }}
            >
              Continue as anon
            </button>
          </div>
        </div>
      )}
      {/* Share Banner Modal */}
      {showShareBanner && result && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} onClick={() => setShowShareBanner(false)}>
          <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Results-style Banner Card */}
            <div ref={bannerRef} className="rounded-lg shadow-2xl overflow-hidden w-full max-w-[600px] mx-auto" style={{ backgroundColor: '#2D1F1A' }}>
              {/* Header */}
              <div className="px-4 sm:px-6 py-3 sm:py-4" style={{ backgroundColor: '#3D2B23' }}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="text-2xl sm:text-3xl">{result.outcome === "win" ? "🏆" : "⚡"}</div>
                    <div>
                      <div className="text-lg sm:text-xl font-bold" style={{ color: '#FF5C39' }}>
                        {result.outcome === "win" ? "Victory!" : "Nice Try!"}
                      </div>
                      <div className="text-xs sm:text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        @{handle} vs AI
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] sm:text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Your Time</div>
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: '#FF5C39' }}>{result.userTimeMs}ms</div>
                  </div>
                </div>
              </div>

              {/* AI Models List */}
              <div className="px-4 sm:px-6 py-3 sm:py-4">
                <div className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  AI Models:
                </div>
                <div className="space-y-1 font-mono text-xs sm:text-sm">
                  {result.modelResults && result.modelResults.map((mr) => (
                    <div key={mr.model} className="flex items-center justify-between py-1 gap-2">
                      <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                        <span style={{ color: mr.beaten ? '#10B981' : '#EF4444', fontSize: '12px' }} className="sm:text-sm flex-shrink-0">
                          {mr.beaten ? "✓" : "✗"}
                        </span>
                        <ModelIcon provider={mr.provider} modelName={mr.model} className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span style={{ color: mr.beaten ? '#10B981' : '#EF4444', fontSize: '11px' }} className="sm:text-[13px] truncate">
                          {mr.model}
                        </span>
                        {mr.provider && (
                          <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '10px' }} className="sm:text-[11px] hidden sm:inline">
                            ({mr.provider})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <span style={{ color: '#FFFFFF', fontSize: '11px' }} className="sm:text-[13px]">
                          {mr.timeMs} ms
                        </span>
                        {mr.winMarginMs != null && mr.beaten && (
                          <span style={{ color: '#10B981', fontSize: '11px' }} className="sm:text-[13px]">
                            (+{mr.winMarginMs})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-2 sm:py-3 text-center" style={{ backgroundColor: '#3D2B23' }}>
                <div className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                  canyoubeatgroq.com
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex gap-3 justify-center">
              <button
                onClick={() => setShowShareBanner(false)}
                className="px-6 py-2 rounded-lg text-white border transition font-medium"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
              >
                Close
              </button>
              <button
                onClick={async () => {
                  if (!bannerRef.current) return;
                  
                  // Store original console methods
                  const originalWarn = console.warn;
                  const originalError = console.error;
                  
                  try {
                    // Suppress console warnings and errors temporarily
                    console.warn = (...args: unknown[]) => {
                      if (args[0]?.toString?.().includes('oklab')) return;
                      originalWarn(...args);
                    };
                    console.error = (...args: unknown[]) => {
                      if (args[0]?.toString?.().includes('oklab')) return;
                      originalError(...args);
                    };
                    
                    // Generate image from banner
                    const canvas = await html2canvas(bannerRef.current, {
                      backgroundColor: '#ffffff',
                      scale: 2,
                      logging: false,
                      allowTaint: true,
                      useCORS: true,
                    });
                    
                    // Restore console
                    console.warn = originalWarn;
                    console.error = originalError;
                    
                    // Convert to blob and download
                    canvas.toBlob((blob) => {
                      if (!blob) return;
                      
                      // Create download link
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `beatgroq-${handle}-${result.userTimeMs}ms.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(url);
                      
                      // Open Twitter with text
                      const beatenCount = result.modelResults?.filter(m => m.beaten).length ?? 0;
                      const totalModels = result.modelResults?.length ?? 0;
                      let tweetText = "";
                      
                      if (result.outcome === "win") {
                        tweetText = `🏆 I just beat AI at BeatGroq!\n\n⚡ ${result.userTimeMs}ms\n🤖 Beat ${beatenCount}/${totalModels} models\n\nCan you do better? 👀`;
                      } else {
                        tweetText = `🤖 Just competed against AI at BeatGroq!\n\n⚡ ${result.userTimeMs}ms\n\nThink you can beat it? 👀`;
                      }
                      
                      const text = encodeURIComponent(tweetText);
                      setTimeout(() => {
                        window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "width=550,height=420");
                      }, 500);
                    }, 'image/png');
                  } catch (err) {
                    // Ensure console is restored even on error
                    console.warn = originalWarn;
                    console.error = originalError;
                    console.error('Failed to generate image:', err);
                  }
                }}
                className="px-6 py-2 rounded-lg bg-black hover:bg-gray-800 text-white font-semibold transition shadow-lg"
              >
                Share to 𝕏
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}>
      <PlayPageContent />
    </Suspense>
  );
}

