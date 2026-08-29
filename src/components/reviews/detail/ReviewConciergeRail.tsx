import Link from "next/link";
import { BookOpen, Bookmark, Sparkles, Star, Users } from "lucide-react";
import { ReviewMoonieAskButton } from "@/components/reviews/detail/ReviewMoonieAskButton";
import {
  ReviewGuestAuthButtons,
  ReviewSignInButton,
} from "@/components/reviews/detail/ReviewGuestAuthButtons";
import { AnimatedRatingBreakdown } from "@/components/reviews/detail/AnimatedRatingBreakdown";
import { CoverImage } from "@/components/ui/CoverImage";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { DETAIL_MODULE_LABEL, DETAIL_NOVEL_BTN, DETAIL_SIDEBAR } from "@/lib/reviews/detail-surface";
import { cn } from "@/lib/utils";
import type { NovelReviewStats } from "@/services/review.service";
import type { ReadingLinkItem } from "@/types/reading-link";
import type { ReviewDetail, ReviewListItem } from "@/types/review";

interface ReviewConciergeRailProps {
  review: ReviewDetail;
  stats: NovelReviewStats;
  readingLinks: ReadingLinkItem[];
  relatedReviews: ReviewListItem[];
  isLoggedIn?: boolean;
  novelSynopsis?: string | null;
  novelPublicationStatus?: string | null;
  novelChapterCount?: number | null;
  className?: string;
}

function Module({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Sparkles;
  children: React.ReactNode;
}) {
  return (
    <section className="px-3.5 py-3.5">
      <h2 className={DETAIL_MODULE_LABEL}>
        <Icon className="size-3.5" aria-hidden />
        {title}
      </h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

export function ReviewConciergeRail({
  review,
  stats,
  readingLinks,
  relatedReviews,
  isLoggedIn = false,
  novelSynopsis,
  novelPublicationStatus,
  novelChapterCount,
  className,
}: ReviewConciergeRailProps) {
  const perspectives = relatedReviews
    .filter((item) => item.id !== review.id)
    .slice(0, 4);
  const officialLink = readingLinks[0];
  const snapshotMeta = [
    novelPublicationStatus,
    novelChapterCount ? `${novelChapterCount} chapters` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const writeHref = `/reviews/new?novelId=${review.novelId}`;
  const reviewHref = `/reviews/${review.id}`;

  return (
    <aside
      className={cn(
        DETAIL_SIDEBAR,
        "lg:sticky lg:top-24 lg:self-start",
        className,
      )}
    >
      <div className="divide-y divide-[#1a1033]/6">
        <Module title="Novel snapshot" icon={BookOpen}>
          <Link
            href={`/novels/${review.novelId}`}
            className="group flex gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
          >
            <span className="relative aspect-[2/3] w-[3.5rem] shrink-0 overflow-hidden rounded-md bg-[#F4ECF8] ring-1 ring-[#1a1033]/8">
              <CoverImage
                src={review.coverUrl}
                alt=""
                title={review.novelTitle}
                sizes="56px"
              />
            </span>
            <span className="min-w-0">
              <span className="block line-clamp-2 font-heading text-[15px] font-semibold text-[#1a1033] group-hover:text-[#6E46C7]">
                {review.novelTitle}
              </span>
              <span className="mt-0.5 block text-sm text-[#5a4d72]">
                by {review.novelAuthor}
              </span>
              {snapshotMeta ? (
                <span className="mt-1 block text-xs font-semibold text-[#7a7284]">
                  {snapshotMeta}
                </span>
              ) : null}
            </span>
          </Link>
          {novelSynopsis ? (
            <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-[#5a4d72]">
              {novelSynopsis}
            </p>
          ) : null}
          {officialLink ? (
            <p className="mt-2 text-xs text-[#7a7284]">
              Read at{" "}
              <a
                href={officialLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#6E46C7] hover:underline"
              >
                {officialLink.label}
              </a>
            </p>
          ) : null}
          <Link href={`/novels/${review.novelId}`} className={cn(DETAIL_NOVEL_BTN, "mt-3 h-9 px-3.5 text-xs")}>
            Open edition
          </Link>
        </Module>

        {stats.total > 0 ? (
          <Module title="Community insight" icon={Star}>
            <AnimatedRatingBreakdown stats={stats} />
            <p className="mt-3 text-sm leading-relaxed text-[#5a4d72]">
              {stats.total} {stats.total === 1 ? "reader" : "readers"} have weighed in
              on this title. Compare takes, then save the ones that match your taste.
            </p>
          </Module>
        ) : null}

        <Module title="Reviews of this title" icon={Users}>
          {perspectives.length > 0 ? (
            <ul className="space-y-2.5">
              {perspectives.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/reviews/${item.id}`}
                    className="group flex gap-2.5 rounded-lg border border-[#1a1033]/6 bg-[#FFFBFF] px-2.5 py-2 transition hover:border-[#6E46C7]/20 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
                  >
                    <span className="inline-flex shrink-0 items-center gap-1 pt-0.5 text-xs font-bold text-[#C89B4A]">
                      <Star className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
                      {item.rating.toFixed(1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block line-clamp-2 text-sm font-semibold leading-snug text-[#1a1033] group-hover:text-[#6E46C7]">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[#7a7284]">
                        @{item.reviewerUsername}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-relaxed text-[#5a4d72]">
              No other reviews of this novel yet. Yours could be the comparison readers need.
            </p>
          )}
          {isLoggedIn ? (
            <Link
              href={writeHref}
              className={cn(DETAIL_NOVEL_BTN, "mt-3 h-9 px-3.5 text-xs")}
            >
              Write your take
            </Link>
          ) : (
            <ReviewSignInButton
              callbackUrl={writeHref}
              className={cn(DETAIL_NOVEL_BTN, "mt-3 h-9 px-3.5 text-xs")}
            >
              Write your take
            </ReviewSignInButton>
          )}
        </Module>

        <section className="relative overflow-hidden bg-[var(--mv-deep-plum,#241630)] px-3.5 py-3.5 text-white">
          <div className="relative flex items-center gap-2.5">
            <MoonieMascot variant="waving" size={48} display="clean" lightweight />
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C89B4A]">
                <Sparkles className="size-3.5" aria-hidden />
                Ask Moonie
              </p>
              <p className="mt-1 text-[13px] font-semibold leading-snug">
                Need a similar read?
              </p>
            </div>
          </div>
          <ReviewMoonieAskButton
            novelTitle={review.novelTitle}
            tags={review.tags}
            isLoggedIn={isLoggedIn}
            tone="dark"
            variant="compact"
            className="relative mt-3 w-full"
            label="Get recommendations"
          />
        </section>

        <section className="px-3.5 py-3.5">
          <h2 className={DETAIL_MODULE_LABEL}>
            <Bookmark className="size-3.5" aria-hidden />
            Get more from MoonVerse
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#5a4d72]">
            <li>Save favourites to revisit later.</li>
            <li>Follow reviewers whose taste matches yours.</li>
            <li>Unlock personalised picks after you sign in.</li>
          </ul>
          {!isLoggedIn ? (
            <ReviewGuestAuthButtons callbackUrl={reviewHref} className="mt-3" />
          ) : (
            <Link href="/folders" className={cn(DETAIL_NOVEL_BTN, "mt-3 h-9 px-3.5 text-xs")}>
              Open your shelves
            </Link>
          )}
        </section>
      </div>
    </aside>
  );
}
