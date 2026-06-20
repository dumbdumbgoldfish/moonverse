import { Suspense } from "react";
import { ReviewsBrowse } from "@/components/reviews/ReviewsBrowse";
import { auth } from "@/lib/auth";
import { getFoldersByUser } from "@/services/folder.service";
import {
  getAllReviews,
  getGenresWithReviewCounts,
} from "@/services/review.service";
import type { ReviewSort } from "@/types/review";

export const metadata = {
  title: "Browse Reviews — MoonVerse",
  description: "Discover web novel reviews from the MoonVerse community.",
};

export const dynamic = "force-dynamic";

interface ReviewsPageProps {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    tag?: string;
    sort?: string;
  }>;
}

function parseSort(value?: string): ReviewSort {
  if (value === "trending" || value === "highest-rated") return value;
  return "latest";
}

async function ReviewsBrowseContent({
  searchParams,
}: ReviewsPageProps) {
  const { q, genre, tag, sort } = await searchParams;
  const parsedSort = parseSort(sort);

  const [reviews, genres, session] = await Promise.all([
    getAllReviews({
      query: q,
      genreSlug: genre,
      tagSlug: tag,
      sort: parsedSort,
    }),
    getGenresWithReviewCounts(),
    auth(),
  ]);

  const folders = session?.user?.id
    ? await getFoldersByUser(session.user.id)
    : [];

  return (
    <ReviewsBrowse
      key={[q, genre, tag, sort].filter(Boolean).join("-") || "all"}
      reviews={reviews}
      genres={genres}
      folders={folders}
      isLoggedIn={!!session?.user?.id}
      initialQuery={q ?? ""}
      initialGenre={genre}
      initialTag={tag}
      initialSort={parsedSort}
    />
  );
}

export default function ReviewsPage(props: ReviewsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-muted-foreground">Loading reviews…</p>
        </div>
      }
    >
      <ReviewsBrowseContent {...props} />
    </Suspense>
  );
}
