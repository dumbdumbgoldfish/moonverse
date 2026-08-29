import type { MoonieAnimationState } from "@/lib/moonie/animation-states";
import type { MoonieEmotion } from "@/lib/moonie/emotions";

export const MOONIE_REACTIONS = [
  "likeReview",
  "finishNovel",
  "createReadingList",
  "perfectMatch",
  "searchEmpty",
] as const;

export type MoonieReactionType = (typeof MOONIE_REACTIONS)[number];

export interface MoonieReactionConfig {
  animationState: MoonieAnimationState;
  emotion: MoonieEmotion;
  durationMs: number;
  label: string;
}

export const MOONIE_REACTION_CONFIG: Record<
  MoonieReactionType,
  MoonieReactionConfig
> = {
  likeReview: {
    animationState: "celebration",
    emotion: "cheering",
    durationMs: 2200,
    label: "Small celebration",
  },
  finishNovel: {
    animationState: "celebration",
    emotion: "cheering",
    durationMs: 2800,
    label: "Cheering animation",
  },
  createReadingList: {
    animationState: "recommendation",
    emotion: "happy",
    durationMs: 2400,
    label: "Happy recommendation",
  },
  perfectMatch: {
    animationState: "recommendation",
    emotion: "love",
    durationMs: 3000,
    label: "Love eyes + sparkles",
  },
  searchEmpty: {
    animationState: "thinking",
    emotion: "thinking",
    durationMs: 2000,
    label: "Thinking animation",
  },
};

export const MOONIE_REACTION_EVENT = "moonie:reaction" as const;

export interface MoonieReactionEventDetail {
  reaction: MoonieReactionType;
}

export function triggerMoonieReaction(reaction: MoonieReactionType): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<MoonieReactionEventDetail>(MOONIE_REACTION_EVENT, {
      detail: { reaction },
    })
  );
}
