"use client";

import { useEffect, useState } from "react";
import { CoverCarousel } from "@/components/discovery/CoverCarousel";
import { InteractiveCoverCard } from "@/components/discovery/InteractiveCoverCard";
import { getShelfTheme } from "@/lib/shelf-themes";
import { limitCarouselItems } from "@/lib/moonie/performance";
import type { DiscoveryShelfData } from "@/types/shelves";

const HIDDEN_NOVELS_KEY = "mv-discover-hidden-novels";

function readHiddenNovelIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(HIDDEN_NOVELS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function writeHiddenNovelIds(ids: Set<string>) {
  try {
    sessionStorage.setItem(HIDDEN_NOVELS_KEY, JSON.stringify([...ids]));
  } catch {
    // Ignore quota / private mode failures.
  }
}

interface DiscoveryShelfProps {
  shelf: DiscoveryShelfData;
  showRank?: boolean;
  size?: "md" | "lg" | "xl";
}

export function DiscoveryShelf({
  shelf,
  size = "lg",
}: DiscoveryShelfProps) {
  const reviews = limitCarouselItems(shelf.reviews);
  const theme = getShelfTheme(shelf.id);
  const [hiddenNovelIds, setHiddenNovelIds] = useState<Set<string>>(
    () => new Set()
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setHiddenNovelIds(readHiddenNovelIds());
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const visible = reviews.filter(
    (review) => !hiddenNovelIds.has(review.novelId)
  );

  if (visible.length === 0) return null;

  return (
    <CoverCarousel
      title={shelf.title}
      subtitle={shelf.subtitle}
      icon={theme.icon}
      accentClass={theme.accent}
    >
      {visible.map((review) => (
        <InteractiveCoverCard
          key={`${shelf.id}-${review.novelId}-${review.id}`}
          href={`/novels/${review.novelId}`}
          coverUrl={review.coverUrl}
          novelTitle={review.novelTitle}
          reviewId={review.id}
          viewCount={review.likeCount}
          tags={review.genres}
          size={size}
          onHide={() => {
            setHiddenNovelIds((current) => {
              const next = new Set(current);
              next.add(review.novelId);
              writeHiddenNovelIds(next);
              return next;
            });
          }}
        />
      ))}
    </CoverCarousel>
  );
}
