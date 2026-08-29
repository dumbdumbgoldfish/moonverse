"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { MoonieCharacter } from "@/components/moonie/MoonieCharacter";
import { MOONIE_MOOD_OPTIONS } from "@/lib/moonie/constants";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";
import { CoverImage } from "@/components/ui/CoverImage";

interface MoonieMoodPickerProps {
  recommended: ReviewListItem[];
  trending: ReviewListItem[];
}

function matchesMood(review: ReviewListItem, mood: string): boolean {
  const needle = mood.toLowerCase();
  return review.genres.some((g) => g.toLowerCase().includes(needle));
}

export function MoonieMoodPicker({ recommended, trending }: MoonieMoodPickerProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const pool = useMemo(
    () => [...recommended, ...trending],
    [recommended, trending]
  );

  const moodResults = useMemo(() => {
    if (!selectedMood) return [];
    const seen = new Set<string>();
    return pool
      .filter((r) => matchesMood(r, selectedMood))
      .filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      })
      .slice(0, 4);
  }, [pool, selectedMood]);

  const handleSelect = (label: string) => {
    setSelectedMood(label);
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="shrink-0">
          <MoonieCharacter context="moodPicker" size={80} compact lightweight animated={false} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Moonie
          </p>
          <h2 className="mt-0.5 text-lg font-bold leading-snug">
            What are you in the mood for today?
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Moonie helps you discover your next favorite novel.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 pl-1" role="group" aria-label="Reading moods">
        {MOONIE_MOOD_OPTIONS.map(({ label }) => (
          <button
            key={label}
            type="button"
            onClick={() => handleSelect(label)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              selectedMood === label
                ? "mv-nav-signup border-0 text-white shadow-sm"
                : "bg-white text-foreground ring-1 ring-border/80 hover:bg-moon-purple-soft dark:bg-card"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {selectedMood && (
        <div className="mt-4 pl-1">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">
            Moonie&apos;s picks for {selectedMood.toLowerCase()}
          </p>
          {moodResults.length === 0 ? (
            <p className="rounded-2xl bg-white/80 px-3 py-4 text-sm text-muted-foreground dark:bg-card/80">
              Tell me more in chat. Moonie is finding stories for you.
            </p>
          ) : (
            <div className="space-y-2">
              {moodResults.map((review) => (
                <Link
                  key={review.id}
                  href={`/reviews/${review.id}`}
                  className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm transition-colors active:bg-muted/40 dark:bg-card"
                >
                  <div className="relative h-[72px] w-[48px] shrink-0 overflow-hidden rounded-md bg-muted">
                    <CoverImage
                      src={review.coverUrl}
                      alt=""
                      title={review.novelTitle}
                      sizes="48px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-bold">{review.novelTitle}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {review.excerpt}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Star className="size-3 fill-[var(--mv-gold)] text-[var(--mv-gold)]" />
                      {review.rating} · {review.likeCount} likes
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
