"use client";

import Link from "next/link";
import { useState } from "react";
import TopicPicker from "@/components/TopicPicker";
import ModelIcon from "@/components/ModelIcon";

type LeaderboardEntry = {
  userHandle: string;
  winMarginMs: number;
  userTimeMs: number;
  aiTimeMs: number;
  aiModel: string;
};

// Simple hash function to generate consistent color from username
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 50%)`;
}

// Get initials from username
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

const GROQ_MODELS = ["llama-3.3-70b", "compound", "compound-mini"];

export default function HomeContent({ entries }: { entries: LeaderboardEntry[] }) {
  const [allowAllModels, setAllowAllModels] = useState(false);

  // Filter leaderboard based on toggle
  const filteredEntries = allowAllModels 
    ? entries 
    : entries.filter(e => GROQ_MODELS.includes(e.aiModel));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 pb-32 gap-6 sm:gap-8">
      <div className="text-center space-y-4 sm:space-y-6">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.45)] flex flex-wrap items-center gap-2 sm:gap-3 justify-center">
          Can{" "}
          <span className="bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 bg-clip-text text-transparent animate-pulse drop-shadow-[0_0_20px_rgba(249,115,22,0.6)]" style={{ filter: 'drop-shadow(0 0 20px rgba(249, 115, 22, 0.6))' }}>
            you
          </span>{" "}
          beat{" "}
          <svg fill="currentColor" fillRule="evenodd" height="1em" style={{ flex: "none", lineHeight: 1 }} viewBox="0 0 64 24" xmlns="http://www.w3.org/2000/svg">
            <title>Groq</title>
            <path d="M37.925 2.039c4.142 0 7.509 3.368 7.509 7.528l-.004.244c-.128 4.047-3.437 7.284-7.505 7.284-4.15 0-7.509-3.368-7.509-7.528s3.36-7.528 7.509-7.528zm-11.144-.023c.26 0 .522.015.775.046l.015-.008a7.464 7.464 0 012.922.969L29.09 5.468a4.619 4.619 0 00-2.309-.6h-.253l-.253.016c-.338.03-.66.092-.982.177-.621.169-1.196.469-1.703.869a4.062 4.062 0 00-1.418 2.322l-.04.234-.03.235c-.007.077-.023.161-.023.238l-.014 2.713v2.593l-.016 2.522h-2.815l-.03-4.973V8.852c0-.139.015-.262.022-.392.023-.262.062-.523.115-.777.1-.523.269-1.03.491-1.515a6.998 6.998 0 011.948-2.484 7.465 7.465 0 012.754-1.391c.49-.131.99-.216 1.495-.254.123-.008.253-.023.376-.023h.376zM37.925 4.86a4.7 4.7 0 00-4.694 4.706 4.7 4.7 0 004.694 4.706 4.7 4.7 0 004.694-4.706l-.005-.216a4.7 4.7 0 00-4.689-4.49zM9.578 2C5.428 1.96 2.038 5.298 2 9.458c-.038 4.16 3.29 7.559 7.44 7.597h2.608v-2.822h-2.47c-2.592.031-4.717-2.053-4.748-4.652a4.7 4.7 0 014.64-4.76h.108c2.52 0 4.577 1.992 4.696 4.49l.005.216v6.936c0 2.576-2.093 4.676-4.655 4.706a4.663 4.663 0 01-3.267-1.376l-1.994 2A7.46 7.46 0 009.57 24h.1c4.096-.062 7.386-3.391 7.409-7.497V9.35c-.1-4.09-3.428-7.35-7.501-7.35zm44.929.038c-4.15 0-7.509 3.368-7.509 7.528s3.36 7.528 7.509 7.528h2.57v-2.822h-2.57a4.7 4.7 0 01-4.694-4.706 4.7 4.7 0 014.694-4.706A4.707 4.707 0 0159.16 8.94l.024.22v14.456H62V9.566c-.008-4.152-3.352-7.527-7.493-7.527z"></path>
          </svg>
          ?
        </h1>
        <p className="text-sm sm:text-base md:text-lg text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,.45)] max-w-2xl px-4">
          Test your speed against the fastest AI models. Choose your game mode:
        </p>
      </div>

      {/* Two Game Cards */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Speed Challenge Card */}
        <div className="border border-white/20 rounded-lg bg-black/30 backdrop-blur-sm p-6 sm:p-8 space-y-6 hover:border-orange-500/40 transition-all hover:shadow-[0_0_30px_rgba(249,115,22,0.2)]">
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.45)] flex flex-wrap items-center gap-2 justify-start">
              <span className="bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 bg-clip-text text-transparent">
                Speed
              </span>{" "}
              Challenge
            </h2>
            <p className="text-sm text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,.45)]">
              Solve math, logic & word puzzles faster than the fastest AI models
            </p>
            <div className="flex flex-col gap-3 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <span>30 second time limit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🧠</span>
                <span>Math, logic & word puzzles</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🏆</span>
                <span>Beat AI, claim victory</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Link href={`/play?allowAll=${allowAllModels}`} className="rounded-full px-6 py-3 bg-[var(--accent)] text-white shadow-[0_12px_30px_rgba(255,92,57,.35)] hover:translate-y-[-1px] transition font-medium">
                Start
              </Link>
              <TopicPicker />
            </div>
            <label className="flex items-center gap-2 text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,.45)] text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={allowAllModels}
                onChange={(e) => setAllowAllModels(e.target.checked)}
                className="w-4 h-4 rounded border-white/20"
              />
              allow all other models
            </label>
          </div>
        </div>

        {/* One-Word Challenge Card */}
        <div className="border border-white/20 rounded-lg bg-black/30 backdrop-blur-sm p-6 sm:p-8 space-y-6 hover:border-orange-500/40 transition-all hover:shadow-[0_0_30px_rgba(249,115,22,0.2)]">
          <div className="space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.45)] flex flex-wrap items-center gap-2 justify-start">
              <span className="bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 bg-clip-text text-transparent">
                One-Word
              </span>{" "}
              Challenge
            </h2>
            <p className="text-sm text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,.45)]">
              Pick any topic. AI generates a trivia question. Answer in ONE WORD faster than AI models.
            </p>
            <div className="flex flex-col gap-3 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <span>Choose any custom topic</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <span>Instant question generation</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <span>Head-to-head with AI</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <Link href="/oneword" className="block text-center rounded-full px-6 py-3 bg-[var(--accent)] text-white shadow-[0_12px_30px_rgba(255,92,57,.35)] hover:translate-y-[-1px] transition font-medium">
              Play One-Word
            </Link>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="w-full max-w-6xl">
        <h2 className="font-semibold mb-2 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,.45)] text-sm sm:text-base">Today&apos;s Top 10 - Speed Challenge</h2>
        <div className="border border-white/20 rounded-lg bg-black/30 backdrop-blur-sm" role="list">
          {filteredEntries.length === 0 ? (
            <div className="p-3 sm:p-4 text-xs sm:text-sm text-white/80">Be first. Set the pace.</div>
          ) : (
            filteredEntries.map((e, i) => (
              <div key={i} className="p-2 sm:p-3 flex items-center justify-between gap-2 text-xs sm:text-sm border-t first:border-0 border-white/10" role="listitem">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <span className="w-4 sm:w-6 text-right text-white font-semibold flex-shrink-0">{i + 1}</span>
                  <div 
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-[10px] sm:text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: getAvatarColor(e.userHandle) }}
                  >
                    {getInitials(e.userHandle)}
                  </div>
                  <span className="font-mono text-white text-xs sm:text-sm truncate">{e.userHandle}</span>
                </div>
                <div className="font-mono text-white text-right flex-shrink-0">
                  <div className="text-[10px] sm:text-xs text-white/50 flex items-center justify-end gap-1">
                    <span className="hidden sm:inline">beat</span>
                    <ModelIcon modelName={e.aiModel} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span className="truncate max-w-[60px] sm:max-w-none">{e.aiModel}</span>
                  </div>
                  <div className="text-[10px] sm:text-sm">
                    +{e.winMarginMs} ms
                    <span className="hidden sm:inline text-white/60"> ({e.userTimeMs} {"<"} {e.aiTimeMs})</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

