"use client";

import { cn } from "@/lib/utils";
import {
  MOONIE_CHAT_BUBBLE_TEXT,
  MOONIE_USER_BUBBLE_SHELL,
} from "@/components/moonie/moonie-chat-bubble-styles";
import type { MoonieChatMessage } from "@/types/moonie";

interface MoonieUserMessageBubbleProps {
  message: MoonieChatMessage;
  compact?: boolean;
}

export function MoonieUserMessageBubble({
  message,
  compact,
}: MoonieUserMessageBubbleProps) {
  return (
    <div
      className={cn(
        MOONIE_USER_BUBBLE_SHELL,
        "rounded-[1.125rem] text-[0.9375rem] leading-snug",
        "bg-[#4C2A67] text-white [user-select:text] [-webkit-user-select:text]",
        compact ? "px-4 py-2.5" : "px-4 py-2.5 shadow-sm"
      )}
    >
      {message.content ? (
        <span className={MOONIE_CHAT_BUBBLE_TEXT}>{message.content}</span>
      ) : null}
    </div>
  );
}
