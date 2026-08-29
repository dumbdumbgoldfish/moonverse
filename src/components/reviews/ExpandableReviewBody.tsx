"use client";

import { useState } from "react";
import { useSignInPrompt } from "@/components/auth/SignInPromptProvider";
import { cn } from "@/lib/utils";

interface ExpandableReviewBodyProps {
  text: string;
  collapsedLength?: number;
  className?: string;
  isLoggedIn?: boolean;
}

export function ExpandableReviewBody({
  text,
  collapsedLength = 480,
  className,
  isLoggedIn = true,
}: ExpandableReviewBodyProps) {
  const { promptSignIn } = useSignInPrompt();
  const [expanded, setExpanded] = useState(false);
  const needsTruncate = text.length > collapsedLength;
  const guestLimit = Math.min(collapsedLength, 280);
  const limit = isLoggedIn ? collapsedLength : guestLimit;
  const needsGuestGate = !isLoggedIn && text.length > guestLimit;

  if (!needsTruncate && !needsGuestGate) {
    return (
      <div className={cn("whitespace-pre-line leading-relaxed", className)}>{text}</div>
    );
  }

  const canExpand = isLoggedIn && expanded;
  const preview = canExpand ? text : `${text.slice(0, limit).trimEnd()}…`;

  const handleToggle = () => {
    if (!isLoggedIn) {
      promptSignIn();
      return;
    }
    setExpanded((current) => !current);
  };

  return (
    <div className={className}>
      <div className="whitespace-pre-line leading-relaxed">{preview}</div>
      <button
        type="button"
        onClick={handleToggle}
        className="mt-2 text-sm font-bold text-primary hover:underline"
      >
        {!isLoggedIn ? "Read full review" : expanded ? "See less" : "See more"}
      </button>
    </div>
  );
}
