import Link from "next/link";
import { BookOpen, MessageCircle, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingMoonie } from "@/components/brand/FloatingMoonie";
import { moonieVariantFor } from "@/lib/moonie/variants";

export function CommunityHeroSection() {
  return (
    <section className="relative overflow-visible border-b border-border/60 bg-warm">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#ede9fe_0%,_transparent_55%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-sky-100/80 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-4 py-1.5 text-xs font-medium text-primary shadow-sm">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Your web novel reading community
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-tight">
            Discover stories.{" "}
            <span className="text-primary">Share reviews.</span>{" "}
            Find your next read.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            MoonVerse brings together honest reader reviews, lively discussions,
            and Moonie&apos;s AI recommendations, like a book club that never
            sleeps.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="mv-nav-signup rounded-full border-0 font-bold text-white"
              render={<Link href="/register" />}
            >
              Get started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="mv-nav-login rounded-full font-bold"
              render={<Link href="/discover" />}
            >
              <BookOpen data-icon="inline-start" />
              Explore reviews
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md overflow-visible lg:max-w-none">
          <div className="absolute -right-2 -top-6 z-20">
            <FloatingMoonie variant={moonieVariantFor("hero")} size={72} display="badge" compact />
          </div>

          <div className="relative rounded-3xl border border-border/60 bg-white p-6 shadow-xl shadow-primary/5">
            <div className="space-y-4 pt-8">
              <div className="rounded-2xl bg-moon-purple-soft p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Star className="size-4 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden="true" />
                  <span className="text-sm font-semibold">Trending review</span>
                </div>
                <p className="mt-2 text-sm font-medium text-foreground">
                  A cultivation journey that actually delivers
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  After 400 chapters, the power scaling feels earned and the sect
                  politics hit hard…
                </p>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 rounded-2xl border border-border/60 bg-bg-warm p-3">
                  <BookOpen className="size-5 text-primary" aria-hidden="true" />
                  <p className="mt-2 text-xs font-medium">8 novels</p>
                  <p className="text-[10px] text-muted-foreground">reviewed</p>
                </div>
                <div className="flex-1 rounded-2xl border border-border/60 bg-bg-warm p-3">
                  <MessageCircle className="size-5 text-success" aria-hidden="true" />
                  <p className="mt-2 text-xs font-medium">Live comments</p>
                  <p className="text-[10px] text-muted-foreground">join the chat</p>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                <span className="font-medium">Moonie:</span> Try fantasy romance
                with a magic academy setting ✨
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
