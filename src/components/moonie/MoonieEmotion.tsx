"use client";

import { MoonieCharacter, type MoonieCharacterProps } from "@/components/moonie/MoonieCharacter";
import type { MoonieEmotion } from "@/lib/moonie/emotions";
import { MOONIE_EMOTION_META } from "@/lib/moonie/emotions";

export interface MoonieEmotionProps extends Omit<MoonieCharacterProps, "emotion" | "variant"> {
  emotion: MoonieEmotion;
}

/** Emotion-first Moonie. personality layer over static PNG art. */
export function MoonieEmotion({ emotion, ...props }: MoonieEmotionProps) {
  return <MoonieCharacter emotion={emotion} {...props} />;
}

export function moonieEmotionLabel(emotion: MoonieEmotion): string {
  return MOONIE_EMOTION_META[emotion].label;
}

export function moonieEmotionPersonality(emotion: MoonieEmotion): string {
  return MOONIE_EMOTION_META[emotion].personality;
}
