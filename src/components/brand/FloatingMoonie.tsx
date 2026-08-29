"use client";

import { MoonieCharacter, type MoonieCharacterProps } from "@/components/moonie/MoonieCharacter";
import type { MoonieVariant } from "@/components/brand/MoonieMascot";
import { moonieExpressionToEmotion } from "@/lib/moonie/emotions";
import type { MoonieAnimationContext } from "@/lib/moonie/animation-states";

interface FloatingMoonieProps extends Omit<MoonieCharacterProps, "variant" | "context"> {
  variant?: MoonieVariant;
  /** Legacy context from variants.ts. maps to animation placement */
  context?: MoonieAnimationContext;
}

/**
 * @deprecated Prefer MoonieCharacter with `context` or `animationState`.
 * Kept for backward compatibility across the app.
 */
export function FloatingMoonie({
  variant = "happy",
  context,
  emotion,
  animationState,
  ...props
}: FloatingMoonieProps) {
  const resolvedEmotion =
    emotion ??
    (variant !== "default" ? moonieExpressionToEmotion(variant) : undefined);

  return (
    <MoonieCharacter
      variant={variant !== "default" ? variant : undefined}
      emotion={resolvedEmotion}
      animationState={animationState}
      context={context}
      {...props}
    />
  );
}
