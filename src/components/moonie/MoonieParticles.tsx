"use client";

import {
  BookOpen,
  Heart,
  HelpCircle,
  Moon,
  Sparkles,
  Star,
} from "lucide-react";
import type { MoonieParticlePreset } from "@/lib/moonie/animation-states";
import { cn } from "@/lib/utils";

interface ParticleSpec {
  id: string;
  x: string;
  y: string;
  size: number;
  kind: "sparkle" | "star" | "book" | "moon" | "question" | "heart" | "z";
}

const PRESET_PARTICLES: Record<MoonieParticlePreset, ParticleSpec[]> = {
  none: [],
  sparkles: [
    { id: "s1", x: "-10%", y: "14%", size: 11, kind: "sparkle" },
    { id: "s2", x: "92%", y: "18%", size: 10, kind: "sparkle" },
  ],
  stars: [
    { id: "st1", x: "-8%", y: "10%", size: 12, kind: "star" },
    { id: "st2", x: "94%", y: "14%", size: 10, kind: "star" },
  ],
  books: [
    { id: "b1", x: "-6%", y: "52%", size: 12, kind: "book" },
    { id: "b2", x: "90%", y: "46%", size: 11, kind: "book" },
  ],
  questions: [
    { id: "q1", x: "86%", y: "8%", size: 12, kind: "question" },
    { id: "q2", x: "-4%", y: "20%", size: 10, kind: "question" },
  ],
  confetti: [
    { id: "c1", x: "-10%", y: "12%", size: 11, kind: "star" },
    { id: "c2", x: "92%", y: "16%", size: 10, kind: "sparkle" },
    { id: "c3", x: "8%", y: "6%", size: 9, kind: "heart" },
  ],
  sleep: [{ id: "z1", x: "80%", y: "-2%", size: 12, kind: "z" }],
  magic: [
    { id: "m1", x: "-10%", y: "12%", size: 12, kind: "sparkle" },
    { id: "m2", x: "92%", y: "16%", size: 11, kind: "star" },
    { id: "m3", x: "-6%", y: "54%", size: 11, kind: "book" },
  ],
  hearts: [
    { id: "h1", x: "88%", y: "12%", size: 11, kind: "heart" },
    { id: "h2", x: "-6%", y: "28%", size: 10, kind: "heart" },
  ],
};

interface MoonieParticlesProps {
  preset: MoonieParticlePreset;
  className?: string;
  maxCount?: number;
}

function ParticleIcon({ kind }: { kind: ParticleSpec["kind"] }) {
  switch (kind) {
    case "book":
      return <BookOpen className="size-full" strokeWidth={2} aria-hidden />;
    case "moon":
      return <Moon className="size-full" strokeWidth={2} aria-hidden />;
    case "star":
      return <Star className="size-full" strokeWidth={2} aria-hidden />;
    case "question":
      return <HelpCircle className="size-full" strokeWidth={2} aria-hidden />;
    case "heart":
      return <Heart className="size-full fill-current" strokeWidth={2} aria-hidden />;
    case "z":
      return (
        <span className="text-xs font-bold text-primary/70" aria-hidden>
          z
        </span>
      );
    default:
      return <Sparkles className="size-full" strokeWidth={2} aria-hidden />;
  }
}

/** Static decorative icons. no continuous Framer Motion loops */
export function MoonieParticles({
  preset,
  className,
  maxCount = 3,
}: MoonieParticlesProps) {
  const particles = PRESET_PARTICLES[preset].slice(0, maxCount);
  if (particles.length === 0) return null;

  return (
    <div className={cn("pointer-events-none absolute inset-0", className)} aria-hidden>
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute flex items-center justify-center text-primary/50"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
          }}
        >
          <ParticleIcon kind={particle.kind} />
        </span>
      ))}
    </div>
  );
}
