"use client";

import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MOONIE_ASSISTANT_BUBBLE_SHELL,
  MOONIE_CHAT_BUBBLE_TEXT,
} from "@/components/moonie/moonie-chat-bubble-styles";

interface MoonieAssistantBubbleProps {
  text: string;
  compact?: boolean;
  className?: string;
}

export function MoonieAssistantBubble({
  text,
  compact,
  className,
}: MoonieAssistantBubbleProps) {
  const [copied, setCopied] = useState(false);

  const copyText = useCallback(async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  if (!text.trim()) return null;

  return (
    <div
      className={cn(
        "group",
        MOONIE_ASSISTANT_BUBBLE_SHELL,
        "rounded-[1.125rem] bg-[#FBF6FC] px-3.5 py-2 text-[#1A1224] ring-1 ring-violet-100",
        compact ? "text-[0.9375rem] leading-snug" : "text-[0.9375rem] leading-snug sm:text-base",
        "[user-select:text] [-webkit-user-select:text]",
        className
      )}
    >
      <span className={MOONIE_CHAT_BUBBLE_TEXT}>{text}</span>
      <button
        type="button"
        onClick={() => void copyText()}
        aria-label={copied ? "Copied" : "Copy reply"}
        className={cn(
          "absolute -right-1 -top-2 inline-flex select-none items-center gap-1 rounded-full border border-violet-100 bg-white px-2 py-0.5 text-[10px] font-semibold text-[#6E46C7] shadow-sm transition",
          "opacity-0 focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
        )}
      >
        {copied ? (
          <>
            <Check className="size-3" aria-hidden />
            Copied
          </>
        ) : (
          <>
            <Copy className="size-3" aria-hidden />
            Copy
          </>
        )}
      </button>
    </div>
  );
}
