import type { MoonieAnimationState } from "@/lib/moonie/animation-states";
import type { MoonieEmotion } from "@/lib/moonie/emotions";
import { MOONIE_RATE_LIMIT_TITLE } from "@/lib/moonie/quota-copy";
import type { MoonieLoadingPhase } from "@/types/moonie";
import type { MoonieChatMessage } from "@/types/moonie";

export type MoonieChatPhase =
  | "idle"
  | "listening"
  | "thinking"
  | "results"
  | "error";

export const MOONIE_LOADING_LABELS: Record<MoonieLoadingPhase, string> = {
  thinking: "Moonie is thinking",
  searching: "Moonie is finding matches",
  verifying: "Moonie is checking sources",
  reading_image: "Moonie is reading the image",
  matching_titles: "Moonie is matching titles",
  transcribing: "Moonie is transcribing",
  looking_up: "Moonie is looking it up",
  comparing: "Moonie is comparing novels",
  parsing_file: "Moonie is reading the file",
};

/** Subtle status line under the typing dots. Empty for lightweight chat turns. */
export function moonieProcessingHint(
  phase: MoonieLoadingPhase
): string | null {
  switch (phase) {
    case "searching":
      return "Finding matches…";
    case "looking_up":
      return "Looking it up…";
    case "verifying":
      return "Checking sources…";
    case "reading_image":
      return "Reading the image…";
    case "matching_titles":
      return "Matching titles…";
    case "comparing":
      return "Comparing novels…";
    case "parsing_file":
      return "Reading file…";
    case "transcribing":
      return "Transcribing…";
    default:
      return "Thinking…";
  }
}

export function moonieThinkingAriaLabel(phase: MoonieLoadingPhase): string {
  return MOONIE_LOADING_LABELS[phase];
}

export function loadingPhaseForMessage(
  message: string,
  options?: { attachmentType?: "image" | "file" | null }
): MoonieLoadingPhase {
  if (options?.attachmentType === "image") {
    return "reading_image";
  }
  if (options?.attachmentType === "file") {
    return "parsing_file";
  }

  const lower = message.trim().toLowerCase();

  if (/\b(compare|versus|vs\.?|which (one|is) better)\b/i.test(lower)) {
    return "comparing";
  }
  if (
    /\b(where can i read|where to read|reading link|read(?:ing)?\s+link|(?:give|get|send)\s+me\s+link|link\s+for|official (?:source|link)|verified source|reading source)\b/i.test(
      lower
    )
  ) {
    return "looking_up";
  }
  if (/\b(find|look up|lookup|search|recommend|mood|genre|more like)\b/i.test(lower)) {
    return "searching";
  }
  return "thinking";
}

export const MOONIE_CHAT_PHASE_CONFIG: Record<
  MoonieChatPhase,
  {
    emotion: MoonieEmotion;
    animationState: MoonieAnimationState;
    statusLabel: string;
  }
> = {
  idle: {
    emotion: "happy",
    animationState: "idle",
    statusLabel: "Ready when you are",
  },
  listening: {
    emotion: "excited",
    animationState: "typing",
    statusLabel: "Listening…",
  },
  thinking: {
    emotion: "thinking",
    animationState: "thinking",
    statusLabel: "Moonie is thinking…",
  },
  results: {
    emotion: "magic",
    animationState: "celebration",
    statusLabel: "Picks from the catalogue",
  },
  error: {
    emotion: "confused",
    animationState: "idle",
    statusLabel: "Something went wrong",
  },
};

export function resolveMoonieChatPhase(options: {
  isLoading: boolean;
  isListening: boolean;
  hasError: boolean;
  hasRecommendations: boolean;
}): MoonieChatPhase {
  if (options.hasError) return "error";
  if (options.isLoading) return "thinking";
  if (options.isListening) return "listening";
  if (options.hasRecommendations) return "results";
  return "idle";
}

export function resolveMoonieChatHeaderStatus(options: {
  messages: MoonieChatMessage[];
  isLoading: boolean;
  isListening: boolean;
}): {
  hasError: boolean;
  isRateLimited: boolean;
  hasRecommendations: boolean;
  status: string;
} {
  const lastAssistant = [...options.messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const isRateLimited = lastAssistant?.state === "rate_limit";
  const hasError = Boolean(lastAssistant?.isError) && !isRateLimited;
  const hasRecommendations = Boolean(
    lastAssistant?.recommendations && lastAssistant.recommendations.length > 0
  );

  const phase = resolveMoonieChatPhase({
    isLoading: options.isLoading,
    isListening: options.isListening,
    hasError,
    hasRecommendations,
  });

  return {
    hasError,
    isRateLimited,
    hasRecommendations,
    status: isRateLimited
      ? MOONIE_RATE_LIMIT_TITLE
      : MOONIE_CHAT_PHASE_CONFIG[phase].statusLabel,
  };
}
