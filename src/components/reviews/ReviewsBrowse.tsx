"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FeedLayout } from "@/components/layout/FeedLayout";
import { GenreSidebar } from "@/components/reviews/GenreSidebar";
import { FeedSidebar } from "@/components/reviews/FeedSidebar";
import { SocialReviewCard } from "@/components/reviews/SocialReviewCard";
import type { FolderListItem } from "@/types/folder";
import type { GenreOption, ReviewListItem, ReviewSort } from "@/types/review";
import { cn } from "@/lib/utils";

interface ReviewsBrowseProps {
  reviews: ReviewListItem[];
  genres: GenreOption[];
  folders?: FolderListItem[];
  isLoggedIn?: boolean;
  initialQuery?: string;
  initialGenre?: string;
  initialTag?: string;
  initialSort?: ReviewSort;
}

export function ReviewsBrowse({
  reviews,
  genres,
  folders = [],
  isLoggedIn = false,
  initialQuery = "",
  initialGenre,
  initialTag,
  initialSort = "latest",
}: ReviewsBrowseProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(initialQuery);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== initialQuery) {
        updateParams({ q: search || null });
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, initialQuery, updateParams]);

  const selectedGenreSlug = initialGenre ?? null;
  const activeGenreName =
    genres.find((g) => g.slug === selectedGenreSlug)?.name ?? null;

  return (
    <FeedLayout
      leftSidebar={
        <GenreSidebar
          genres={genres}
          selectedGenreSlug={selectedGenreSlug}
          selectedTagSlug={initialTag ?? null}
          onGenreSelect={(slug) => updateParams({ genre: slug, tag: null })}
          onTagSelect={(slug) => updateParams({ tag: slug, genre: null })}
        />
      }
      rightSidebar={
        <FeedSidebar folders={folders} isLoggedIn={isLoggedIn} />
      }
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Community Reviews
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Honest reviews from readers like you. Filter, search and join the conversation.
        </p>
      </div>

      <div className="mb-6 space-y-4 rounded-2xl border border-border/60 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search reviews, novels, authors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border-border/60 bg-bg-warm pl-9"
            aria-label="Search reviews"
          />
        </div>

        {/* Mobile genre pills */}
        <div className="flex flex-wrap gap-2 lg:hidden" role="group" aria-label="Filter by genre">
          <button
            type="button"
            onClick={() => updateParams({ genre: null })}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              selectedGenreSlug === null
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            )}
          >
            All
          </button>
          {genres.map((genre) => (
            <button
              key={genre.id}
              type="button"
              onClick={() =>
                updateParams({
                  genre: selectedGenreSlug === genre.slug ? null : genre.slug,
                })
              }
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                selectedGenreSlug === genre.slug
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              {genre.name}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            {activeGenreName && (
              <>
                {" "}
                in{" "}
                <Badge variant="secondary" className="align-middle">
                  {activeGenreName}
                </Badge>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="sort-reviews" className="sr-only">
              Sort by
            </label>
            <Select
              value={initialSort}
              onValueChange={(value) =>
                updateParams({ sort: value as ReviewSort })
              }
            >
              <SelectTrigger id="sort-reviews" className="w-[140px] rounded-xl" aria-label="Sort reviews">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="highest-rated">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <SocialReviewCard key={review.id} review={review} variant="feed" />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/60 bg-white py-16 text-center">
          <p className="text-lg font-medium text-foreground">No reviews found</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </FeedLayout>
  );
}
