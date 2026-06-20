import Link from "next/link";
import { MessageCircle, PenLine, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialReviewCard } from "@/components/reviews/SocialReviewCard";
import { mockCommunityStats } from "@/lib/mock-data";
import type { ReviewListItem } from "@/types/review";

const statIcons = {
  reviews: PenLine,
  users: Users,
  novels: MessageCircle,
};

interface CommunitySectionProps {
  reviews?: ReviewListItem[];
}

export function CommunitySection({ reviews = [] }: CommunitySectionProps) {
  const stats = [
    {
      key: "reviews" as const,
      label: "Reviews shared",
      value: mockCommunityStats.totalReviews,
    },
    {
      key: "users" as const,
      label: "Active readers",
      value: mockCommunityStats.totalUsers,
    },
    {
      key: "novels" as const,
      label: "Novels reviewed",
      value: mockCommunityStats.totalNovels,
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
            Community Reviews
          </h2>
          <p className="mt-2 text-muted-foreground">
            See what readers are sharing — like, comment, and save your favourites.
          </p>
        </div>

        {reviews.length > 0 && (
          <div className="mb-12 grid gap-4 lg:grid-cols-3">
            {reviews.map((review) => (
              <SocialReviewCard key={review.id} review={review} variant="compact" />
            ))}
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-lg leading-relaxed text-muted-foreground">
              MoonVerse is built by readers, for readers. Write reviews, engage
              with comments and likes, and organise your favourites into personal
              folders.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4">
              {stats.map((stat) => {
                const Icon = statIcons[stat.key];
                return (
                  <div key={stat.key} className="rounded-2xl bg-bg-warm p-4 text-center sm:text-left">
                    <Icon
                      className="mx-auto mb-2 text-primary sm:mx-0"
                      size={20}
                      aria-hidden="true"
                    />
                    <p className="text-2xl font-bold text-foreground">
                      {stat.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <Button className="mt-8" size="lg" render={<Link href="/register" />}>
              Join the community
            </Button>
          </div>

          <div className="rounded-2xl border border-border/60 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-semibold">Featured reviewers</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Some of our most active community members
            </p>

            <ul className="mt-6 space-y-4">
              {mockCommunityStats.featuredReviewers.map((reviewer) => {
                const username = reviewer.name === "StarReader"
                  ? "starreader"
                  : reviewer.name === "QuestLog"
                    ? "questlog"
                    : "cosmoreads";
                return (
                  <li key={reviewer.name}>
                    <Link
                      href={`/users/${username}`}
                      className="flex items-center justify-between rounded-xl p-2 transition-colors hover:bg-muted"
                    >
                      <span className="font-medium">{reviewer.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {reviewer.reviewCount} reviews
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
