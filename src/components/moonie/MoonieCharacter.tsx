"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  MoonieMascot,
  resolveMoonieDisplay,
  type MoonieDisplay,
  type MoonieVariant,
} from "@/components/brand/MoonieMascot";
import { MoonieParticles } from "@/components/moonie/MoonieParticles";
import { useIsInView } from "@/hooks/use-is-in-view";
import {
  moonieAnimationFor,
  moonieEmotionForState,
  moonieParticlesForState,
  type MoonieAnimationContext,
  type MoonieAnimationState,
} from "@/lib/moonie/animation-states";
import { MOONIE_MOTION_PRESETS } from "@/lib/moonie/animation-presets";
import type { MoonieEmotion } from "@/lib/moonie/emotions";
import {
  moonieEmotionToExpression,
  moonieExpressionToEmotion,
} from "@/lib/moonie/emotions";
import { isMoonieLightweightSize } from "@/lib/moonie/performance";
import {
  MOONIE_REACTION_CONFIG,
  MOONIE_REACTION_EVENT,
  type MoonieReactionEventDetail,
} from "@/lib/moonie/reactions";
import { moonieLayoutSize, type MoonieExpression } from "@/lib/moonie/variants";
import { cn } from "@/lib/utils";

export interface MoonieCharacterProps {
  className?: string;
  size?: number;
  priority?: boolean;
  display?: MoonieDisplay;
  compact?: boolean;
  embedded?: boolean;
  animated?: boolean;
  /** Skip particles, glow, and continuous motion */
  lightweight?: boolean;
  emotion?: MoonieEmotion;
  animationState?: MoonieAnimationState;
  context?: MoonieAnimationContext;
  variant?: MoonieVariant;
  listenForReactions?: boolean;
}

function resolveCharacterConfig(props: {
  emotion?: MoonieEmotion;
  animationState?: MoonieAnimationState;
  context?: MoonieAnimationContext;
  variant?: MoonieVariant;
}): {
  animationState: MoonieAnimationState;
  emotion: MoonieEmotion;
  expression: MoonieExpression;
} {
  const animationState =
    props.animationState ??
    (props.context ? moonieAnimationFor(props.context) : "idle");

  const emotion =
    props.emotion ??
    (props.variant && props.variant !== "default"
      ? moonieExpressionToEmotion(props.variant)
      : moonieEmotionForState(animationState));

  const expression: MoonieExpression =
    props.variant && props.variant !== "default"
      ? props.variant
      : moonieEmotionToExpression(emotion);

  return { animationState, emotion, expression };
}

export function MoonieCharacter({
  className,
  size = 120,
  priority = false,
  display,
  compact = false,
  embedded = false,
  animated = true,
  lightweight: lightweightProp,
  emotion: emotionProp,
  animationState: animationStateProp,
  context,
  variant,
  listenForReactions = false,
}: MoonieCharacterProps) {
  const reduceMotion = useReducedMotion();
  const { ref, inView } = useIsInView();
  const [motionExpired, setMotionExpired] = useState(false);
  const [reactionBurst, setReactionBurst] = useState<{
    animationState: MoonieAnimationState;
    emotion: MoonieEmotion;
  } | null>(null);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setTimeout(() => setMotionExpired(true), 4000);
    return () => window.clearTimeout(timer);
  }, [reduceMotion, animationStateProp]);

  const lightweight =
    lightweightProp ??
    (reduceMotion === true ||
      embedded ||
      compact ||
      isMoonieLightweightSize(size));

  const baseConfig = useMemo(
    () =>
      resolveCharacterConfig({
        emotion: emotionProp,
        animationState: animationStateProp,
        context,
        variant,
      }),
    [emotionProp, animationStateProp, context, variant]
  );

  const animationState = reactionBurst?.animationState ?? baseConfig.animationState;
  const emotion = reactionBurst?.emotion ?? baseConfig.emotion;
  const expression = reactionBurst
    ? moonieEmotionToExpression(reactionBurst.emotion)
    : baseConfig.expression;

  useEffect(() => {
    if (!listenForReactions) return;

    const handleReaction = (event: Event) => {
      const { reaction } = (event as CustomEvent<MoonieReactionEventDetail>).detail;
      const config = MOONIE_REACTION_CONFIG[reaction];
      setReactionBurst({
        animationState: config.animationState,
        emotion: config.emotion,
      });
      window.setTimeout(() => setReactionBurst(null), config.durationMs);
    };

    window.addEventListener(MOONIE_REACTION_EVENT, handleReaction);
    return () => window.removeEventListener(MOONIE_REACTION_EVENT, handleReaction);
  }, [listenForReactions]);

  const resolvedDisplay = resolveMoonieDisplay(size, display);
  const isHero = resolvedDisplay === "hero";
  const showHeroEffects = !lightweight && isHero && inView && !embedded;
  const showParticles =
    !lightweight && inView && isHero && !embedded && moonieParticlesForState(animationState) !== "none";
  const pad = showHeroEffects ? Math.round(size * 0.18) : 0;

  const layout = moonieLayoutSize(expression, size);
  const motionPreset = MOONIE_MOTION_PRESETS[animationState];
  const shouldAnimate =
    animated &&
    !lightweight &&
    (inView || reactionBurst !== null) &&
    !reduceMotion &&
    !motionExpired;

  return (
    <div
      ref={ref}
      className={cn("relative inline-flex shrink-0 items-end justify-center", className)}
      style={{
        width: layout.width + pad * 2,
        minHeight: layout.height + (showHeroEffects ? Math.round(pad * 0.5) : 0),
        overflow: "visible",
      }}
      data-moonie-emotion={emotion}
      data-moonie-state={animationState}
      aria-hidden
    >
      {showHeroEffects && (
        <div
          className="pointer-events-none absolute left-1/2 bottom-[8%] -translate-x-1/2 rounded-full moonie-hero-glow"
          style={{
            width: layout.width * 1.2,
            height: layout.height * 0.75,
          }}
        />
      )}

      {showParticles && (
        <MoonieParticles preset={moonieParticlesForState(animationState)} maxCount={3} />
      )}

      <motion.div
        className="relative z-10 origin-bottom"
        animate={shouldAnimate ? motionPreset.animate : undefined}
        transition={shouldAnimate ? motionPreset.transition : undefined}
      >
        <MoonieMascot
          variant={expression}
          size={size}
          priority={priority}
          animated={false}
          display={resolvedDisplay}
          embedded={embedded}
          lightweight={lightweight}
          showGlow={showHeroEffects}
        />
      </motion.div>
    </div>
  );
}
