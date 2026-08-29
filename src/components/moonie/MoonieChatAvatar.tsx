"use client";

import { useMemo, useState } from "react";
import { MoonieMascot, type MoonieVariant } from "@/components/brand/MoonieMascot";
import { MoonieCharacter } from "@/components/moonie/MoonieCharacter";
import { moonieEmotionToExpression } from "@/lib/moonie/emotions";
import type { MoonieEmotion } from "@/lib/moonie/emotions";
import {
  MOONIE_CHAT_PHASE_CONFIG,
  resolveMoonieChatHeaderStatus,
  resolveMoonieChatPhase,
} from "@/lib/moonie/chat-phases";
import { cn } from "@/lib/utils";
import type { MoonieChatMessage } from "@/types/moonie";

export function moonieAvatarVariantForMessage(
  message: Pick<MoonieChatMessage, "isError" | "state" | "recommendations">
): MoonieVariant {
  return moonieEmotionToExpression(
    message.isError && message.state !== "rate_limit"
      ? "confused"
      : message.recommendations?.length
        ? "magic"
        : "happy"
  );
}

export function MoonieMessageAvatar({
  variant = "happy",
  emotion,
  size = 30,
  className,
}: {
  variant?: MoonieVariant;
  emotion?: MoonieEmotion;
  size?: number;
  className?: string;
}) {
  const resolvedVariant =
    emotion != null ? moonieEmotionToExpression(emotion) : variant;
  const circleSize = size + 10;

  return (
    <div
      className={cn(
        "pointer-events-none mr-2 mt-0.5 flex shrink-0 items-center justify-center rounded-full bg-[#F4ECF8] ring-1 ring-violet-200/80",
        className
      )}
      style={{ width: circleSize, height: circleSize }}
      aria-hidden
    >
      <MoonieMascot
        variant={resolvedVariant}
        size={size}
        display="fab"
        lightweight
        embedded
      />
    </div>
  );
}

export function MoonieChatAvatar({
  isLoading,
  isListening,
  hasError,
  hasRecommendations,
  size = 40,
}: {
  isLoading: boolean;
  isListening: boolean;
  hasError: boolean;
  hasRecommendations: boolean;
  size?: number;
}) {
  const phase = resolveMoonieChatPhase({
    isLoading,
    isListening,
    hasError,
    hasRecommendations,
  });
  const config = MOONIE_CHAT_PHASE_CONFIG[phase];

  if (size <= 48) {
    return (
      <MoonieMascot
        variant={moonieEmotionToExpression(config.emotion)}
        size={size}
        display="fab"
        lightweight
        embedded
      />
    );
  }

  return (
    <MoonieCharacter
      animationState={config.animationState}
      emotion={config.emotion}
      size={size}
      display="badge"
      compact
      lightweight
      animated={isLoading}
    />
  );
}

export function useMoonieChatHeaderState(
  messages: MoonieChatMessage[],
  isLoading: boolean,
  isListening: boolean
) {
  return useMemo(
    () => resolveMoonieChatHeaderStatus({ messages, isLoading, isListening }),
    [messages, isLoading, isListening]
  );
}

export function useMoonieInputListening() {
  const [isListening, setIsListening] = useState(false);
  return {
    isListening,
    inputFocusProps: {
      onFocus: () => setIsListening(true),
      onBlur: () => setIsListening(false),
    },
  };
}
