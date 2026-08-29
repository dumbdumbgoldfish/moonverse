import Link from "next/link";
import { BookOpen, ExternalLink, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewDetail, ReviewListItem } from "@/types/review";
import type { ReadingLinkItem } from "@/types/reading-link";
import type { NovelReviewStats } from "@/services/review.service";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { CoverImage } from "@/components/ui/CoverImage";

interface ReviewSidebarProps {
  review: ReviewDetail;
  stats: NovelReviewStats;
  readingLinks: ReadingLinkItem[];
  trending: ReviewListItem[];
  className?: string;
}

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-violet-100 bg-white/90 p-5 shadow-sm">
      <h2 className="text-xs font-black uppercase tracking-wide text-primary">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function ReviewSidebar({
  review,
  stats,
  readingLinks,
  trending,
  className,
}: ReviewSidebarProps) {
  const officialLinks = readingLinks.slice(0, 4);
  const trendingPicks = trending
    .filter((r) => r.id !== review.id)
    .slice(0, 4);

  return (
    <aside className={cn("space-y-5 lg:sticky lg:top-24 lg:self-start", className)}>
      <SidebarCard title="About this novel">
        <Link
          href={`/novels/${review.novelId}`}
          className="group flex gap-3 focus-visible:outline-none"
        >
          <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-lg bg-violet-100 shadow-sm">
            <CoverImage
              src={review.coverUrl}
              alt={`Cover of ${review.novelTitle}`}
              title={review.novelTitle}
              sizes="64px"
            />
          </div>
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-bold text-night-blue transition-colors group-hover:text-primary">
              {review.novelTitle}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              by {review.novelAuthor}
            </p>
            {stats.total > 0 && (
              <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-[#8f711e]">
                <Star className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
                {stats.average.toFixed(1)}
                <span className="font-medium text-muted-foreground">
                  · {stats.total} {stats.total === 1 ? "review" : "reviews"}
                </span>
              </p>
            )}
          </div>
        </Link>

        {review.genres.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {review.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-md bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700"
              >
                {genre}
              </span>
            ))}
          </div>
        )}
      </SidebarCard>

      {officialLinks.length > 0 && (
        <SidebarCard title="Where to read">
          <ul className="space-y-2">
            {officialLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-violet-100 bg-white px-3 py-2 text-sm font-semibold text-night-blue transition-colors hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="inline-flex items-center gap-2">
                    <BookOpen className="size-4 text-primary" aria-hidden />
                    {link.label}
                  </span>
                  <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </SidebarCard>
      )}

      {trendingPicks.length > 0 && (
        <SidebarCard title="Trending reviews">
          <ul className="space-y-3">
            {trendingPicks.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/reviews/${item.id}`}
                  className="group flex items-start gap-2 focus-visible:outline-none"
                >
                  <span className="mt-0.5 inline-flex items-center gap-0.5 text-[#8f711e]">
                    <Star className="size-3.5 fill-[var(--mv-gold)] text-[var(--mv-gold)]" aria-hidden />
                    <span className="text-xs font-bold">{item.rating.toFixed(1)}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="line-clamp-1 text-sm font-semibold text-night-blue transition-colors group-hover:text-primary">
                      {item.novelTitle}
                    </span>
                    <span className="line-clamp-1 text-xs text-muted-foreground">
                      {item.title}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <CatalogLink href="/discover" size="compact" className="mt-3">
            Browse Search
          </CatalogLink>
        </SidebarCard>
      )}
    </aside>
  );
}
