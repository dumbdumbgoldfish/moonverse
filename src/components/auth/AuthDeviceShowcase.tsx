import { Feather } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { CoverImage } from "@/components/ui/CoverImage";
import type { AuthShowcaseNovel } from "@/services/discovery.service";
import { cn } from "@/lib/utils";

export type AuthShowcaseVariant = "login" | "register";

const COVER_ROTATIONS = ["-rotate-3", "rotate-1", "rotate-3"] as const;

const COPY: Record<
  AuthShowcaseVariant,
  {
    eyebrow: string;
    heading: string;
    body: string;
    bubble: string;
    footer: string;
    moonieVariant: "happy" | "waving" | "excited";
    points: string[];
  }
> = {
  login: {
    eyebrow: "Welcome back",
    heading: "Your stacks are where you left them.",
    body: "Reviews, lists and Moonie’s taste of you sit on this desk. Pick up the thread.",
    bubble: "I saved your place.",
    footer: "Moonie is ready when you are",
    moonieVariant: "happy",
    points: ["Your library", "Your reviews", "Taste-aware picks"],
  },
  register: {
    eyebrow: "Open a reader’s desk",
    heading: "Start a catalogue that knows your taste.",
    body: "Create a handle, then tell Moonie what you like. No feed to perform for. Just books.",
    bubble: "I’ll help you find what to read.",
    footer: "Free · 13+ · Email stays private",
    moonieVariant: "waving",
    points: ["Public @handle", "Private email", "Moonie onboarding"],
  },
};

function ShowcaseCover({
  novel,
  rotate,
  priority = false,
}: {
  novel: AuthShowcaseNovel;
  rotate: string;
  priority?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative aspect-[2/3] w-[88px] overflow-hidden rounded-[10px] sm:w-[100px]",
        "shadow-[0_16px_30px_-14px_rgba(30,20,60,0.55)] ring-1 ring-black/10",
        rotate
      )}
    >
      <CoverImage
        src={novel.coverUrl}
        alt=""
        title={novel.title}
        sizes="(min-width: 640px) 100px, 88px"
        priority={priority}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.18),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[6px] bg-black/10" />
      <div className="pointer-events-none absolute inset-y-0 left-[6px] w-px bg-white/25" />
    </div>
  );
}

export function AuthDeviceShowcase({
  className,
  variant = "login",
  novels = [],
}: {
  className?: string;
  variant?: AuthShowcaseVariant;
  novels?: AuthShowcaseNovel[];
}) {
  const copy = COPY[variant];
  const covers = novels.slice(0, 3);

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[520px] overflow-hidden rounded-[28px]",
        "border border-[#6E46C7]/12 bg-[#FFFBFF]",
        "p-6 shadow-[0_28px_60px_-28px_rgba(76,53,196,0.35)] sm:p-8",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#C89B4A]/70 to-transparent"
        aria-hidden
      />

      <div className="relative">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6E46C7]">
          {copy.eyebrow}
        </p>
        <h2 className="mt-2 max-w-sm font-serif text-3xl font-black leading-tight text-night-blue sm:text-[2.1rem]">
          {copy.heading}
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[#1A1224]/62">{copy.body}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {copy.points.map((point) => (
            <li
              key={point}
              className="rounded-full border border-[#6E46C7]/12 bg-white px-2.5 py-1 text-[11px] font-semibold text-night-blue"
            >
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mt-6 flex min-h-[220px] items-end justify-between gap-3 sm:min-h-[240px]">
        {covers.length > 0 ? (
          <div className="flex items-end gap-2 pb-2 sm:gap-3">
            {covers.map((novel, index) => (
              <ShowcaseCover
                key={novel.novelId}
                novel={novel}
                rotate={COVER_ROTATIONS[index] ?? "rotate-0"}
                priority={index === 0}
              />
            ))}
          </div>
        ) : (
          <div className="pb-2 text-xs text-[#1A1224]/45" aria-hidden>
            Covers from the catalogue
          </div>
        )}

        <div className="relative z-40 shrink-0">
          <div className="relative">
            <div
              className="absolute -left-2 -top-11 w-[min(11.5rem,calc(100%-0.5rem))] rounded-2xl bg-[#FFFBFF] px-3.5 py-2.5 shadow-[0_16px_32px_-18px_rgba(76,53,196,0.45)] ring-1 ring-[#6E46C7]/14"
            >
              <span
                className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#C89B4A] to-transparent"
                aria-hidden
              />
              <p className="font-serif text-[13px] font-semibold leading-snug text-night-blue">
                {copy.bubble}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6E46C7]">
                Moonie
              </p>
              <span
                className="absolute -bottom-1.5 right-8 size-3 rotate-45 bg-[#FFFBFF] shadow-[1px_1px_0_0_rgba(110,70,199,0.18)]"
                aria-hidden
              />
            </div>
            <MoonieMascot
              size={168}
              variant={copy.moonieVariant}
              display="hero"
              lightweight
              priority
              className="mv-float-slow drop-shadow-xl"
            />
          </div>
        </div>
      </div>

      <p className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#1A1224]/65 ring-1 ring-[#6E46C7]/12">
        <Feather className="size-3.5 text-primary" aria-hidden />
        {copy.footer}
      </p>
    </div>
  );
}
