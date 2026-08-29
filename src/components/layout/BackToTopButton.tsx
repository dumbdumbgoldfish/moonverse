"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { MV_FLOAT_BTN } from "@/lib/mv-buttons";
import { cn } from "@/lib/utils";

interface BackToTopButtonProps {
  className?: string;
}

export function BackToTopButton({ className }: BackToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const prefersReduced =
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({
          top: 0,
          behavior: prefersReduced ? "auto" : "smooth",
        });
      }}
      className={cn(
        MV_FLOAT_BTN,
        "fixed right-6 z-40 size-11 transition-all motion-reduce:transition-none",
        "bottom-24 md:bottom-6",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0",
        className
      )}
      aria-label="Back to top"
    >
      <ArrowUp className="size-5" aria-hidden />
    </button>
  );
}
