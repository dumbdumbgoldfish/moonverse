"use client";

import { Eye, EyeOff, MessageCircle } from "lucide-react";
import {
  cycleSpoilerMode,
  SPOILER_MODE_LABELS,
} from "@/lib/moonie/spoiler-mode";
import {
  MOONIE_COMPOSER_TOOLBAR_BUTTON,
  MOONIE_COMPOSER_TOOLBAR_BUTTON_ACTIVE,
} from "@/components/moonie/MoonieDesk";
import { cn } from "@/lib/utils";
import type { MoonieSpoilerMode } from "@/types/moonie";

export function MoonieSpoilerToggle({
  mode,
  onChange,
  className,
  compact,
  widget,
  iconOnly,
}: {
  mode: MoonieSpoilerMode;
  onChange: (mode: MoonieSpoilerMode) => void;
  className?: string;
  compact?: boolean;
  /** Icon-only, always subtle styling for the floating widget. */
  widget?: boolean;
  /** Icon-only for the desk composer toolbar. */
  iconOnly?: boolean;
}) {
  const Icon =
    mode === "none" ? EyeOff : mode === "light" ? Eye : MessageCircle;

  const toneClass = widget
    ? "border-violet-100 bg-white text-slate-600 hover:border-violet-200 hover:text-slate-700"
    : mode === "none"
      ? "border-violet-100 bg-white text-slate-600 hover:border-violet-200 hover:text-slate-700"
      : mode === "light"
        ? "border-amber-200/80 bg-amber-50/80 text-amber-900"
        : "border-[#4C2A67]/80 bg-[#4C2A67] text-white";

  const handleClick = () => {
    const next = cycleSpoilerMode(mode);
    onChange(next);
  };

  if (iconOnly || widget) {
    const isDeskComposer = iconOnly && !widget;

    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Spoiler mode: ${SPOILER_MODE_LABELS[mode]}`}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border transition",
          isDeskComposer ? "size-10" : "size-8",
          isDeskComposer
            ? mode === "none"
              ? MOONIE_COMPOSER_TOOLBAR_BUTTON
              : MOONIE_COMPOSER_TOOLBAR_BUTTON_ACTIVE
            : toneClass,
          className
        )}
      >
        <Icon
          className={cn("shrink-0", isDeskComposer ? "size-4" : "size-3.5")}
          aria-hidden
        />
      </button>
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Spoiler mode: ${SPOILER_MODE_LABELS[mode]}`}
        className={cn(
          "inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2 transition",
          toneClass,
          className
        )}
      >
        <Icon className="size-3.5 shrink-0" aria-hidden />
        <span className="text-[10px] font-semibold leading-none">
          {SPOILER_MODE_LABELS[mode]}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Spoiler mode: ${SPOILER_MODE_LABELS[mode]}`}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition",
        toneClass,
        className
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {SPOILER_MODE_LABELS[mode]}
    </button>
  );
}
