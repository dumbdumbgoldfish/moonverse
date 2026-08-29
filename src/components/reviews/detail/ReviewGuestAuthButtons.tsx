"use client";

import { useSignInPrompt } from "@/components/auth/SignInPromptProvider";
import { MV_PRIMARY_BTN } from "@/lib/mv-buttons";
import { DETAIL_NOVEL_BTN } from "@/lib/reviews/detail-surface";
import { cn } from "@/lib/utils";

interface ReviewGuestAuthButtonsProps {
  callbackUrl: string;
  className?: string;
}

export function ReviewSignInButton({
  callbackUrl,
  className,
  children,
}: {
  callbackUrl: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { promptSignIn } = useSignInPrompt();

  return (
    <button type="button" onClick={() => promptSignIn(callbackUrl)} className={className}>
      {children}
    </button>
  );
}

export function ReviewGuestAuthButtons({
  callbackUrl,
  className,
}: ReviewGuestAuthButtonsProps) {
  const { promptSignIn } = useSignInPrompt();

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <button
        type="button"
        onClick={() => promptSignIn(callbackUrl)}
        className={cn(MV_PRIMARY_BTN, "h-9 px-3.5 text-xs")}
      >
        Sign up
      </button>
      <button
        type="button"
        onClick={() => promptSignIn(callbackUrl)}
        className={cn(DETAIL_NOVEL_BTN, "h-9 px-3.5 text-xs")}
      >
        Log in
      </button>
    </div>
  );
}
