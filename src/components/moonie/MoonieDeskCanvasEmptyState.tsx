"use client";

import { MoonieGreeting } from "@/components/moonie/MoonieDesk";
import { MoonieGoldSeal } from "@/components/moonie/MoonieGoldSeal";
import { cn } from "@/lib/utils";

export function MoonieDeskCanvasEmptyState({
  firstName,
  className,
}: {
  firstName?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full max-w-md flex-col items-center px-4 py-6 text-center sm:py-8",
        className
      )}
    >
      <MoonieGoldSeal
        size="sm"
        variant="waving"
        context="chatEmpty"
        priority
        className="mx-auto scale-[0.9]"
      />
      <p className="mt-4">
        <MoonieGreeting firstName={firstName} className="text-2xl sm:text-3xl" />
      </p>
      <p className="mt-2 text-[15px] font-medium tracking-tight text-[#1A1224]/82">
        What would you like to discover today?
      </p>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-[#1A1224]/48">
        Ask about novels, reviews, reviewers, tropes, or recommendations.
      </p>
    </div>
  );
}

/** Faint MoonVerse glow for an empty full-desk chat canvas. */
export function MoonieDeskCanvasEmptyBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-b-[28px]"
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_42%,_rgba(110,70,199,0.09)_0%,_transparent_72%)]"
      />
      <div
        className="absolute left-[12%] top-[18%] size-1 rounded-full bg-[#6E46C7]/[0.14]"
      />
      <div
        className="absolute right-[14%] top-[28%] size-0.5 rounded-full bg-[#C89B4A]/[0.2]"
      />
      <div
        className="absolute bottom-[32%] left-[22%] size-0.5 rounded-full bg-[#9B6FD6]/[0.16]"
      />
      <div
        className="absolute bottom-[24%] right-[20%] size-1 rounded-full bg-[#6E46C7]/[0.1]"
      />
    </div>
  );
}
