import Link from "next/link";
import { PenLine, Users } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { ReviewMoonieAskButton } from "@/components/reviews/detail/ReviewMoonieAskButton";
import { ReviewSignInButton } from "@/components/reviews/detail/ReviewGuestAuthButtons";
import { DETAIL_MODULE_LABEL, DETAIL_NOVEL_BTN } from "@/lib/reviews/detail-surface";
import { cn } from "@/lib/utils";
import type { ReviewDetail, ReviewListItem } from "@/types/review";

interface ReviewAsideExtrasProps {
  review: ReviewDetail;
  otherReviews: ReviewListItem[];
  isLoggedIn: boolean;
  className?: string;
}

export function ReviewAsideExtras({
  review,
  otherReviews,
  isLoggedIn,
  className,
}: ReviewAsideExtrasProps) {
  const writeHref = `/reviews/new?novelId=${review.novelId}`;
  const perspectives = otherReviews.slice(0, 2);

  return (
    <div className={cn("space-y-5", className)}>
      <section aria-labelledby="aside-other-takes-heading">
        <h2 id="aside-other-takes-heading" className={DETAIL_MODULE_LABEL}>
          <Users className="size-3.5" aria-hidden />
          More takes on this title
        </h2>

        {perspectives.length > 0 ? (
          <ul className="mt-2.5 space-y-2">
            {perspectives.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/reviews/${item.id}`}
                  className="group flex gap-2.5 rounded-lg border border-[#1a1033]/6 bg-[#FFFBFF] px-2.5 py-2 transition hover:border-[#6E46C7]/20 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]"
                >
                  <span className="inline-flex shrink-0 items-center gap-1 pt-0.5 text-xs font-bold text-[#C89B4A]">
                    {item.rating.toFixed(1)}★
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
          <p className="mt-2.5 text-sm leading-relaxed text-[#5a4d72]">
            No other reviews yet. Be the next reader to compare notes on this title.
          </p>
        )}

        {isLoggedIn ? (
          <Link
            href={writeHref}
            className={cn(DETAIL_NOVEL_BTN, "mt-3 h-9 w-full px-3 text-xs")}
          >
            <PenLine className="size-3.5" aria-hidden />
            Write your take
          </Link>
        ) : (
          <ReviewSignInButton
            callbackUrl={writeHref}
            className={cn(DETAIL_NOVEL_BTN, "mt-3 h-9 w-full px-3 text-xs")}
          >
            <PenLine className="size-3.5" aria-hidden />
            Write your take
          </ReviewSignInButton>
        )}
      </section>

      <section
        aria-labelledby="aside-moonie-heading"
        className="overflow-hidden rounded-xl bg-[var(--mv-deep-plum,#241630)] p-3.5 text-white"
      >
        <div className="flex items-center gap-2.5">
          <MoonieMascot variant="waving" size={44} display="clean" lightweight />
          <div className="min-w-0 flex-1">
            <h2 id="aside-moonie-heading" className="text-sm font-semibold text-white">
              Need a similar read?
            </h2>
            <p className="mt-0.5 text-xs leading-relaxed text-[#d8cfe8]">
              Ask Moonie for titles with a similar vibe.
            </p>
          </div>
        </div>
        <ReviewMoonieAskButton
          novelTitle={review.novelTitle}
          tags={review.tags}
          isLoggedIn={isLoggedIn}
          variant="compact"
          tone="dark"
          label="Get recommendations"
          className="mt-3 w-full justify-center"
        />
      </section>
    </div>
  );
}
