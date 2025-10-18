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
    <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,.45)]">Can you beat groq?</h1>
        <p className="text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,.45)]">One Question. 30 seconds. Can you beat groq really mah???</p>
      </div>
      <div className="flex items-center gap-4 flex-col sm:flex-row">
        <Link href={`/play?allowAll=${allowAllModels}`} className="rounded-full px-6 py-3 bg-[var(--accent)] text-white shadow-[0_12px_30px_rgba(255,92,57,.35)] hover:translate-y-[-1px] transition">
          Start
        </Link>
        <TopicPicker />
        <label className="flex items-center gap-2 text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,.45)] text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={allowAllModels}
            onChange={(e) => setAllowAllModels(e.target.checked)}
            className="w-4 h-4 rounded border-white/20"
          />
          allow all other models
        </label>
      </div>
      <div className="w-full max-w-xl">
        <h2 className="font-semibold mb-2 text-white drop-shadow-[0_1px_4px_rgba(0,0,0,.45)]">Today's Top 10</h2>
        <div className="border border-white/20 rounded-lg bg-black/30 backdrop-blur-sm" role="list">
          {filteredEntries.length === 0 ? (
            <div className="p-4 text-sm text-white/80">Be first. Set the pace.</div>
          ) : (
            filteredEntries.map((e, i) => (
              <div key={i} className="p-3 flex items-center justify-between text-sm border-t first:border-0 border-white/10" role="listitem">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-right text-white font-semibold">{i + 1}</span>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: getAvatarColor(e.userHandle) }}
                  >
                    {getInitials(e.userHandle)}
                  </div>
                  <span className="font-mono text-white">{e.userHandle}</span>
                </div>
                <div className="font-mono text-white text-right">
                  <div className="text-xs text-white/50 flex items-center justify-end gap-1">beat <ModelIcon modelName={e.aiModel} className="w-3 h-3" /> {e.aiModel}</div>
                  <div>+{e.winMarginMs} ms <span className="text-white/60">({e.userTimeMs} {"<"} {e.aiTimeMs})</span></div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

