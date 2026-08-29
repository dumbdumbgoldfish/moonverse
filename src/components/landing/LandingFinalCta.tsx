import Link from "next/link";
import { Moon } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import {
  FloatingMoon,
  Starfield,
  TwoToneCurve,
} from "@/components/landing/LandingDecor";
import { Button } from "@/components/ui/button";

export function LandingFinalCta() {
  return (
    <section className="relative overflow-hidden px-4 py-24 text-white sm:px-6 lg:px-8 lg:py-32">
      <TwoToneCurve pair="night-gold" shape="swell" glow="gold" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_0%,rgba(98,70,234,0.32)_0%,transparent_55%),radial-gradient(50%_40%_at_80%_80%,rgba(246,200,95,0.12)_0%,transparent_50%)]"
        aria-hidden
      />
      <Starfield accents={8} />
      <FloatingMoon
        shape="crescent"
        size={200}
        color="#F6C85F"
        float="slower"
        className="absolute -right-12 -top-8 opacity-40"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-8 size-[28rem] -translate-x-1/2 mv-blob-3 bg-[#6246ea]/18 blur-3xl"
        aria-hidden
      />

      <div className="relative z-[2] mx-auto flex max-w-3xl flex-col items-center text-center">
        <div className="mv-curve-panel border border-white/10 bg-white/[0.04] px-8 py-10 backdrop-blur-sm sm:px-12 sm:py-12">
          <MoonieMascot
            size={180}
            variant="excited"
            display="hero"
            className="mx-auto mv-float-slow"
          />

          <p className="mt-5 font-serif text-xl font-black tracking-tight sm:text-2xl">
            <span className="text-white">Moon</span>
            <span className="bg-gradient-to-r from-[#a78bfa] via-[#c4b5fd] to-[#F6C85F] bg-clip-text text-transparent">
              Verse
            </span>
          </p>

          <h2 className="mt-3 font-serif text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Your next favourite story is already waiting.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-lg text-white/65">
            Join MoonVerse, follow reviewers you trust and let Moonie guide you to
            stories you will love.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              className="mv-nav-signup h-12 rounded-full border-0 px-8 font-bold text-white"
              render={<Link href="/register" />}
            >
              <Moon className="size-4 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
              Create free account
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-white/30 bg-transparent px-8 font-bold text-white hover:bg-white/10 hover:text-white"
              render={<Link href="/discover" />}
            >
              Explore reviews
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
