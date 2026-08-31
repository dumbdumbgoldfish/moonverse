"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { confidenceLabel } from "@/lib/moonie/provenance";
import type { MoonieCardDensity } from "@/lib/moonie/presentation";
import { cn } from "@/lib/utils";
import type { MoonieLookupCandidate } from "@/types/moonie";

interface MoonieLookupCandidatesProps {
  candidates: MoonieLookupCandidate[];
  isLoggedIn?: boolean;
  onSelect?: (prompt: string, novelId?: string) => void;
  className?: string;
  density?: MoonieCardDensity;
}

function confidenceTone(confidence: MoonieLookupCandidate["confidence"]): string {
  if (confidence === "high") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }
  if (confidence === "medium") {
    return "bg-amber-50 text-amber-900 ring-amber-200";
  }
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export function MoonieLookupCandidates({
  candidates,
  isLoggedIn = false,
  onSelect,
  className,
  density = "desk",
}: MoonieLookupCandidatesProps) {
  if (candidates.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {candidates.map((candidate) => (
        <LookupCandidateCard
          key={candidate.novelId}
          candidate={candidate}
          isLoggedIn={isLoggedIn}
          onSelect={onSelect}
          density={density}
        />
      ))}
    </div>
  );
}

function LookupCandidateCard({
  candidate,
  isLoggedIn,
  onSelect,
  density,
}: {
  candidate: MoonieLookupCandidate;
  isLoggedIn: boolean;
  onSelect?: (prompt: string, novelId?: string) => void;
  density: MoonieCardDensity;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isWidget = density === "widget";

  return (
    <article className="rounded-2xl border border-violet-100 bg-[#FFFBFF] p-3 ring-1 ring-violet-50">
      <div className="flex gap-3">
        <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-xl bg-violet-50 ring-1 ring-violet-100">
          <CoverImage
            src={candidate.coverUrl}
            alt=""
            title={candidate.title}
            author={candidate.author}
            genres={candidate.genres}
            themeSeed={candidate.novelId}
            sizes="56px"
            compactFallback
            className="object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
              confidenceTone(candidate.confidence)
            )}
          >
            {confidenceLabel(candidate.confidence)}
          </span>
          <h4 className="mt-1 font-[family-name:var(--font-source-serif)] text-base font-semibold text-[#1A1224]">
            {candidate.title}
          </h4>
          {candidate.author ? (
            <p className="text-sm text-slate-600">{candidate.author}</p>
          ) : null}
          {candidate.matchedAlias ? (
            <p className="mt-1 text-xs text-slate-500">
              Also known as {candidate.matchedAlias}
            </p>
          ) : null}

          {!isWidget && candidate.evidence.length > 0 ? (
            <div className="mt-2">
              <button
                type="button"
                aria-expanded={detailsOpen}
                onClick={() => setDetailsOpen((value) => !value)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#6E46C7]"
              >
                Match details
                <ChevronDown
                  className={cn("size-3.5", detailsOpen && "rotate-180")}
                  aria-hidden
                />
              </button>
              {detailsOpen ? (
                <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                  {candidate.evidence.slice(0, 4).map((item) => (
                    <li key={`${candidate.novelId}-${item.kind}-${item.label}`}>
                      {item.label}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {onSelect ? (
          <>
            <button
              type="button"
              disabled={!isLoggedIn}
              onClick={() =>
                onSelect(`This one — ${candidate.title}`, candidate.novelId)
              }
              className="rounded-full bg-[#4C2A67] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3d2153] disabled:opacity-50"
            >
              This one
            </button>
            <button
              type="button"
              disabled={!isLoggedIn}
              onClick={() => onSelect(`Not this — ${candidate.title}`)}
              className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-50 disabled:opacity-50"
            >
              Not this
            </button>
          </>
        ) : null}
        {!isWidget ? (
          <Link
            href={`/novels/${candidate.novelId}`}
            className="rounded-full border border-violet-100 px-3 py-1.5 text-xs font-semibold text-[#6E46C7] hover:bg-violet-50"
          >
            Open catalogue
          </Link>
        ) : null}
      </div>
    </article>
  );
}
