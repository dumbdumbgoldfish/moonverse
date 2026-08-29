"use client";

import type { MoonieFieldProvenance, MoonieProvenanceSource } from "@/types/moonie";
import { provenanceLabel } from "@/lib/moonie/provenance";
import { cn } from "@/lib/utils";

const SOURCE_TONE: Record<MoonieProvenanceSource, string> = {
  moonverse_catalogue: "bg-[#F4ECF8] text-[#4C35C4] ring-[#6E46C7]/15",
  moonverse_reviews: "bg-violet-50 text-violet-800 ring-violet-100",
  verified_reading_link: "bg-emerald-50 text-emerald-800 ring-emerald-100",
  official_publisher: "bg-amber-50 text-amber-900 ring-amber-100",
  approved_external: "bg-sky-50 text-sky-800 ring-sky-100",
  moonie_reasoning: "bg-slate-50 text-slate-700 ring-slate-200",
};

interface MoonieProvenanceStripProps {
  provenance?: MoonieFieldProvenance[];
  compact?: boolean;
  className?: string;
}

export function MoonieProvenanceStrip({
  provenance,
  compact,
  className,
}: MoonieProvenanceStripProps) {
  if (!provenance?.length) return null;

  const uniqueSources = [...new Set(provenance.map((item) => item.source))];

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5",
        compact ? "text-[10px]" : "text-xs",
        className
      )}
    >
      {uniqueSources.map((source) => (
        <span
          key={source}
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 font-semibold ring-1",
            SOURCE_TONE[source]
          )}
        >
          {provenanceLabel(source)}
        </span>
      ))}
    </div>
  );
}
