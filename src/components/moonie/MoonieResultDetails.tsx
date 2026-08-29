"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { MoonieCompareChip } from "@/components/moonie/MoonieDesk";
import { MoonieProvenanceStrip } from "@/components/moonie/MoonieProvenanceStrip";
import { MoonieWhyPersonalised } from "@/components/moonie/MoonieWhyPersonalised";
import {
  requestDiagnosticsSummary,
  type MoonieCardDensity,
} from "@/lib/moonie/presentation";
import { confidenceLabel } from "@/lib/moonie/provenance";
import { cn } from "@/lib/utils";
import type {
  MoonieChatMessage,
  MoonieInterpretedPreferences,
  MoonieMatchEvidence,
  MoonieRecommendation,
} from "@/types/moonie";

interface MoonieResultDetailsProps {
  message?: MoonieChatMessage;
  recommendation?: MoonieRecommendation;
  prefs?: MoonieInterpretedPreferences | null;
  hiddenCount?: number;
  userQuery?: string;
  matchEvidence?: MoonieMatchEvidence[];
  density?: MoonieCardDensity;
  className?: string;
}

export function MoonieResultDetails({
  message,
  recommendation,
  prefs,
  hiddenCount = 0,
  userQuery,
  matchEvidence,
  density = "desk",
  className,
}: MoonieResultDetailsProps) {
  const [open, setOpen] = useState(false);
  const rec = recommendation ?? message?.recommendations?.[0];
  const summary = message
    ? requestDiagnosticsSummary(message, { prefs, hiddenCount })
    : [];
  const evidence = matchEvidence ?? rec?.matchEvidence ?? [];
  const showFullDiagnostics = density === "desk";

  const hasContent =
    summary.length > 0 ||
    Boolean(rec?.matchPercent != null) ||
    Boolean(rec?.provenance?.length) ||
    evidence.length > 0 ||
    Boolean(rec?.scoreBreakdown) ||
    Boolean(rec?.personalizationReasons?.length) ||
    (showFullDiagnostics && userQuery?.trim());

  if (!hasContent) return null;

  return (
    <div className={cn("text-xs", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-9 items-center gap-1.5 font-semibold text-[#6E46C7] hover:text-[#4C2A67]"
      >
        <Info className="size-3.5" aria-hidden />
        Why this result?
        <ChevronDown
          className={cn("size-3.5 transition", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div className="mt-2 space-y-2 rounded-xl border border-violet-100 bg-[#FBF6FC] px-3 py-2.5 text-slate-600">
          {summary.map((line) => (
            <p key={line}>{line}</p>
          ))}

          {rec?.matchPercent != null ? (
            <p>Match score: {rec.matchPercent}%</p>
          ) : rec?.confidence && showFullDiagnostics ? (
            <p>Confidence: {confidenceLabel(rec.confidence)}</p>
          ) : null}

          {rec?.provenance?.length ? (
            <MoonieProvenanceStrip provenance={rec.provenance} compact />
          ) : null}

          {evidence.length > 0 ? (
            <div>
              <p className="font-semibold text-slate-500">Match signals</p>
              <ul className="mt-1 space-y-0.5">
                {evidence.map((item) => (
                  <li key={`${item.kind}-${item.label}`}>{item.label}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {showFullDiagnostics && rec?.scoreBreakdown ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
              {Object.entries(rec.scoreBreakdown).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-2">
                  <dt className="capitalize">{key}</dt>
                  <dd>{Math.round(value * 100)}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {showFullDiagnostics ? (
            <MoonieWhyPersonalised reasons={rec?.personalizationReasons} />
          ) : null}

          {showFullDiagnostics && message ? (
            <div className="relative z-10 pt-1">
              <MoonieCompareChip
                prefs={prefs ?? message.interpretedPreferences}
                userQuery={userQuery}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
