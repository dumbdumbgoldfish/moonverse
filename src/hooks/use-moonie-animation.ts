"use client";

import { useCallback, useEffect, useState } from "react";
import type { MoonieAnimationState } from "@/lib/moonie/animation-states";
import type { MoonieEmotion } from "@/lib/moonie/emotions";
import {
  MOONIE_REACTION_CONFIG,
  MOONIE_REACTION_EVENT,
  type MoonieReactionEventDetail,
  type MoonieReactionType,
} from "@/lib/moonie/reactions";

interface MoonieAnimationSnapshot {
  animationState: MoonieAnimationState;
  emotion: MoonieEmotion;
}

interface UseMoonieAnimationOptions {
  initialState: MoonieAnimationState;
  initialEmotion?: MoonieEmotion;
  listenForReactions?: boolean;
}

export function useMoonieAnimation({
  initialState,
  initialEmotion,
  listenForReactions = false,
}: UseMoonieAnimationOptions) {
  const [snapshot, setSnapshot] = useState<MoonieAnimationSnapshot>({
    animationState: initialState,
    emotion: initialEmotion ?? "happy",
  });
  const [reactionBurst, setReactionBurst] = useState<MoonieAnimationSnapshot | null>(
    null
  );

  const setAnimationState = useCallback(
    (animationState: MoonieAnimationState, emotion?: MoonieEmotion) => {
      setSnapshot((current) => ({
        animationState,
        emotion: emotion ?? current.emotion,
      }));
    },
    []
  );

  const setEmotion = useCallback((emotion: MoonieEmotion) => {
    setSnapshot((current) => ({ ...current, emotion }));
  }, []);

  const playReaction = useCallback((reaction: MoonieReactionType) => {
    const config = MOONIE_REACTION_CONFIG[reaction];
    const burst = {
      animationState: config.animationState,
      emotion: config.emotion,
    };
    setReactionBurst(burst);
    window.setTimeout(() => setReactionBurst(null), config.durationMs);
  }, []);

  useEffect(() => {
    if (!listenForReactions) return;

    const handleReaction = (event: Event) => {
      const { reaction } = (event as CustomEvent<MoonieReactionEventDetail>).detail;
      playReaction(reaction);
    };

    window.addEventListener(MOONIE_REACTION_EVENT, handleReaction);
    return () => window.removeEventListener(MOONIE_REACTION_EVENT, handleReaction);
  }, [listenForReactions, playReaction]);

  const active = reactionBurst ?? snapshot;

  return {
    animationState: active.animationState,
    emotion: active.emotion,
    setAnimationState,
    setEmotion,
    playReaction,
    isReacting: reactionBurst !== null,
  };
}
