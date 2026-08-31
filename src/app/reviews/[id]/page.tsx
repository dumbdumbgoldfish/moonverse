import { notFound } from "next/navigation";
import { ReviewDetailView } from "@/components/reviews/detail/ReviewDetailView";
import { guestReviewPreviewBody } from "@/lib/review-utils";
import { auth } from "@/lib/auth";
import type { FolderListItem } from "@/types/folder";
import { getCommentsByReviewId } from "@/services/comment.service";
import {
  getFoldersByUser,
  getReviewSavedFolderIds,
} from "@/services/folder.service";
import { isFollowing } from "@/services/follow-queries";
import { isLikedByUser } from "@/services/like.service";
import {
  getReadingLinksByNovelIds,
  getReviewsByNovelId,
  getSimilarNovels,
} from "@/services/novel.service";
import {
  getNovelReviewStats,
  getReviewById,
  getReviewerPublicStats,
} from "@/services/review.service";

export const dynamic = "force-dynamic";

interface ReviewDetailPageProps {
  params: Promise<{ id: string }>;
}

function buildReviewJsonLd(
  review: NonNullable<Awaited<ReturnType<typeof getReviewById>>>,
  stats: Awaited<ReturnType<typeof getNovelReviewStats>>,
) {
  const book: Record<string, unknown> = {
    "@type": "Book",
    name: review.novelTitle,
    url: `/novels/${review.novelId}`,
  };

  if (review.novelAuthor) {
    book.author = { "@type": "Person", name: review.novelAuthor };
  }

  if (review.coverUrl) {
    book.image = review.coverUrl;
  }

  if (stats.total > 0) {
    book.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(stats.average.toFixed(1)),
      bestRating: 5,
      worstRating: 1,
      ratingCount: stats.total,
    };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Review",
        headline: review.title,
        reviewBody: review.excerpt || review.body.slice(0, 500),
        datePublished: review.createdAt,
        author: {
          "@type": "Person",
          name: review.reviewerName,
          url: `/users/${review.reviewerUsername}`,
        },
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.rating,
          bestRating: 5,
          worstRating: 1,
        },
        itemReviewed: book,
      },
      book,
    ],
  };
}

export async function generateMetadata({ params }: ReviewDetailPageProps) {
  const { id } = await params;
  const review = await getReviewById(id);
  if (!review) return { title: "Review not found · MoonVerse" };

  const title = `${review.title} · ${review.novelTitle} · MoonVerse`;
  const description = (
    review.excerpt ||
    `${review.reviewerName} rated ${review.novelTitle} ${review.rating}/5 on MoonVerse.`
  ).slice(0, 200);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article" as const,
      publishedTime: review.createdAt,
      authors: [review.reviewerName],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
    },
  };
}

export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const { id } = await params;
  const [review, session] = await Promise.all([
    getReviewById(id),
    auth(),
  ]);

  if (!review) {
    notFound();
  }

  const isOwner = session?.user?.id === review.userId;
  const isLoggedIn = !!session?.user?.id;
  const userId = session?.user?.id;

  const [
    comments,
    stats,
    readingLinksMap,
    relatedReviews,
    recommendations,
    reviewerStats,
    initialLiked,
    initialFollowing,
    folders,
    savedFolderIds,
  ] = await Promise.all([
    getCommentsByReviewId(id, userId),
    getNovelReviewStats(review.novelId),
    getReadingLinksByNovelIds([review.novelId]),
    getReviewsByNovelId(review.novelId),
    getSimilarNovels(review.novelId, 25),
    getReviewerPublicStats(review.userId),
    userId ? isLikedByUser(userId, id) : Promise.resolve(false),
    userId && userId !== review.userId
      ? isFollowing(userId, review.userId)
      : Promise.resolve(false),
    userId ? getFoldersByUser(userId) : Promise.resolve([] as FolderListItem[]),
    userId
      ? getReviewSavedFolderIds(id, userId)
      : Promise.resolve([] as string[]),
  ]);

  const readingLinks = readingLinksMap.get(review.novelId) ?? [];
  const jsonLd = buildReviewJsonLd(review, stats);
  const displayReview = isLoggedIn
    ? review
    : {
        ...review,
        body: guestReviewPreviewBody(review.body, review.excerpt),
      };
  const displayRecommendations = isLoggedIn ? recommendations : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReviewDetailView
        review={displayReview}
        comments={comments}
        stats={stats}
        readingLinks={readingLinks}
        relatedReviews={relatedReviews}
        recommendations={displayRecommendations}
        reviewerStats={reviewerStats}
        isLoggedIn={isLoggedIn}
        isOwner={isOwner}
        initialLiked={initialLiked}
        initialFollowing={initialFollowing}
        folders={folders}
        savedFolderIds={savedFolderIds}
        currentUserId={session?.user?.id}
        currentUserName={session?.user?.name ?? undefined}
        currentUserImage={session?.user?.image}
      />
    </>
  );
}
