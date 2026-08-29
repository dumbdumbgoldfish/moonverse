import Link from "next/link";
import { BookOpen, PencilLine, Users } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { Button } from "@/components/ui/button";
import { moonieVariantFor } from "@/lib/moonie/variants";
import type { HomeFeedTab } from "@/lib/feed";

interface FeedEmptyStateProps {
  feed: HomeFeedTab;
  followingCount: number;
}

export function FeedEmptyState({ feed, followingCount }: FeedEmptyStateProps) {
  if (feed === "following" && followingCount === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-violet-200 bg-white px-6 py-10 text-center">
        <Users className="mx-auto size-8 text-primary" aria-hidden />
        <h2 className="mt-3 text-lg font-bold text-night-blue">
          You are not following any reviewers yet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Follow readers you trust and their reviews will show up here.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button
            size="sm"
            className="rounded-full"
            render={<Link href="/community?feed=trending" />}
          >
            Browse trending reviews
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            render={<Link href="/search" />}
          >
            Discover reviewers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-violet-200 bg-white px-6 py-10 text-center">
      <div className="mx-auto w-fit">
        <MoonieMascot
          variant={moonieVariantFor("emptyState")}
          size={72}
          display="badge"
          lightweight
        />
      </div>
      <h2 className="mt-3 text-lg font-bold text-night-blue">No reviews here yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        {feed === "for-you"
          ? "Recommendations improve after you like, save, and follow. Meanwhile, try trending or write your first review."
          : "Be the first to share something the community can discuss."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button size="sm" className="rounded-full" render={<Link href="/reviews/new" />}>
          <PencilLine className="size-4" aria-hidden />
          Write a review
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          render={<Link href="/search" />}
        >
          <BookOpen className="size-4" aria-hidden />
          Browse genres
        </Button>
      </div>
    </div>
  );
}
