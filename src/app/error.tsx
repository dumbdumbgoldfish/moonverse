"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Bookmark,
  Compass,
  Home,
  MessageCircleHeart,
  RefreshCw,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section
      aria-labelledby="error-heading"
      className="relative overflow-hidden border-b border-violet-100 bg-[radial-gradient(120%_80%_at_10%_0%,#efe8ff_0%,#f7f2ea_42%,#f3efe6_100%)]"
    >
      <div
        className="pointer-events-none absolute -left-16 top-24 size-56 rounded-full bg-violet-200/35 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-10 bottom-10 size-72 rounded-full bg-amber-100/40 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div
          role="alert"
          className="grid overflow-hidden rounded-[28px] border border-violet-100 bg-white/90 shadow-[0_24px_80px_-28px_rgba(76,29,149,0.35)] sm:rounded-[32px] lg:grid-cols-[1.05fr_0.95fr]"
        >
          {/* Copy + actions */}
          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
            <p className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700">
              <Sparkles className="size-3.5 text-[#F6C85F]" aria-hidden />
              Moonie found a glitch
            </p>

            <h1
              id="error-heading"
              className="mt-5 font-serif text-3xl font-black leading-tight tracking-tight text-[#1e1636] sm:text-4xl"
            >
              Something went wrong, but your reading journey is safe.
            </h1>

            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600">
              MoonVerse could not load this page properly. Try again, return home
              or continue browsing while Moonie keeps your place.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                size="lg"
                onClick={reset}
                className="mv-nav-signup h-11 min-h-11 rounded-full border-0 px-5 text-sm font-semibold text-white"
              >
                <RefreshCw data-icon="inline-start" aria-hidden />
                Try again
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="mv-nav-login h-11 min-h-11 rounded-full px-5 text-sm font-semibold"
                render={<Link href="/" />}
              >
                <Home data-icon="inline-start" aria-hidden />
                Go home
              </Button>
            </div>

            <p className="mt-3">
              <Link
                href="/discover"
                className="text-sm font-medium text-violet-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Browse reviews
              </Link>
              <span className="mx-2 text-violet-200" aria-hidden>
                ·
              </span>
              <Link
                href="/contact"
                className="text-sm text-slate-500 underline-offset-4 hover:text-violet-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Report this issue
              </Link>
            </p>

            <div className="mt-10 border-t border-violet-100 pt-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                You can also
              </p>
              <ul className="mt-3 space-y-1">
                <RecoveryLink
                  href="/discover"
                  icon={Compass}
                  label="Browse trending reviews"
                />
                <RecoveryLink
                  href="/discover"
                  icon={Search}
                  label="Search for another novel"
                />
                <RecoveryLink
                  href="/ask-moonie"
                  icon={MessageCircleHeart}
                  label="Ask Moonie for a recommendation"
                />
              </ul>
            </div>

            {error.digest ? (
              <p className="mt-6 text-[11px] text-slate-400">
                Reference: {error.digest}
              </p>
            ) : null}
          </div>

          {/* Moonie panel */}
          <div className="relative min-h-[300px] overflow-hidden bg-gradient-to-br from-violet-50 via-purple-50 to-amber-50 sm:min-h-[360px]">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_55%_45%,rgba(139,124,247,0.28),transparent_70%)]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-[#F6C85F]/20 blur-2xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-6 left-6 size-28 rounded-full bg-violet-300/25 blur-2xl"
              aria-hidden
            />

            {/* Decorative accents */}
            <Star
              className="absolute left-8 top-10 size-4 text-[#F6C85F]/80 motion-safe:animate-pulse"
              aria-hidden
            />
            <Star
              className="absolute right-14 top-20 size-3 text-violet-400/70 motion-safe:animate-pulse"
              aria-hidden
            />
            <Bookmark
              className="absolute bottom-28 left-10 hidden size-7 rotate-[-18deg] text-violet-300/80 sm:block"
              aria-hidden
            />
            <div
              className="absolute right-10 top-28 hidden h-16 w-12 rotate-12 rounded-md border border-violet-200/70 bg-white/70 shadow-sm md:block"
              aria-hidden
            />

            <div className="relative z-[1] flex h-full min-h-[300px] items-end justify-center pb-28 sm:min-h-[360px]">
              <span className="sr-only">
                Moonie looking confused about the page error
              </span>
              <div className="motion-safe:animate-moonie-float">
                <MoonieMascot
                  variant="confused"
                  size={260}
                  display="hero"
                  priority
                  lightweight
                  className="max-w-[72vw] object-contain sm:max-w-none"
                />
              </div>
            </div>

            <div className="absolute bottom-5 left-5 right-5 z-[2] mx-auto max-w-xs rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-[0_12px_30px_-18px_rgba(30,22,54,0.35)] backdrop-blur-sm sm:left-auto sm:right-6 sm:mx-0">
              <p className="text-xs font-bold text-[#1e1636]">
                Moonie is checking the shelves
              </p>
              <p className="mt-1 text-[11px] leading-snug text-slate-500">
                Try again in a moment or use one of the safe routes below.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RecoveryLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Compass;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 text-sm text-slate-600 transition-colors hover:bg-violet-50 hover:text-[#1e1636] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 ring-1 ring-violet-100 transition-colors group-hover:bg-white">
          <Icon className="size-4" aria-hidden />
        </span>
        {label}
      </Link>
    </li>
  );
}
