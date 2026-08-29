"use client";

import { useEffect, useRef, useState } from "react";
import { RatingBreakdown } from "@/components/reviews/detail/RatingBreakdown";
import type { NovelReviewStats } from "@/services/review.service";

interface AnimatedRatingBreakdownProps {
  stats: NovelReviewStats;
  className?: string;
}

export function AnimatedRatingBreakdown({
  stats,
  className,
}: AnimatedRatingBreakdownProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      data-animate={visible ? "true" : "false"}
    >
      <RatingBreakdown
        stats={stats}
        variant="plain"
        animated={visible}
        hideHeading
      />
    </div>
  );
}
