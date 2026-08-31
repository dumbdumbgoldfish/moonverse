"use client";

import { RefreshCw } from "lucide-react";

interface ForYouShelvesUnavailableProps {
  onRetry: () => void;
  retrying?: boolean;
}

/**
 * Compact shelf-region fallback when For You shelves fail to load.
 * Height matches one salon shelf row so the masthead layout stays stable.
 */
export function ForYouShelvesUnavailable({
  onRetry,
  retrying = false,
}: ForYouShelvesUnavailableProps) {
  return (
    <div className="space-y-10">
      <section
        aria-live="polite"
        className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-[#1A1224]/8 bg-white/70 px-5 py-8 text-center ring-1 ring-[#1A1224]/6"
      >
        <p className="text-sm font-semibold text-[#1A1224]">
          For You shelves are temporarily unavailable
        </p>
        <p className="mt-1 max-w-sm text-sm text-[#1A1224]/55">
          The rest of Home is still usable. Retry to load your personalised
          review shelves.
        </p>
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-[#6E46C7]/25 bg-white px-4 text-sm font-semibold text-[#6E46C7] transition hover:border-[#6E46C7]/40 hover:bg-[#6E46C7]/5 disabled:opacity-60"
        >
          <RefreshCw
            className={`size-4 ${retrying ? "animate-spin" : ""}`}
            aria-hidden
          />
          {retrying ? "Retrying…" : "Try again"}
        </button>
      </section>
    </div>
  );
}
