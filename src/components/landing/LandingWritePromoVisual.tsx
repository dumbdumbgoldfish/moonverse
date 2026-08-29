import Link from "next/link";
import { BookOpen, Heart, MessageCircle, PenLine, Star, UserRound } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { CoverImage } from "@/components/ui/CoverImage";
import {
  displayReviewTitle,
  reviewQuote,
} from "@/lib/landing-reviews";
import { cn } from "@/lib/utils";
import type { ReviewListItem } from "@/types/review";

export const WRITE_STEPS = [
  {
    n: "01",
    href: "/register",
    icon: UserRound,
    title: "Create your account",
    copy: "Join free and start a reviewer profile the catalogue can remember.",
  },
  {
    n: "02",
    href: "/browse",
    icon: BookOpen,
    title: "Choose a web novel",
    copy: "Pick a title already on the MoonVerse shelf. We do not host chapters.",
  },
  {
    n: "03",
    href: "/write",
    icon: PenLine,
    title: "Publish your review",
    copy: "Share pacing, tropes and payoff. Moonie never writes this for you.",
  },
] as const;

function DeskSlip({ review }: { review: ReviewListItem }) {
  const quote = reviewQuote(review);

  return (
    <Link
      href={`/reviews/${review.id}`}
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-violet-100/80 bg-white px-3 py-2.5",
        "transition duration-200 hover:border-[#C89B4A]/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B4A]",
        "motion-reduce:transition-none"
      )}
    >
      <div className="relative mt-0.5 h-[4.25rem] w-[2.85rem] shrink-0 overflow-hidden rounded-lg ring-1 ring-violet-100 [&_p]:invisible">
        <CoverImage
          src={review.coverUrl}
          alt=""
          title={review.novelTitle}
          author={review.novelAuthor}
          themeSeed={review.novelId}
          sizes="46px"
          compactFallback
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-[0.12em] text-violet-600">
            {review.novelTitle}
          </p>
          <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold text-[#C89B4A]">
            <Star className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
            {review.rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-1 line-clamp-1 font-serif text-[0.95rem] font-bold leading-snug text-[#1a1033]">
          {displayReviewTitle(review.title)}
        </p>
        <p className="mt-1 line-clamp-2 text-sm leading-snug text-slate-600">
          {review.containsSpoilers
            ? "Marked as containing spoilers."
            : quote}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3.5" aria-hidden />
            {review.likeCount}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" aria-hidden />
            {review.commentCount}
          </span>
          <span className="truncate">
            {review.reviewerName}
            {review.reviewerUsername ? ` · @${review.reviewerUsername}` : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function LandingWritePromoVisual({
  reviews = [],
}: {
  reviews?: ReviewListItem[];
}) {
  const slips = reviews.slice(0, 3);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-100/80 bg-gradient-to-b from-[#fffaf0] via-white to-[#f4ecf8] p-4 shadow-[0_16px_32px_-24px_rgba(76,29,149,0.4)] sm:p-5">
      <div className="relative flex items-center gap-3.5">
        <MoonieMascot
          size={108}
          variant="excited"
          display="clean"
          lightweight
          className="shrink-0 animate-moonie-float motion-reduce:animate-none"
        />
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8f711e]">
            On the writing desk
          </p>
          <p className="mt-1 font-serif text-lg font-bold text-[#1a1033]">
            Notes already in the stacks
          </p>
          <p className="mt-1 text-sm leading-snug text-slate-600">
            Live reviews. Moonie ranks titles. Moonie never writes these.
          </p>
        </div>
      </div>

      <div className="relative mt-4 grid gap-2.5">
        {slips.length > 0 ? (
          slips.map((review) => <DeskSlip key={review.id} review={review} />)
        ) : (
          <p className="rounded-xl border border-dashed border-violet-200 bg-white/70 px-4 py-5 text-sm text-slate-500">
            Your review will sit here once the shelf has a note.
          </p>
        )}
      </div>
    </div>
  );
}
