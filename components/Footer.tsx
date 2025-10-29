"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface Stats {
  totalChallenges: number;
  totalPlayers: number;
  codingChallenges: number;
  typeracerRaces: number;
  onewordChallenges: number;
}

export default function Footer() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Failed to load stats:", err));
  }, []);

  return (
    <footer
      className="bg-black/40 backdrop-blur-md border-t border-white/10"
      style={{
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.3)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Left: Live Stats */}
          <div className="flex flex-col space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1">
              Live Stats
            </h3>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                  {stats ? stats.totalChallenges.toLocaleString() : "---"}
                </span>
                <span className="text-xs text-white/60">challenges completed</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                  {stats ? stats.totalPlayers.toLocaleString() : "---"}
                </span>
                <span className="text-xs text-white/60">players worldwide</span>
              </div>
            </div>
          </div>

          {/* Center: Tech Stack */}
          <div className="flex flex-col space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1">
              Powered By
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://groq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <Image
                  src="/groq.svg"
                  alt="Groq"
                  width={60}
                  height={14}
                  className="opacity-70 group-hover:opacity-100 transition-opacity"
                  style={{ filter: "invert(1)" }}
                />
              </a>
              <a
                href="https://ai.google.dev/gemini-api"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <Image
                  src="/gemini.svg"
                  alt="Gemini"
                  width={20}
                  height={20}
                  className="opacity-70 group-hover:opacity-100 transition-opacity"
                />
                <span className="text-xs text-white/70 group-hover:text-white/90 transition-colors">
                  Gemini
                </span>
              </a>
              <a
                href="https://openai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <Image
                  src="/openai.svg"
                  alt="OpenAI"
                  width={20}
                  height={20}
                  className="opacity-70 group-hover:opacity-100 transition-opacity"
                />
                <span className="text-xs text-white/70 group-hover:text-white/90 transition-colors">
                  OpenAI
                </span>
              </a>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <Image
                  src="/supabase.svg"
                  alt="Supabase"
                  width={20}
                  height={20}
                  className="opacity-70 group-hover:opacity-100 transition-opacity"
                />
                <span className="text-xs text-white/70 group-hover:text-white/90 transition-colors">
                  Supabase
                </span>
              </a>
            </div>
          </div>

          {/* Right: Links & Credits */}
          <div className="flex flex-col space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1">
              Connect
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <a
                  href="https://x.com/bchewyme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="opacity-70 group-hover:opacity-100 transition-opacity"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>@bchewyme</span>
                </a>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://github.com/bchewy/canyoubeatgroq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="opacity-70 group-hover:opacity-100 transition-opacity"
                  >
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                  </svg>
                  <span>View Source</span>
                </a>
              </div>
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <span>Built for the</span>
                  <Image
                    src="/cursor.svg"
                    alt="Cursor"
                    width={45}
                    height={10}
                    className="opacity-60"
                    style={{ filter: "invert(1)" }}
                  />
                  <span>Hackathon</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
