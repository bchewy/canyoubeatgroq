"use client";

import { useState, useEffect } from "react";

export default function RoadmapToast() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("roadmapToastDismissed");
    if (!dismissed) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 100);
    }
  }, []);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem("roadmapToastDismissed", "true");
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 max-w-[320px] z-50 transition-all duration-300 ${
        isAnimating
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4"
      }`}
    >
      <div className="border border-orange-500/30 rounded-lg bg-black/40 backdrop-blur-sm shadow-[0_0_20px_rgba(249,115,22,0.2)] p-4 pr-10 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div className="text-white/90 text-sm space-y-2">
          <div className="font-semibold text-orange-400">🚀 Coming Soon</div>
          <p className="leading-relaxed">
            More models and complex tests on the way! Stay tuned. The project is also open-source on GitHub!
          </p>
        </div>
      </div>
    </div>
  );
}

