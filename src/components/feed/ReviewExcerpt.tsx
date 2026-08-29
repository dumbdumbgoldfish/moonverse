"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ShieldAlert } from "lucide-react";
import { useSignInPromptOptional } from "@/components/auth/SignInPromptProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReviewExcerptProps {
  body: string;
  containsSpoilers: boolean;
  variant?: "default" | "literary";
  defaultExpanded?: boolean;
  onContinueRead?: () => void;
}

export function ReviewExcerpt({
  body,
  containsSpoilers,
  variant = "default",
  defaultExpanded = false,
  onContinueRead,
}: ReviewExcerptProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [spoilersRevealed, setSpoilersRevealed] = useState(false);
  const { status } = useSession();
  const pathname = usePathname();
  const prompt = useSignInPromptOptional();
  const text = body.trim();
  const long = text.length > 420 || text.split("\n").length > 6;
  const literary = variant === "literary";

  const requireLogin = () => {
    const callbackUrl = pathname || "/";
    prompt?.promptSignIn(callbackUrl);
    if (!prompt) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
    }
  };

  const handleExpand = () => {
    if (onContinueRead && !expanded) {
      onContinueRead();
      return;
    }
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (status === "unauthenticated") {
      requireLogin();
      return;
    }
    setExpanded(true);
  };

  if (containsSpoilers && !spoilersRevealed) {
    return (
      <div
        className={cn(
          "mt-3 rounded-xl border px-3 py-3",
          literary
            ? "border-[var(--mv-gold)]/35 bg-[var(--mv-paper)]"
            : "border-amber-200 bg-amber-50/80"
        )}
      >
        <p
          className={cn(
            "inline-flex items-center gap-1.5 text-sm font-bold",
            literary ? "text-[var(--mv-deep-plum)]" : "text-amber-950"
          )}
        >
          <ShieldAlert className="size-4" aria-hidden />
          Contains spoilers
        </p>
        <p
          className={cn(
            "mt-1 text-xs",
            literary ? "text-[var(--mv-text-muted)]" : "text-amber-900/90"
          )}
        >
          The review body is hidden until you choose to reveal it.
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-2 rounded-lg"
          onClick={() => {
            if (status === "unauthenticated") {
              requireLogin();
              return;
            }
            setSpoilersRevealed(true);
          }}
        >
          Reveal spoilers
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(literary ? "mt-3.5" : "mt-2.5")}>
      <div
        className={cn(
          "relative",
          literary
            ? "text-[16px] leading-[1.65] text-[var(--mv-ink)]"
            : "whitespace-pre-line text-[13px] leading-relaxed text-slate-700",
          !expanded && long && "line-clamp-5",
          onContinueRead && !expanded && "cursor-pointer"
        )}
        onClick={
          onContinueRead && !expanded
            ? () => {
                onContinueRead();
              }
            : undefined
        }
      >
        {literary ? <p className="whitespace-pre-line">{text}</p> : text}
      </div>
      {long ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleExpand();
          }}
          className={cn(
            "mt-1.5 text-[13px] font-semibold hover:underline",
            literary ? "text-[var(--mv-plum)]" : "font-bold text-primary"
          )}
        >
          {expanded
            ? "Show less"
            : literary
              ? "Continue reading"
              : "See more"}
        </button>
      ) : null}
    </div>
  );
}
