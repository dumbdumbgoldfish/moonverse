"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BrowseSignupBand() {
  return (
    <section
      aria-label="Create an account"
      className="mt-12 overflow-hidden rounded-2xl bg-gradient-to-br from-[#6E46C7]/12 via-[#FBF7F1] to-[#C89B4A]/12 p-6 ring-1 ring-[#6E46C7]/15 sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6E46C7]">
            <Sparkles className="size-3.5" aria-hidden />
            Join MoonVerse
          </p>
          <h2 className="mt-2 font-serif text-xl font-medium text-[#1A1224] sm:text-2xl">
            Save reviews, follow readers, get a For You feed
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#1A1224]/65">
            Free account. Keep lists, unlock personalised sorts, and let Moonie
            learn your taste over time.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            className="mv-nav-signup h-10 rounded-full border-0 px-6 font-bold text-white"
            render={<Link href="/register?callbackUrl=/discover" />}
          >
            Join free
          </Button>
          <Button
            variant="outline"
            className="h-10 rounded-full font-semibold"
            render={<Link href="/login?callbackUrl=/discover" />}
          >
            Log in
          </Button>
        </div>
      </div>
    </section>
  );
}
