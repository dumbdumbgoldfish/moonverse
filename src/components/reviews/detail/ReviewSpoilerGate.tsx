"use client";

import { useState } from "react";
import { EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReviewSpoilerGateProps {
  containsSpoilers: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ReviewSpoilerGate({
  containsSpoilers,
  children,
  className,
}: ReviewSpoilerGateProps) {
  const [revealed, setRevealed] = useState(!containsSpoilers);

  if (!containsSpoilers || revealed) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative", className)}>
      <div
        className="pointer-events-none select-none blur-md"
        aria-hidden
      >
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#FBF7F1]/85 px-4 text-center backdrop-blur-sm">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-[#1a1033]/10 text-[#1a1033]">
          <EyeOff className="size-5" aria-hidden />
        </span>
        <div>
          <p className="font-heading text-lg font-semibold text-[#1a1033]">
            Spoilers ahead
          </p>
          <p className="mt-1 max-w-xs text-sm text-[#5a4d72]">
            This review discusses plot details. Reveal when you are ready.
          </p>
        </div>
        <Button
          type="button"
          className="rounded-full bg-[#1a1033] px-5 text-white hover:bg-[#2a1848]"
          onClick={() => setRevealed(true)}
        >
          Show review
        </Button>
      </div>
    </div>
  );
}
