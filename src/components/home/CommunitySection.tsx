import Link from "next/link";
import { MessageCircle, PenLine, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialReviewCard } from "@/components/reviews/SocialReviewCard";
import type { CommunityStats, FeaturedReviewer } from "@/services/community.service";
import type { ReviewListItem } from "@/types/review";

const statIcons = {
  reviews: PenLine,
  users: Users,
  novels: MessageCircle,
};

interface CommunitySectionProps {
  reviews?: ReviewListItem[];
  stats?: CommunityStats;
  featuredReviewers?: FeaturedReviewer[];
}

export function CommunitySection({
  reviews = [],
  stats,
  featuredReviewers = [],
}: CommunitySectionProps) {
  const displayStats = [
    {
      key: "reviews" as const,
      label: "Reviews shared",
      value: stats?.totalReviews ?? reviews.length,
    },
    {
      key: "users" as const,
      label: "Active readers",
      value: stats?.totalUsers ?? 0,
    },
    {
      key: "novels" as const,
      label: "Novels reviewed",
      value: stats?.totalNovels ?? 0,
    },
  ];

  return (
    <section className="py-16 sm:py-20" aria-labelledby="community-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:text-left">
          <h2
            id="community-heading"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Built by readers, for readers
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Real reviews and profiles from the MoonVerse community.
          </p>
        </div>

        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          {displayStats.map((stat) => {
            const Icon = statIcons[stat.key];
            return (
              <div
                key={stat.key}
                className="rounded-2xl border border-border/60 bg-bg-elevated p-5 text-center sm:text-left"
              >
                <Icon className="mx-auto size-5 text-primary sm:mx-0" aria-hidden />
                <p className="mt-3 text-2xl font-bold tabular-nums">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {featuredReviewers.length > 0 && (
          <div className="mb-10">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Featured reviewers
            </h3>
            <ul className="flex flex-wrap gap-3">
              {featuredReviewers.map((reviewer) => (
                <li key={reviewer.username}>
                  <Link
                    href={`/users/${reviewer.username}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white px-3 py-1.5 text-sm font-semibold hover:border-primary/40"
                  >
                    <span className="flex size-7 items-center justify-center rounded-full bg-moon-purple-soft text-[10px] font-bold text-primary">
                      {reviewer.avatar}
                    </span>
                    {reviewer.displayName}
                    <span className="text-xs font-normal text-muted-foreground">
                      {reviewer.reviewCount} reviews
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {reviews.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.slice(0, 6).map((review) => (
              <SocialReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Button
            className="mv-nav-signup rounded-full border-0 px-6 font-bold text-white"
            render={<Link href="/discover" />}
          >
            Explore reviews
          </Button>
        </div>
      </div>
    </section>
  );
}
