import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/reviews/StarRating";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { getNovelById, getReviewsByNovelId } from "@/services/novel.service";

export const dynamic = "force-dynamic";

interface NovelDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: NovelDetailPageProps) {
  const { id } = await params;
  const novel = await getNovelById(id);
  if (!novel) return { title: "Novel not found — MoonVerse" };
  return {
    title: `${novel.title} — MoonVerse`,
    description: `Read ${novel.reviewCount} community reviews for ${novel.title}.`,
  };
}

export default async function NovelDetailPage({ params }: NovelDetailPageProps) {
  const { id } = await params;
  const novel = await getNovelById(id);

  if (!novel) {
    notFound();
  }

  const reviews = await getReviewsByNovelId(id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-8 border-b border-border/60 pb-10 sm:flex-row">
        <div className="relative mx-auto h-[280px] w-[180px] shrink-0 overflow-hidden rounded-lg shadow-md sm:mx-0">
          <Image
            src={novel.coverUrl}
            alt={`Cover of ${novel.title}`}
            fill
            className="object-cover"
            sizes="180px"
            priority
          />
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <PageHeader
            title={novel.title}
            description={
              novel.author ? `by ${novel.author}` : "Author unknown"
            }
          />

          {novel.averageRating !== null && (
            <div className="mb-4 flex justify-center sm:justify-start">
              <StarRating
                rating={Math.round(novel.averageRating)}
                size="md"
              />
              <span className="ml-2 self-center text-sm text-muted-foreground">
                ({novel.reviewCount} review{novel.reviewCount !== 1 ? "s" : ""})
              </span>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            {novel.genres.map((genre) => (
              <Badge key={genre} variant="secondary">
                {genre}
              </Badge>
            ))}
          </div>

          {novel.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {novel.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {novel.externalLink && (
            <a
              href={novel.externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
            >
              Read the novel
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          )}
        </div>
      </header>

      <section className="mt-10" aria-labelledby="novel-reviews-heading">
        <h2 id="novel-reviews-heading" className="text-2xl font-bold tracking-tight">
          Reviews
        </h2>
        <p className="mt-2 text-muted-foreground">
          {novel.reviewCount} community review{novel.reviewCount !== 1 ? "s" : ""} for
          this novel.
        </p>

        {reviews.length > 0 ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} layout="grid" />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-border/60 py-16 text-center">
            <p className="text-lg font-medium text-foreground">No reviews yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Be the first to{" "}
              <Link
                href="/reviews/new"
                className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
              >
                write a review
              </Link>
              .
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
