"use client";

import { useEffect, useState } from "react";

type Topic = "mixed" | "math" | "words" | "logic" | "sequence" | "emoji";

const OPTIONS: { value: Topic; label: string }[] = [
  { value: "mixed", label: "Mixed" },
  { value: "math", label: "Mental Math" },
  { value: "words", label: "Word Play" },
  { value: "logic", label: "Logic" },
  { value: "sequence", label: "Sequences" },
  { value: "emoji", label: "Emoji Math" },
];

export default function TopicPicker() {
  const [topic, setTopic] = useState<Topic>("mixed");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("beatbot_topic") as Topic | null;
      if (saved) setTopic(saved);
    } catch {}
  }, []);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="topic" className="text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,.45)] text-sm">
        Topic
      </label>
      <select
        id="topic"
        value={topic}
        onChange={(e) => {
          const t = e.target.value as Topic;
          setTopic(t);
          try { localStorage.setItem("beatbot_topic", t); } catch {}
        }}
        className="px-3 py-2 rounded-md bg-black/30 text-white border border-white/20 backdrop-blur-sm"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}


