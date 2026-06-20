import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Pencil } from "lucide-react";
import { auth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/reviews/StarRating";
import { ReviewActions } from "@/components/reviews/ReviewActions";
import { CommentSection } from "@/components/reviews/CommentSection";
import { getCommentsByReviewId } from "@/services/comment.service";
import {
  getFoldersByUser,
  getReviewSavedFolderIds,
} from "@/services/folder.service";
import { isLikedByUser } from "@/services/like.service";
import { getReviewById } from "@/services/review.service";

export const dynamic = "force-dynamic";

interface ReviewDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export async function generateMetadata({ params }: ReviewDetailPageProps) {
  const { id } = await params;
  const review = await getReviewById(id);
  if (!review) return { title: "Review not found — MoonVerse" };
  return {
    title: `${review.title} — MoonVerse`,
    description: review.excerpt,
  };
}

export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const { id } = await params;
  const [review, comments, session] = await Promise.all([
    getReviewById(id),
    getCommentsByReviewId(id),
    auth(),
  ]);

  if (!review) {
    notFound();
  }

  const isOwner = session?.user?.id === review.userId;
  const isLoggedIn = !!session?.user?.id;
  const userId = session?.user?.id;

  const [initialLiked, folders, savedFolderIds] = userId
    ? await Promise.all([
        isLikedByUser(userId, id),
        getFoldersByUser(userId),
        getReviewSavedFolderIds(id, userId),
      ])
    : [false, [], []];

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
        {/* Novel header band */}
        <div className="border-b border-border/60 bg-bg-warm px-4 py-4 sm:px-6">
          <div className="flex gap-4">
            <div className="relative h-[120px] w-[80px] shrink-0 overflow-hidden rounded-lg shadow-md">
              <Image
                src={review.coverUrl}
                alt={`Cover of ${review.novelTitle}`}
                fill
                className="object-cover"
                sizes="80px"
                priority
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Review of
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                <Link
                  href={`/novels/${review.novelId}`}
                  className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  {review.novelTitle}
                </Link>
              </h1>
              <p className="text-sm text-muted-foreground">by {review.novelAuthor}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {review.genres.map((genre) => (
                  <Badge
                    key={genre}
                    variant="secondary"
                    className="rounded-full bg-moon-purple-soft text-primary"
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
              {review.externalLink && (
                <a
                  href={review.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Read the novel
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Reviewer + post body */}
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="bg-primary/15 text-primary">
                {review.reviewerAvatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <Link
                href={`/users/${review.reviewerUsername}`}
                className="font-semibold hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
              >
                {review.reviewerName}
              </Link>
              <p className="text-xs text-muted-foreground">
                @{review.reviewerUsername} ·{" "}
                <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
              </p>
            </div>
          </div>

          <h2 className="mt-5 text-xl font-bold tracking-tight">{review.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StarRating rating={review.rating} size="md" />
            {isOwner && (
              <Button
                size="sm"
                variant="outline"
                render={<Link href={`/reviews/${review.id}/edit`} />}
              >
                <Pencil data-icon="inline-start" aria-hidden="true" />
                Edit
              </Button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {review.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="rounded-full text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="mt-5 font-serif text-base leading-relaxed text-foreground/90 whitespace-pre-line">
            {review.body}
          </div>

          <div className="mt-6 border-t border-border/60 pt-4">
            <ReviewActions
              reviewId={review.id}
              reviewTitle={review.title}
              likeCount={review.likeCount}
              commentCount={review.commentCount}
              shareCount={review.shareCount}
              initialLiked={initialLiked}
              isLoggedIn={isLoggedIn}
              folders={folders}
              savedFolderIds={savedFolderIds}
            />
          </div>
        </div>
      </div>

      <CommentSection
        reviewId={review.id}
        comments={comments}
        commentCount={review.commentCount}
        currentUserId={session?.user?.id}
        isLoggedIn={isLoggedIn}
      />
    </article>
  );
}
