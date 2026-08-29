"use client";

import { AskMoonieButton } from "@/components/moonie/AskMoonieButton";
import { FloatingMoonie } from "@/components/brand/FloatingMoonie";
import { moonieVariantFor } from "@/lib/moonie/variants";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";

export function MoonieTeaserSection() {
  return (
    <section
      className="overflow-visible border-t border-border/60 py-16 sm:py-20"
      aria-labelledby="moonie-heading"
    >
      <div className={SITE_SHELL_CLASS}>
        <div className="flex flex-col items-center text-center">
          <FloatingMoonie variant={moonieVariantFor("hero")} size={140} />
          <h2
            id="moonie-heading"
            className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Meet Moonie
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Your friendly reading companion. Ask Moonie what to read next based on
            your taste. Never auto-generated reviews from Moonie.
          </p>
          <AskMoonieButton size="lg" className="mt-6">
            Chat with Moonie
          </AskMoonieButton>
        </div>
      </div>
    </section>
  );
}
