"use client";

import { useEffect, useState } from "react";
import { Check, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionAnchorButtonProps {
  sectionId: string;
  label: string;
}

export function SectionAnchorButton({ sectionId, label }: SectionAnchorButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        const url = `${window.location.origin}${window.location.pathname}#${sectionId}`;
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
        } catch {
          setCopied(false);
        }
      }}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg text-slate-400 transition-colors",
        "hover:bg-violet-50 hover:text-violet-700",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
      aria-label={copied ? "Link copied" : `Copy link to ${label}`}
    >
      {copied ? <Check className="size-4 text-emerald-600" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
    </button>
  );
}
