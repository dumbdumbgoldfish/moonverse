import Link from "next/link";
import { Star } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { PaperAtmosphere } from "@/components/landing/LandingDecor";
import { CoverImage } from "@/components/ui/CoverImage";
import { MOONIE_QUICK_PROMPTS } from "@/lib/moonie/constants";
import { moonieEntryHref } from "@/lib/moonie/open-moonie";
import {
  pickLandingCommunityReviews,
  pickLandingHeroReviews,
} from "@/lib/landing-reviews";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";

interface LandingHowItWorksProps {
  reviews?: ReviewListItem[];
}

function CoverFan({ reviews }: { reviews: ReviewListItem[] }) {
  const covers = reviews.slice(0, 3);
  if (covers.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#2a1840]/8 via-[#f4ecf8] to-[#fff6e8] px-3 pb-3 pt-2.5">
      <div className="relative mx-auto h-[11rem] w-full max-w-[16rem]" aria-hidden>
        {covers.map((review, index) => (
          <div
            key={review.novelId}
            className="absolute top-2 aspect-[2/3] w-[5.25rem] overflow-hidden rounded-xl border-2 border-white shadow-[0_16px_28px_-12px_rgba(26,18,36,0.55)] [&_p]:invisible"
            style={{
              left: `calc(50% + ${(index - 1) * 2.35}rem)`,
              transform: `translateX(-50%) rotate(${(index - 1) * 8}deg)`,
              zIndex: index === 1 ? 3 : index + 1,
            }}
          >
            <CoverImage
              src={review.coverUrl}
              alt=""
              title={review.novelTitle}
              author={review.novelAuthor}
              themeSeed={review.novelId}
              sizes="120px"
              compactFallback
            />
          </div>
        ))}
        <div className="pointer-events-none absolute inset-x-4 bottom-0 h-10 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(200,155,74,0.35),transparent_70%)] blur-md" />
      </div>
    </div>
  );
}

function ReviewPreview({ review }: { review: ReviewListItem }) {
  const quote = (review.excerpt || review.body).trim();

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[#C89B4A]/20 bg-gradient-to-br from-[#fffaf0] to-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
      aria-hidden
    >
      <span className="pointer-events-none absolute -left-1 -top-2 font-serif text-5xl leading-none text-[#C89B4A]/25">
        “
      </span>
      <p className="relative text-[11px] font-bold uppercase tracking-[0.14em] text-violet-600">
        {review.novelTitle}
      </p>
      <p className="relative mt-2 line-clamp-3 font-serif text-[0.95rem] leading-snug text-[#1a1033]">
        {quote}
      </p>
      <div className="relative mt-3 flex items-center justify-between gap-2 border-t border-[#C89B4A]/15 pt-2.5">
        <span className="truncate text-xs font-semibold text-slate-500">
          {review.reviewerName}
        </span>
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#C89B4A]">
          <Star className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
          {review.rating.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function MooniePreview() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#1a1224] px-3 pb-3 pt-2 text-white shadow-[0_14px_28px_-18px_rgba(26,18,36,0.7)]"
      aria-hidden
    >
      <div
        className="pointer-events-none absolute -right-6 -top-8 size-28 rounded-full bg-[#6E46C7]/40 blur-2xl"
      />
      <div className="relative flex items-end gap-2.5">
        <MoonieMascot
          size={96}
          variant="thinking"
          display="clean"
          lightweight
          className="shrink-0"
        />
        <p className="mb-3 line-clamp-3 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm leading-snug text-white/85">
          {MOONIE_QUICK_PROMPTS[0]}
        </p>
      </div>
    </div>
  );
}

export function LandingHowItWorks({ reviews = [] }: LandingHowItWorksProps) {
  const covers = pickLandingHeroReviews(reviews, 3);
  const review = pickLandingCommunityReviews(reviews, 1, {
    catalogueOnly: true,
  })[0];

  const steps = [
    {
      n: "01",
      href: "/search",
      title: "Browse real covers",
      copy: "Open titles already in the catalogue, with ratings from MoonVerse readers.",
      tone: "paper" as const,
      visual: covers.length > 0 ? <CoverFan reviews={covers} /> : null,
    },
    {
      n: "02",
      href: review ? `/reviews/${review.id}` : "/search",
      title: "Read a human review",
      copy: "Skim pacing, tropes and payoff before you commit a weekend.",
      tone: "paper" as const,
      visual: review ? <ReviewPreview review={review} /> : null,
    },
    {
      n: "03",
      href: moonieEntryHref(MOONIE_QUICK_PROMPTS[0]),
      title: "Ask Moonie by mood",
      copy: "Name a trope or feeling. Moonie only ranks novels that are already here.",
      tone: "night" as const,
      visual: <MooniePreview />,
    },
  ];

  return (
    <section className="mv-land">
      <PaperAtmosphere tone="cream" />
      <div
        className="pointer-events-none absolute left-1/2 top-8 h-28 w-[60%] -translate-x-1/2 rounded-[100%] bg-[#C89B4A]/10 blur-3xl"
        aria-hidden
      />

      <div className="mv-land-shell">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8f711e]">
            The loop
          </p>
          <h2 className="mv-land-title text-[#1a1033]">
            How MoonVerse works
          </h2>
          <p className="mv-land-copy mx-auto text-slate-600">
            Browse a cover. Read a person. Ask Moonie. That is the whole night.
          </p>
        </div>

        <ol className="relative mt-8 grid gap-4 lg:grid-cols-3">
          <div
            className="pointer-events-none absolute left-[16%] right-[16%] top-[5.25rem] hidden h-px bg-gradient-to-r from-transparent via-[#C89B4A]/55 to-transparent lg:block"
            aria-hidden
          />
          {steps.map((step) => (
            <li key={step.n}>
              <Link
                href={step.href}
                className={cn(
                  "group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] p-5 pt-6",
                  "transition duration-300 hover:-translate-y-0.5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  "motion-reduce:transform-none motion-reduce:transition-none",
                  step.tone === "night"
                    ? "border border-[#1a1224]/40 bg-gradient-to-b from-[#2a1840] to-[#1a1224] text-white shadow-[0_28px_56px_-28px_rgba(26,18,36,0.75)] hover:border-[#C89B4A]/40"
                    : "border border-violet-100/90 bg-white/90 shadow-[0_22px_50px_-30px_rgba(76,29,149,0.45)] hover:border-violet-200 hover:shadow-[0_28px_56px_-28px_rgba(98,70,234,0.4)]"
                )}
              >
                <span
                  className={cn(
                    "absolute inset-x-8 top-0 h-1 rounded-b-full",
                    step.tone === "night"
                      ? "bg-gradient-to-r from-[#6E46C7] via-[#C89B4A] to-[#6E46C7]"
                      : "bg-gradient-to-r from-violet-400 via-[#C89B4A] to-violet-400"
                  )}
                  aria-hidden
                />
                <span className="relative z-[1] mx-auto flex size-11 items-center justify-center rounded-full border-2 border-[#C89B4A]/50 bg-[#FFFBFF] font-serif text-base font-black text-[#C89B4A] shadow-[0_8px_18px_-10px_rgba(200,155,74,0.8)]">
                  {step.n}
                </span>
                <div className="mt-4">{step.visual}</div>
                <h3
                  className={cn(
                    "mt-4 font-serif text-xl font-bold",
                    step.tone === "night"
                      ? "text-white group-hover:text-[#E6D2A3]"
                      : "text-[#1a1033] group-hover:text-primary"
                  )}
                >
                  {step.title}
                </h3>
                <p
                  className={cn(
                    "mt-2 text-[0.95rem] leading-relaxed",
                    step.tone === "night" ? "text-white/65" : "text-slate-600"
                  )}
                >
                  {step.copy}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
