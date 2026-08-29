"use client";

import { AskMoonieButton } from "@/components/moonie/AskMoonieButton";
import { useSignInPrompt } from "@/components/auth/SignInPromptProvider";
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
  novelTitle,
  tags = [],
  variant = "hero",
  className,
  isLoggedIn = true,
  tone = "light",
  label,
}: ReviewMoonieAskButtonProps) {
  const { promptSignIn } = useSignInPrompt();
  const tagHint = tags[0]?.replace(/-/g, " ");
  const prompt = tagHint
    ? `Find novels like ${novelTitle} with ${tagHint} vibes, but easier on the angst.`
    : `Find novels like ${novelTitle} that match this reviewer's taste.`;

  return (
    <AskMoonieButton
      prompt={prompt}
      size={variant === "hero" ? "md" : "sm"}
      tone={tone}
      className={cn(
        variant === "compact" && "text-xs",
        className
      )}
      onClick={(event) => {
        if (!isLoggedIn) {
          event.preventDefault();
          promptSignIn();
        }
      }}
    >
      {label ?? "Ask Moonie"}
    </AskMoonieButton>
  );
}
