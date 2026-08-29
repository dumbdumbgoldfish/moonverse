"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ReviewReadingProgressProps {
  targetId?: string;
  className?: string;
}

/** Fixed top progress bar while reading a long review article. */
export function ReviewReadingProgress({
  targetId = "review-article",
  className,
}: ReviewReadingProgressProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const article = document.getElementById(targetId);
    if (!article) return;

    const update = () => {
      const rect = article.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const articleTop = scrollTop + rect.top;
      const articleHeight = article.offsetHeight;
      const viewport = window.innerHeight;
      const max = Math.max(articleHeight - viewport * 0.35, 1);
      const current = scrollTop - articleTop + viewport * 0.15;
      setProgress(Math.min(100, Math.max(0, (current / max) * 100)));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [targetId]);

  if (progress <= 0.5) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 bg-[#1a1033]/5",
        className,
      )}
      aria-hidden
    >
      <div
        className="h-full bg-gradient-to-r from-[#C89B4A] via-[#F6C85F] to-[#6b4bb5] transition-[width] duration-150 motion-reduce:transition-none"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
