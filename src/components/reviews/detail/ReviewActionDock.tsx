"use client";

import { cn } from "@/lib/utils";

interface ReviewActionDockProps {
  children: React.ReactNode;
  className?: string;
}

/** Keeps engagement actions visible while scrolling on small screens. */
export function ReviewActionDock({ children, className }: ReviewActionDockProps) {
  return (
    <div
      className={cn(
        "sticky bottom-3 z-20 px-5 pb-1 sm:px-7 lg:static lg:bottom-auto lg:px-8",
        className,
      )}
    >
      <div className="rounded-full bg-white/95 p-0.5 shadow-[0_12px_32px_-18px_rgba(26,16,51,0.35)] backdrop-blur-md lg:bg-transparent lg:shadow-none lg:backdrop-blur-none">
        {children}
      </div>
    </div>
  );
}
