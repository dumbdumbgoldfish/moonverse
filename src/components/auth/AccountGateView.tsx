import Link from "next/link";
import { MessageCircle, PenLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoonieMascot } from "@/components/brand/MoonieMascot";

interface AccountGateViewProps {
  title: string;
  description: string;
  ctaLabel?: string;
}

export function AccountGateView({
  title,
  description,
  ctaLabel = "Sign up free",
}: AccountGateViewProps) {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-moon-purple-soft">
            <PenLine className="size-9 text-primary" aria-hidden />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{description}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="mv-nav-signup rounded-full px-8 font-bold text-white"
              render={<Link href="/register" />}
            >
              {ctaLabel}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="mv-nav-login rounded-full px-8 font-bold"
              render={<Link href="/login" />}
            >
              Log in
            </Button>
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            <Link href="/" className="font-semibold text-primary hover:underline">
              Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export function MoonieGateView() {
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
            <MoonieMascot
              size={64}
              variant="waving"
              display="clean"
              lightweight
              className="mx-auto"
            />

            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.18em] text-primary">
              Ask Moonie
            </p>
            <h1 className="mt-1.5 font-serif text-[1.55rem] font-bold leading-tight text-night-blue">
              Find your next story faster
            </h1>
            <p className="mx-auto mt-2.5 max-w-sm text-sm leading-6 text-slate-600">
              Get web novel recommendations based on your mood, favourite genres
              and reading history.
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2.5 text-left">
                <Sparkles className="size-4 text-primary" aria-hidden />
                <p className="mt-1 text-xs font-bold text-night-blue">
                  Mood-based picks
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                  Ask for cozy, tense, funny or slow-burn reads.
                </p>
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2.5 text-left">
                <MessageCircle className="size-4 text-primary" aria-hidden />
                <p className="mt-1 text-xs font-bold text-night-blue">
                  Chat with Moonie
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                  Save better suggestions as you read and review.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <Button
                className="mv-nav-signup h-11 min-h-[44px] w-full rounded-full border-0 text-sm font-bold text-white"
                render={<Link href="/register" />}
              >
                Sign up to chat
              </Button>
              <Button
                variant="outline"
                className="mv-nav-login h-11 min-h-[44px] w-full rounded-full text-sm font-bold"
                render={<Link href="/login" />}
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
