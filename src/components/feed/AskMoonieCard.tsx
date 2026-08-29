"use client";

import { Sparkles } from "lucide-react";
import { AskMoonieButton } from "@/components/moonie/AskMoonieButton";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { openMoonie } from "@/lib/moonie/open-moonie";
import { moonieVariantFor } from "@/lib/moonie/variants";

const QUICK_PROMPTS = ["Something cosy", "A completed GL romance"] as const;

export function AskMoonieCard() {
  return (
    <section className="rounded-2xl border border-violet-100 bg-gradient-to-br from-[#faf8ff] to-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <MoonieMascot
          variant={moonieVariantFor("askMoonie")}
          size={48}
          display="badge"
          lightweight
        />
        <div className="min-w-0">
          <p className="font-bold text-night-blue">Ask Moonie</p>
          <p className="text-xs leading-snug text-slate-600">
            Tell Moonie a mood or trope and get matching novel picks.
          </p>
        </div>
      </div>
      <AskMoonieButton className="mt-3 w-full" size="sm">
        Chat with Moonie
      </AskMoonieButton>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => openMoonie(prompt)}
            className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-primary ring-1 ring-violet-100 transition hover:bg-violet-50"
          >
            {prompt}
          </button>
        ))}
      </div>
    </section>
  );
}
