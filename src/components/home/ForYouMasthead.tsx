"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Globe,
  Heart,
  Layers,
  MessageCircleHeart,
  Moon,
  Pencil,
  RefreshCw,
  ScrollText,
  Sparkle,
  Sparkles,
  Timer,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { getGenreIcon } from "@/components/browse/genre-icon";
import { MoonieCharacter } from "@/components/moonie/MoonieCharacter";
import { AskMoonieButton } from "@/components/moonie/AskMoonieButton";
import { cn } from "@/lib/utils";
import type { PreferredGenreOption } from "@/services/preference.service";

interface ForYouMastheadProps {
  greetingName: string;
  genres: PreferredGenreOption[];
}

const GALAXY_TILT = -28;

/** Elliptical galaxy arms — angles staggered so icons never share a ray. */
const GALAXY_ICONS: {
  Icon: LucideIcon;
  rx: number;
  ry: number;
  angle: number;
}[] = [
  { Icon: WandSparkles, rx: 26, ry: 15, angle: 40 },
  { Icon: Heart, rx: 26, ry: 15, angle: 160 },
  { Icon: Layers, rx: 26, ry: 15, angle: 270 },
  { Icon: Moon, rx: 38, ry: 22, angle: 90 },
  { Icon: Timer, rx: 38, ry: 22, angle: 200 },
  { Icon: Heart, rx: 38, ry: 22, angle: 315 },
  { Icon: Globe, rx: 50, ry: 29, angle: 58 },
  { Icon: Sparkle, rx: 50, ry: 29, angle: 112 },
  { Icon: ScrollText, rx: 50, ry: 29, angle: 232 },
  { Icon: RefreshCw, rx: 50, ry: 29, angle: 338 },
];

const GALAXY_RINGS = [
  { rx: 26, ry: 15 },
  { rx: 38, ry: 22 },
  { rx: 50, ry: 29 },
] as const;

const GALAXY_DUST = [
  { rx: 32, ry: 18, angle: 10 },
  { rx: 32, ry: 18, angle: 100 },
  { rx: 44, ry: 25, angle: 48 },
  { rx: 44, ry: 25, angle: 168 },
  { rx: 44, ry: 25, angle: 280 },
  { rx: 54, ry: 31, angle: 85 },
  { rx: 54, ry: 31, angle: 255 },
];

function galaxyPoint(rx: number, ry: number, angle: number, tilt = GALAXY_TILT) {
  const a = (angle * Math.PI) / 180;
  const t = (tilt * Math.PI) / 180;
  const x = rx * Math.cos(a);
  const y = ry * Math.sin(a);
  // Fixed decimals so SSR and the browser emit the same style strings.
  return {
    x: (50 + x * Math.cos(t) - y * Math.sin(t)).toFixed(2),
    y: (50 + x * Math.sin(t) + y * Math.cos(t)).toFixed(2),
  };
}

const SIGNAL_CARDS = [
  {
    title: "Favourite genres",
    body: "Your picks steer every shelf.",
    icon: Sparkles,
  },
  {
    title: "Saved stories",
    body: "Library saves shape next reads.",
    icon: Bookmark,
  },
  {
    title: "Community pulse",
    body: "Reviews & activity nearby.",
    icon: MessageCircleHeart,
  },
] as const;

function timeGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function ForYouMasthead({ greetingName, genres }: ForYouMastheadProps) {
  const [greeting] = useState(() => timeGreeting(new Date().getHours()));
  const activeGenres = genres.slice(0, 10);

  return (
    <header className="relative overflow-hidden rounded-[28px] bg-[#0B0818] text-[#F4F0FF] shadow-[0_28px_64px_-32px_rgba(8,6,24,0.85)]">
      <div
        className="pointer-events-none absolute -left-24 top-[-80px] size-[320px] rounded-full bg-[#6E46C7]/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-[-90px] size-[280px] rounded-full bg-[#C89B4A]/12 blur-3xl"
        aria-hidden
      />

      <div className="relative grid lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)]">
        <div className="flex flex-col gap-5 px-5 py-6 sm:px-8 sm:py-8 lg:pr-6">
          <p className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#E8C36A]/55 bg-[#E8C36A]/8 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#E8C36A]">
            <Sparkles className="size-3.5" aria-hidden />
            Your reading orbit
          </p>

          <div>
            <p className="text-sm font-medium text-[#C4B8E4]">
              {greeting}, {greetingName}
            </p>
            <h1 className="mt-2 max-w-xl font-serif text-[2rem] font-medium leading-[1.12] tracking-tight text-white sm:text-[2.55rem]">
              Stories pulled into{" "}
              <em className="bg-gradient-to-r from-[#F0D48A] via-[#E8C36A] to-[#C9A0FF] bg-clip-text font-serif italic text-transparent">
                your orbit
              </em>
              .
            </h1>
            <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[#B7B0CC] sm:text-[15px]">
              MoonVerse lined these shelves from the genres you chose, what you
              save, and what readers like you are talking about right now.
            </p>
          </div>

          <ul className="grid gap-2.5 sm:grid-cols-3">
            {SIGNAL_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <li
                  key={card.title}
                  className="rounded-2xl border border-white/8 bg-white/[0.04] px-3.5 py-3"
                >
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-white">
                    <Icon className="size-3.5 text-[#E8C36A]" aria-hidden />
                    {card.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-[#9C95B3]">
                    {card.body}
                  </p>
                </li>
              );
            })}
          </ul>

          {activeGenres.length > 0 ? (
            <div>
              <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8B84A3]">
                Active genres · {activeGenres.length}
              </p>
              <ul className="flex flex-wrap gap-2">
                {activeGenres.map((genre) => {
                  const Icon = getGenreIcon(genre.slug);
                  return (
                    <li key={genre.id}>
                      <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.05] px-3 text-[12px] font-semibold text-[#EDE8FF]">
                        <Icon className="size-3.5 text-[#E8C36A]" aria-hidden />
                        {genre.name}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <Link
              href="/settings/preferences"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/20 px-4 text-[13px] font-semibold text-white transition fine-hover:border-white/40 fine-hover:bg-white/8"
            >
              <Pencil className="size-3.5" aria-hidden />
              Edit preferences
            </Link>
            <AskMoonieButton
              prompt="Recommend novel reviews that match my For You shelves."
              size="md"
              className="min-h-10 px-5 text-[13px] font-bold focus-visible:ring-[#E8C36A]"
            />
          </div>
        </div>

        <ForYouOrbitPanel />
      </div>
    </header>
  );
}

function ForYouOrbitPanel() {
  return (
    <div className="relative hidden border-t border-white/8 lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-6 lg:border-l lg:border-t-0 lg:px-6 lg:py-10">
      <div className="relative size-[400px] shrink-0">
        <svg
          viewBox="0 0 400 400"
          className="pointer-events-none absolute inset-0 size-full"
          aria-hidden
        >
          <g transform={`rotate(${GALAXY_TILT} 200 200)`}>
            {GALAXY_RINGS.map((ring) => (
              <ellipse
                key={`${ring.rx}-${ring.ry}`}
                cx="200"
                cy="200"
                rx={ring.rx * 4}
                ry={ring.ry * 4}
                fill="none"
                stroke="#C9A46A"
                strokeWidth="1.1"
                strokeDasharray="2 8"
                strokeOpacity="0.38"
              />
            ))}
          </g>
        </svg>

        {GALAXY_DUST.map((speck, index) => {
          const { x, y } = galaxyPoint(speck.rx, speck.ry, speck.angle);
          return (
            <span
              key={`dust-${index}`}
              className="absolute size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E8C36A]/55 shadow-[0_0_8px_rgba(232,195,106,0.8)]"
              style={{ left: `${x}%`, top: `${y}%` }}
              aria-hidden
            />
          );
        })}

        {GALAXY_ICONS.map(({ Icon, rx, ry, angle }, index) => {
          const { x, y } = galaxyPoint(rx, ry, angle);
          return (
            <span
              key={`${index}-${angle}`}
              className="absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#E8C36A]/45 bg-[#0B0818] text-[#E8C36A] shadow-[0_0_14px_rgba(232,195,106,0.4)]"
              style={{ left: `${x}%`, top: `${y}%` }}
              aria-hidden
            >
              <Icon
                className="size-3 drop-shadow-[0_0_6px_rgba(232,195,106,0.85)]"
                strokeWidth={1.75}
              />
            </span>
          );
        })}

        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <MoonieCharacter
            size={96}
            emotion="happy"
            priority
            lightweight
            display="clean"
            className="drop-shadow-[0_16px_28px_rgba(0,0,0,0.5)]"
          />
        </div>
      </div>

      <p className="inline-flex items-center gap-1.5 text-[12px] font-medium tracking-wide text-[#EDE8FF]">
        <Sparkles className="size-3 text-[#E8C36A]" aria-hidden />
        Moonie is watching your shelves
      </p>
    </div>
  );
}
