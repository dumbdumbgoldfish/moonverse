import Link from "next/link";
import {
  MessageSquare,
  Moon,
  PenLine,
  Sparkles,
  Star,
} from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { buildGuestLoginHref, buildGuestRegisterHref } from "@/lib/auth-login-redirect";
import { buildAuthenticatedWriteReviewHref } from "@/lib/write-entry";
import { Button } from "@/components/ui/button";

const BENEFITS = [
  { icon: PenLine, label: "Publish thoughtful reviews" },
  { icon: MessageSquare, label: "Join comments and discussions" },
  { icon: Sparkles, label: "Improve Moonie recommendations" },
];

export function WriteGateModalView({ novelId }: { novelId?: string }) {
  const postAuthCallback = buildAuthenticatedWriteReviewHref(novelId);
  const registerHref = buildGuestRegisterHref(postAuthCallback);
  const loginHref = buildGuestLoginHref(postAuthCallback);

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-[#fbf7ff] via-white to-[#fff8ed]">
      <main className="flex flex-1 items-start justify-center px-4 py-7 sm:items-center sm:py-10">
        <div className="mv-write-gate-modal relative mx-auto w-full max-w-[430px] overflow-hidden rounded-[24px] border border-violet-200/80 bg-white p-5 text-center shadow-[0_24px_70px_rgba(39,20,90,0.14)] sm:p-6">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-violet-100/70 to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-primary/10 blur-2xl"
            aria-hidden
          />

          <div className="relative">
            <div className="flex justify-center">
              <div className="relative">
                <div
                  className="absolute -right-1 -top-1 text-violet-200/90"
                  aria-hidden
                >
                  <Moon className="size-3.5 fill-violet-100 stroke-violet-200" />
                </div>
                <div className="absolute -left-2 top-1 text-amber-200/90" aria-hidden>
                  <Star className="size-2.5 fill-[var(--mv-gold)]" />
                </div>
                <MoonieMascot
                  size={64}
                  variant="excited"
                  display="clean"
                  lightweight
                  className="mx-auto"
                />
              </div>
            </div>

            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              Write on MoonVerse
            </p>
            <h1 className="mt-1.5 font-serif text-[1.55rem] font-bold leading-tight text-night-blue">
              Share your next great read with the community
            </h1>
            <p className="mx-auto mt-2.5 max-w-sm text-sm leading-6 text-slate-600">
              Create a free account to publish reviews, join discussions and build
              your reviewer profile.
            </p>

            <ul className="mt-4 grid gap-2 sm:grid-cols-3">
              {BENEFITS.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <li
                    key={benefit.label}
                    className="flex items-center gap-2 rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2.5 text-left sm:flex-col sm:items-center sm:text-center"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm sm:mb-0.5">
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <span className="text-xs font-semibold leading-snug text-night-blue sm:text-[11px]">
                      {benefit.label}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 space-y-2.5">
              <Button
                className="mv-nav-signup h-11 min-h-[44px] w-full rounded-full border-0 text-sm font-bold text-white"
                render={<Link href={registerHref} />}
              >
                Create a free account
              </Button>
              <Button
                variant="outline"
                className="mv-nav-login h-11 min-h-[44px] w-full rounded-full text-sm font-bold"
                render={<Link href={loginHref} />}
              >
                Log in
              </Button>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              <Link
                href="/"
                className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-sm"
              >
                Back to home
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
