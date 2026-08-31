"use client";

import { AskMoonieButton } from "@/components/moonie/AskMoonieButton";
import {
  moonieGuestEntryHref,
  moonieLoggedInEntryHref,
} from "@/lib/moonie/open-moonie";
import { cn } from "@/lib/utils";

interface ReviewMoonieAskButtonProps {
  novelTitle: string;
  tags?: string[];
  variant?: "hero" | "compact";
  className?: string;
  isLoggedIn?: boolean;
  tone?: "light" | "dark";
  label?: string;
}

export function ReviewMoonieAskButton({
  novelTitle: _novelTitle,
  tags: _tags = [],
  variant = "hero",
  className,
  isLoggedIn = true,
  tone = "light",
  label,
}: ReviewMoonieAskButtonProps) {
  const buttonLabel = label ?? "Ask Moonie";
  const size = variant === "hero" ? "md" : "sm";
  const sharedClassName = cn(
    variant === "compact" && "text-xs",
    className
  );
  const href = isLoggedIn ? moonieLoggedInEntryHref() : moonieGuestEntryHref();

  return (
    <AskMoonieButton
      href={href}
      size={size}
      tone={tone}
      className={sharedClassName}
    >
      {buttonLabel}
    </AskMoonieButton>
  );
}
