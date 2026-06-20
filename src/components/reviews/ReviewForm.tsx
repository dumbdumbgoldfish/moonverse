"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { createReviewAction } from "@/actions/review.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { LIMITS } from "@/lib/validation";
import type { NovelSelectOption } from "@/services/novel.service";

interface GenreOption {
  id: string;
  name: string;
}

interface TagOption {
  id: string;
  name: string;
}

interface ReviewFormProps {
  genres: GenreOption[];
  tags: TagOption[];
  novels: NovelSelectOption[];
}

export function ReviewForm({ genres, tags, novels }: ReviewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [novelMode, setNovelMode] = useState<"existing" | "new">(
    novels.length > 0 ? "existing" : "new"
  );
  const [selectedNovelId, setSelectedNovelId] = useState<string>(
    novels[0]?.id ?? ""
  );
  const [rating, setRating] = useState(0);
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const toggleGenre = (id: string) => {
    setSelectedGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createReviewAction({
        novelMode,
        novelId: novelMode === "existing" ? selectedNovelId : undefined,
        novelTitle:
          novelMode === "new"
            ? (formData.get("novelTitle") as string)
            : undefined,
        novelAuthor:
          novelMode === "new"
            ? (formData.get("novelAuthor") as string)
            : undefined,
        coverUrl:
          novelMode === "new" ? (formData.get("coverUrl") as string) : undefined,
        externalLink:
          novelMode === "new"
            ? (formData.get("externalLink") as string)
            : undefined,
        genreIds: novelMode === "new" ? selectedGenreIds : [],
        tagIds: novelMode === "new" ? selectedTagIds : [],
        reviewTitle: formData.get("reviewTitle") as string,
        reviewBody: formData.get("reviewBody") as string,
        rating,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (result.reviewId) {
        router.push(`/reviews/${result.reviewId}`);
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Write a Review"
        description="Share your thoughts on a web novel. Select an existing novel or add a new one."
      />

      <form
        className="space-y-10"
        onSubmit={handleSubmit}
        aria-label="Create review form"
      >
        {error && (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}

        <fieldset className="space-y-4 rounded-xl border border-border/60 bg-bg-elevated p-6">
          <legend className="px-1 text-lg font-semibold">Novel</legend>

          <div
            className="flex flex-wrap gap-2"
            role="radiogroup"
            aria-label="Novel selection mode"
          >
            <button
              type="button"
              onClick={() => setNovelMode("existing")}
              disabled={novels.length === 0 || isPending}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50",
                novelMode === "existing"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={novelMode === "existing"}
            >
              Existing novel
            </button>
            <button
              type="button"
              onClick={() => setNovelMode("new")}
              disabled={isPending}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                novelMode === "new"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={novelMode === "new"}
            >
              New novel
            </button>
          </div>

          {novelMode === "existing" ? (
            <div className="space-y-2">
              <Label htmlFor="novel-select">Select novel</Label>
              {novels.length > 0 ? (
                <Select
                  value={selectedNovelId}
                  onValueChange={(value) => {
                    if (value) setSelectedNovelId(value);
                  }}
                  disabled={isPending}
                >
                  <SelectTrigger id="novel-select" className="w-full">
                    <SelectValue placeholder="Choose a novel" />
                  </SelectTrigger>
                  <SelectContent>
                    {novels.map((novel) => (
                      <SelectItem key={novel.id} value={novel.id}>
                        {novel.title}
                        {novel.author ? ` — ${novel.author}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No novels in the database yet. Switch to &ldquo;New novel&rdquo; to
                  add one.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="novel-title">Novel title</Label>
                  <Input
                    id="novel-title"
                    name="novelTitle"
                    placeholder="e.g. Heavenly Dao Chronicles"
                    required
                    aria-required="true"
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="novel-author">Author</Label>
                  <Input
                    id="novel-author"
                    name="novelAuthor"
                    placeholder="e.g. CloudWalker"
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover-url">Cover URL</Label>
                  <Input
                    id="cover-url"
                    name="coverUrl"
                    type="url"
                    placeholder="https://…"
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="external-link">External link</Label>
                  <Input
                    id="external-link"
                    name="externalLink"
                    type="url"
                    placeholder="https://www.royalroad.com/…"
                    disabled={isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <span id="genres-label" className="text-sm font-medium">
                  Genres
                </span>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-labelledby="genres-label"
                >
                  {genres.map((genre) => (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => toggleGenre(genre.id)}
                      disabled={isPending}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        selectedGenreIds.includes(genre.id)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                      aria-pressed={selectedGenreIds.includes(genre.id)}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span id="tags-label" className="text-sm font-medium">
                  Tags
                </span>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-labelledby="tags-label"
                >
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      disabled={isPending}
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        selectedTagIds.includes(tag.id)
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                      aria-pressed={selectedTagIds.includes(tag.id)}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </fieldset>

        <fieldset className="space-y-4 rounded-xl border border-border/60 bg-bg-elevated p-6">
          <legend className="px-1 text-lg font-semibold">Your review</legend>

          <div className="space-y-2">
            <span id="rating-label" className="text-sm font-medium">
              Rating <span className="text-destructive">*</span>
            </span>
            <div
              className="flex gap-1"
              role="radiogroup"
              aria-labelledby="rating-label"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  disabled={isPending}
                  className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  role="radio"
                  aria-checked={rating === value}
                  aria-label={`${value} star${value !== 1 ? "s" : ""}`}
                >
                  <Star
                    size={24}
                    className={cn(
                      value <= rating
                        ? "fill-accent text-accent"
                        : "fill-transparent text-muted-foreground/40"
                    )}
                    aria-hidden="true"
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 self-center text-sm text-muted-foreground">
                  {rating}/5
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-title">Review title</Label>
            <Input
              id="review-title"
              name="reviewTitle"
              placeholder="Summarise your review in one line"
              required
              minLength={LIMITS.reviewTitle.min}
              maxLength={LIMITS.reviewTitle.max}
              aria-required="true"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-body">Review body</Label>
            <Textarea
              id="review-body"
              name="reviewBody"
              placeholder="Share your honest thoughts about the novel…"
              rows={10}
              required
              minLength={LIMITS.reviewBody.min}
              maxLength={LIMITS.reviewBody.max}
              aria-required="true"
              disabled={isPending}
              className="min-h-[200px] font-serif"
            />
          </div>
        </fieldset>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending || rating === 0}
            aria-disabled={isPending || rating === 0}
          >
            {isPending ? "Publishing…" : "Publish review"}
          </Button>
        </div>
      </form>
    </div>
  );
}
