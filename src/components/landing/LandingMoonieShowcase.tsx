import Link from "next/link";
import { Sparkles, Star } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import type { MoonieVariant } from "@/components/brand/MoonieMascot";
import {
  FloatingMoon,
  Starfield,
  TwoToneCurve,
} from "@/components/landing/LandingDecor";
import { CoverImage } from "@/components/ui/CoverImage";
import type { ReviewListItem } from "@/types/review";

interface LandingMoonieShowcaseProps {
  reviews: ReviewListItem[];
}

const PROMPTS = [
  "A revenge fantasy with a clever female lead",
  "A completed slow-burn GL romance",
  "A dark cultivation novel with strong world-building",
  "Something emotional but not tragic",
];

const USE_CASES: {
  variant: MoonieVariant;
  useCase: string;
  question: string;
}[] = [
  {
    variant: "thinking",
    useCase: "Stuck on what to read next",
    question: "I finished my favourite series and nothing feels right",
  },
  {
    variant: "recommending",
    useCase: "Chasing a specific mood",
    question: "Something cosy but still a little heartbreaking",
  },
  {
    variant: "happy",
    useCase: "Completed stories only",
    question: "A finished GL romance I can read in one weekend",
  },
];

export function LandingMoonieShowcase({ reviews }: LandingMoonieShowcaseProps) {
  const picks = reviews.slice(0, 3);

  return (
    <section className="relative overflow-hidden px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
      <TwoToneCurve pair="night-gold" shape="scoop" flip glow="gold" />
      <Starfield accents={8} />
      <FloatingMoon
        shape="crescent"
        size={160}
        color="#F6C85F"
        float="slower"
        className="absolute -left-10 top-16 opacity-35"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_80%_20%,rgba(98,70,234,0.28),transparent_55%),radial-gradient(50%_40%_at_10%_90%,rgba(246,200,95,0.1),transparent_45%)]"
        aria-hidden
      />

      <div className="relative z-[2] mx-auto max-w-[1400px]">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#F6C85F]/90">
              <Sparkles className="size-3.5" aria-hidden />
              Ask Moonie
            </span>
            <h2 className="mt-4 font-serif text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-[2.75rem]">
              Tell Moonie what you are in the mood for.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-white/65 sm:text-lg lg:mx-0">
              Describe a vibe, a trope or a mood in plain language. Moonie reads
              community reviews and finds stories that fit, then explains why each
              one made the list.
            </p>

            <div className="mt-8 flex justify-center lg:justify-start">
              <MoonieMascot
                size={200}
                variant="thinking"
                display="hero"
                className="mv-float-slow"
              />
            </div>

            <ul className="mt-8 grid gap-3 text-left sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {USE_CASES.map((story) => (
                <li
                  key={story.useCase}
                  className="mv-curve-soft border border-white/10 bg-white/[0.04] p-3.5"
                >
                  <div className="flex items-center gap-2">
                    <MoonieMascot
                      size={36}
                      variant={story.variant}
                      display="clean"
                      lightweight
                    />
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#F6C85F]/85">
                      {story.useCase}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-snug text-white/70">
                    “{story.question}”
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mv-curve-panel border border-white/10 bg-white/[0.05] p-5 shadow-2xl backdrop-blur-sm sm:p-7">
            <p className="text-xs font-bold uppercase tracking-wide text-white/45">
              Try asking
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PROMPTS.map((prompt) => (
                <Link
                  key={prompt}
                  href={`/ask-moonie?prompt=${encodeURIComponent(prompt)}`}
                  className="rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-medium text-white/85 transition hover:border-[#F6C85F]/50 hover:bg-white/10"
                >
                  {prompt}
                </Link>
              ))}
            </div>

            {picks.length > 0 ? (
              <div className="mt-6 space-y-3">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/45">
                  <MoonieMascot
                    size={22}
                    variant="recommending"
                    display="clean"
                    lightweight
                  />
                  Sample picks from the community
                </p>
                {picks.map((review) => (
                  <Link
                    key={review.id}
                    href={`/reviews/${review.id}`}
                    className="mv-curve-soft group flex items-center gap-4 bg-white/[0.03] p-3 ring-1 ring-white/10 transition hover:bg-white/[0.07]"
                  >
                    <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-white/10">
                      <CoverImage
                        src={review.coverUrl}
                        alt=""
                        title={review.novelTitle}
                        sizes="56px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#F6C85F] px-2 py-0.5 text-[11px] font-black text-[#1a1033]">
                          <Star className="size-3 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
                          {review.rating}
                        </span>
                        <span className="truncate text-[11px] font-semibold text-white/45">
                          {review.genres[0] ?? "Web novel"}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm font-bold">
                        {review.novelTitle}
                      </p>
                      <p className="line-clamp-1 text-xs text-white/55">
                        {review.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}

            <AskMoonieLink
              href="/ask-moonie"
              size="lg"
              className="mt-6 w-full font-bold"
            >
              Chat with Moonie
            </AskMoonieLink>
          </div>
        </div>
      </div>
    </section>
  );
}
