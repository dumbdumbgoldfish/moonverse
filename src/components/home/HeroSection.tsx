import Link from "next/link";
import { BookOpen, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoonieMascot } from "@/components/brand/MoonieMascot";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* Background gradient */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-32 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-accent/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-28">
        <div>
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-bg-elevated px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            AI-powered web novel community
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Where readers{" "}
            <span className="text-accent">orbit</span> great stories
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Discover honest reviews from fellow web novel fans. Share your thoughts,
            build collections, and let Moonie recommend your next adventure.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" render={<Link href="/reviews" />}>
              <BookOpen data-icon="inline-start" />
              Explore Reviews
            </Button>
            <Button size="lg" variant="outline" render={<Link href="/reviews/new" />}>
              <PenLine data-icon="inline-start" />
              Write a Review
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Join a growing community of web novel enthusiasts.
          </p>
        </div>

        <div className="relative flex items-center justify-center lg:justify-end">
          <div className="relative">
            <MoonieMascot size={160} animated className="drop-shadow-lg" />
            <div className="absolute -bottom-4 left-1/2 w-max -translate-x-1/2 rounded-xl border border-border/60 bg-bg-elevated px-4 py-2 text-sm text-muted-foreground shadow-lg">
              Hi! I&apos;m Moonie — ask me for recommendations ✨
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
