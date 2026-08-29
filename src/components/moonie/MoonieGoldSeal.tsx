"use client";

import { MoonieCharacter } from "@/components/moonie/MoonieCharacter";
import type { MoonieVariant } from "@/components/brand/MoonieMascot";
import type { MoonieAnimationContext } from "@/lib/moonie/animation-states";
import type { MoonieEmotion } from "@/lib/moonie/emotions";
import { cn } from "@/lib/utils";

const SEAL_SIZE = {
  xs: { disc: 52, moonie: 68 },
  sm: { disc: 80, moonie: 100 },
  md: { disc: 112, moonie: 140 },
  lg: { disc: 140, moonie: 172 },
} as const;

export function MoonieGoldSeal({
  size = "md",
  variant,
  emotion,
  context,
  priority = false,
  className,
}: {
  size?: keyof typeof SEAL_SIZE;
  variant?: MoonieVariant;
  emotion?: MoonieEmotion;
  context?: MoonieAnimationContext;
  priority?: boolean;
  className?: string;
}) {
  const { disc, moonie } = SEAL_SIZE[size];

  return (
    <div
      className={cn("relative shrink-0 overflow-visible", className)}
      style={{ width: disc, height: moonie }}
    >
      <div
        aria-hidden
        className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[var(--mv-dark-surface)] shadow-[0_16px_32px_-16px_rgba(26,18,36,0.75)] ring-2 ring-[var(--mv-gold)]"
        style={{ width: disc, height: disc }}
      />
      <div className="absolute inset-x-0 bottom-0 flex justify-center overflow-visible">
        <MoonieCharacter
          size={moonie}
          variant={variant}
          emotion={emotion}
          context={context}
          priority={priority}
          lightweight
        />
      </div>
    </div>
  );
}
