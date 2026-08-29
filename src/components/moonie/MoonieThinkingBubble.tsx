"use client";

import { MoonieMessageAvatar } from "@/components/moonie/MoonieChatAvatar";
import {
  moonieProcessingHint,
  moonieThinkingAriaLabel,
} from "@/lib/moonie/chat-phases";
import {
  MOONIE_ASSISTANT_BUBBLE_SHELL,
} from "@/components/moonie/moonie-chat-bubble-styles";
import { cn } from "@/lib/utils";
import type { MoonieLoadingPhase } from "@/types/moonie";

export const MOONIE_THINKING_MESSAGE_ID = "__moonie-thinking__";

export function MoonieThinkingDots({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 px-0.5 py-1", className)}
      aria-hidden
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="size-1.5 rounded-full bg-slate-400 motion-safe:animate-moonie-thinking-dot"
          style={{ animationDelay: `${index * 0.24}s` }}
        />
      ))}
    </span>
  );
}

interface MoonieThinkingBubbleProps {
  phase?: MoonieLoadingPhase;
  className?: string;
}

export function MoonieThinkingBubble({
  phase = "thinking",
  className,
}: MoonieThinkingBubbleProps) {
  const hint = moonieProcessingHint(phase);

  return (
    <div className={cn("flex items-end gap-2 justify-start", className)}>
      <MoonieMessageAvatar emotion="thinking" />
      <div
        role="status"
        aria-live="polite"
        aria-label={moonieThinkingAriaLabel(phase)}
        className={cn(
          MOONIE_ASSISTANT_BUBBLE_SHELL,
          "rounded-[1.125rem] bg-[#FBF6FC] px-3.5 py-2 ring-1 ring-violet-100"
        )}
      >
        <MoonieThinkingDots />
        {hint ? (
          <p className="mt-0.5 text-[11px] font-medium leading-snug text-slate-500">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
