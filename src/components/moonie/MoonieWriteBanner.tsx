"use client";

import { useEffect, useState } from "react";
import { FloatingMoonie } from "@/components/brand/FloatingMoonie";
import { moonieVariantFor } from "@/lib/moonie/variants";
import type { MoonieExpression } from "@/lib/moonie/variants";

const MESSAGES: { variant: MoonieExpression; text: string }[] = [
  {
    variant: moonieVariantFor("writeBanner"),
    text: "Your readers are waiting for the next chapter.",
  },
  {
    variant: "happy",
    text: "Every great story starts with one page.",
  },
];

/** Stable SSR/hydration pick: never use Math.random during render. */
const DEFAULT_PICK = MESSAGES[0];

export function MoonieWriteBanner() {
  const [pick, setPick] = useState(DEFAULT_PICK);

  useEffect(() => {
    // Optional variety after hydration only.
    const frame = window.requestAnimationFrame(() => {
      setPick(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="relative flex items-center gap-3 overflow-visible">
      <FloatingMoonie variant={pick.variant} size={72} />
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
          Moonie
        </p>
        <p className="mt-1 text-sm font-bold leading-snug text-night-blue sm:text-base">
          {pick.text}
        </p>
      </div>
    </div>
  );
}
