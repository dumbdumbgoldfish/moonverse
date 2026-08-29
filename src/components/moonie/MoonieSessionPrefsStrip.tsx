"use client";

import { useEffect, useState } from "react";
import {
  formatSessionPreferenceSummary,
  readSessionPreferences,
} from "@/lib/moonie/personalization";
import { cn } from "@/lib/utils";

export function MoonieSessionPrefsStrip({ className }: { className?: string }) {
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setSummary(formatSessionPreferenceSummary(readSessionPreferences()));
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("mv-moonie-session-prefs-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("mv-moonie-session-prefs-change", sync);
    };
  }, []);

  if (!summary) return null;

  return (
    <div
      className={cn(
        "flex max-w-full flex-wrap items-center gap-1.5 rounded-full border border-violet-200/80 bg-violet-50/80 px-2 py-0.5 text-[10px] text-[#4C2A67]",
        className
      )}
      role="status"
    >
      <span className="font-bold uppercase tracking-[0.1em] text-[#6E46C7]">
        This chat
      </span>
      <span className="text-slate-700">{summary}</span>
    </div>
  );
}
