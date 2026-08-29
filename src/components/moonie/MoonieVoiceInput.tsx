"use client";

import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MoonieVoiceDictationState } from "@/hooks/use-moonie-voice-dictation";

interface MoonieVoiceInputProps {
  disabled?: boolean;
  className?: string;
  statusMessage?: string | null;
  state: MoonieVoiceDictationState;
  onStart: () => void;
  onDismissError: () => void;
}

export function MoonieVoiceInput({
  disabled,
  className,
  statusMessage,
  state,
  onStart,
  onDismissError,
}: MoonieVoiceInputProps) {
  if (state === "unsupported" || state === "permission_denied") {
    return (
      <div className="flex shrink-0 flex-col items-center gap-1">
        <button
          type="button"
          onClick={onDismissError}
          aria-label="Dismiss voice dictation error"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-900",
            className
          )}
        >
          <Mic className="size-4" aria-hidden />
        </button>
        {statusMessage ? (
          <p
            className="max-w-[9rem] text-center text-[10px] leading-snug text-amber-900"
            role="alert"
          >
            {statusMessage}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label="Start voice dictation"
      onClick={onStart}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-violet-100 bg-[#FFFBFF] text-[#6E46C7] transition hover:bg-violet-50 disabled:opacity-50",
        className
      )}
    >
      <Mic className="size-4" aria-hidden />
    </button>
  );
}
