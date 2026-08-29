"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const RATING_LABELS: Record<number, string> = {
  1: "Not for me",
  2: "Disappointing",
  3: "Mixed",
  4: "Recommended",
  5: "Loved it",
};

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  error?: string | null;
}

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
  error = null,
}: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  const errorId = "rating-error";

  return (
    <div className="space-y-3">
      <Label id="rating-label" className="sr-only">
        Your rating (required)
      </Label>
      <div
        className={cn(
          "rounded-2xl border border-[var(--mv-border)] bg-gradient-to-br from-[var(--mv-surface-soft)] via-white to-[var(--mv-paper)] p-4 sm:p-5",
          error && "border-destructive/30"
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--mv-plum)]">
              Your verdict
            </p>
            <p className="mt-1 font-serif text-xl font-semibold text-[var(--mv-ink)]">
              {display > 0 ? RATING_LABELS[display] : "How did it land?"}
            </p>
          </div>
          {display > 0 ? (
            <span className="inline-flex items-baseline gap-0.5 rounded-xl bg-white px-3 py-1.5 font-serif text-2xl font-black text-[var(--mv-ink)] ring-1 ring-[var(--mv-border)]">
              {display}
              <span className="text-sm font-semibold text-[var(--mv-text-muted)]">
                /5
              </span>
            </span>
          ) : null}
        </div>

        <div
          role="radiogroup"
          aria-labelledby="rating-label"
          aria-describedby={error ? errorId : undefined}
          className="mt-4 flex flex-wrap items-center gap-0.5 sm:gap-1"
          onMouseLeave={() => setHovered(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const active = display >= star;
            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={value === star}
                aria-label={`${star} star${star === 1 ? "" : "s"}: ${RATING_LABELS[star]}`}
                disabled={disabled}
                onMouseEnter={() => setHovered(star)}
                onFocus={() => setHovered(star)}
                onBlur={() => setHovered(0)}
                onClick={() => onChange(star)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                    event.preventDefault();
                    onChange(Math.min(5, (value || 0) + 1));
                  }
                  if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                    event.preventDefault();
                    onChange(Math.max(1, (value || 1) - 1));
                  }
                }}
                className={cn(
                  "inline-flex size-11 items-center justify-center rounded-xl transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]",
                  active
                    ? "scale-105 text-[var(--mv-gold)]"
                    : "text-[var(--mv-border)] hover:scale-105 hover:text-[var(--mv-gold)]/70"
                )}
              >
                <Star
                  className={cn("size-8", active && "fill-current drop-shadow-sm")}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </div>
      {error ? (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-xs text-[var(--mv-text-muted)]">
          Tap or use arrow keys to set your rating.
        </p>
      )}
    </div>
  );
}
