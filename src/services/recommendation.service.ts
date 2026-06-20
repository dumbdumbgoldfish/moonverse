import { db } from "@/lib/db";
import { excerpt } from "@/lib/review-utils";
import type { MoonieConfidence, MoonieRecommendation } from "@/types/moonie";

export interface ContextReview {
  reviewId: string;
  novelId: string;
  title: string;
  novelTitle: string;
  novelAuthor: string | null;
  rating: number;
  genres: string[];
  tags: string[];
  excerpt: string;
}

export interface RecommendationContext {
  requestMessage: string;
  userProfile: {
    displayName: string;
    username: string;
    bio: string | null;
  };
  likedReviews: ContextReview[];
  savedReviews: ContextReview[];
  recentReviews: ContextReview[];
  topRatedReviews: ContextReview[];
  genres: string[];
  tags: string[];
}

const reviewContextSelect = {
  id: true,
  title: true,
  rating: true,
  body: true,
  novel: {
    select: {
      id: true,
      title: true,
      author: true,
      genres: { select: { name: true } },
      tags: { select: { name: true } },
    },
  },
} as const;

type ReviewRow = {
  id: string;
  title: string;
  rating: number;
  body: string;
  novel: {
    id: string;
    title: string;
    author: string | null;
    genres: { name: string }[];
    tags: { name: string }[];
  };
};

function mapReviewToContext(review: ReviewRow): ContextReview {
  return {
    reviewId: review.id,
    novelId: review.novel.id,
    title: review.title,
    novelTitle: review.novel.title,
    novelAuthor: review.novel.author,
    rating: review.rating,
    genres: review.novel.genres.map((g) => g.name),
    tags: review.novel.tags.map((t) => t.name),
    excerpt: excerpt(review.body, 120),
  };
}

async function getLikedReviews(userId: string): Promise<ContextReview[]> {
  const likes = await db.like.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { review: { select: reviewContextSelect } },
  });

  return likes.map((like) => mapReviewToContext(like.review));
}

async function getSavedReviews(userId: string): Promise<ContextReview[]> {
  const saves = await db.folderReview.findMany({
    where: { folder: { userId } },
    orderBy: { addedAt: "desc" },
    take: 10,
    distinct: ["reviewId"],
    include: { review: { select: reviewContextSelect } },
  });

  return saves.map((save) => mapReviewToContext(save.review));
}

async function getRecentReviews(): Promise<ContextReview[]> {
  const reviews = await db.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
    select: reviewContextSelect,
  });

  return reviews.map(mapReviewToContext);
}

async function getTopRatedReviews(): Promise<ContextReview[]> {
  const reviews = await db.review.findMany({
    where: { rating: { gte: 4 } },
    orderBy: [{ rating: "desc" }, { likeCount: "desc" }],
    take: 12,
    select: reviewContextSelect,
  });

  return reviews.map(mapReviewToContext);
}

export async function buildRecommendationContext(
  userId: string,
  message: string
): Promise<RecommendationContext> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      displayName: true,
      username: true,
      bio: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const [likedReviews, savedReviews, recentReviews, topRatedReviews, genres, tags] =
    await Promise.all([
      getLikedReviews(userId),
      getSavedReviews(userId),
      getRecentReviews(),
      getTopRatedReviews(),
      db.genre.findMany({ orderBy: { name: "asc" }, select: { name: true } }),
      db.tag.findMany({ orderBy: { name: "asc" }, take: 30, select: { name: true } }),
    ]);

  return {
    requestMessage: message,
    userProfile: {
      displayName: user.displayName,
      username: user.username,
      bio: user.bio,
    },
    likedReviews,
    savedReviews,
    recentReviews,
    topRatedReviews,
    genres: genres.map((g) => g.name),
    tags: tags.map((t) => t.name),
  };
}

function tokenize(message: string): string[] {
  return message
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function scoreReview(review: ContextReview, tokens: string[]): number {
  let score = review.rating * 2;
  const haystack = [
    review.novelTitle,
    review.title,
    review.novelAuthor ?? "",
    ...review.genres,
    ...review.tags,
    review.excerpt,
  ]
    .join(" ")
    .toLowerCase();

  for (const token of tokens) {
    if (haystack.includes(token)) score += 3;
  }

  if (/romance|slow.?burn|female lead|strong female/i.test(tokens.join(" "))) {
    if (review.genres.some((g) => /romance/i.test(g))) score += 4;
    if (review.tags.some((t) => /romance|female|slow/i.test(t))) score += 3;
  }

  if (/revenge|fantasy|action|clever|mc|litrpg|xianxia|completed/i.test(tokens.join(" "))) {
    for (const token of tokens) {
      if (review.genres.some((g) => g.toLowerCase().includes(token))) score += 2;
      if (review.tags.some((t) => t.toLowerCase().includes(token))) score += 2;
    }
  }

  return score;
}

function toConfidence(score: number, maxScore: number): MoonieConfidence {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.85) return "high";
  if (ratio >= 0.55) return "medium";
  return "low";
}

function buildReason(review: ContextReview, message: string): string {
  const genreText =
    review.genres.length > 0 ? review.genres.join(" & ") : "web fiction";
  return `Matches your interest in "${message.slice(0, 60)}${message.length > 60 ? "…" : ""}" — ${genreText} with a ${review.rating}-star MoonVerse review praising ${review.excerpt.slice(0, 80)}…`;
}

export function getMockRecommendations(
  message: string,
  context: RecommendationContext
): { reply: string; recommendations: MoonieRecommendation[] } {
  const tokens = tokenize(message);
  const pool = [
    ...context.likedReviews,
    ...context.savedReviews,
    ...context.topRatedReviews,
    ...context.recentReviews,
  ];

  const unique = new Map<string, ContextReview>();
  for (const review of pool) {
    if (!unique.has(review.reviewId)) {
      unique.set(review.reviewId, review);
    }
  }

  const scored = [...unique.values()]
    .map((review) => ({ review, score: scoreReview(review, tokens) }))
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 5);
  const maxScore = top[0]?.score ?? 1;

  const recommendations: MoonieRecommendation[] = top.slice(0, 5).map(({ review, score }) => ({
    title: review.novelTitle,
    author: review.novelAuthor ?? undefined,
    reason: buildReason(review, message),
    genres: review.genres,
    tags: review.tags.slice(0, 4),
    confidence: toConfidence(score, maxScore),
    reviewId: review.reviewId,
    novelId: review.novelId,
  }));

  while (recommendations.length < 3 && context.topRatedReviews.length > 0) {
    const fallback = context.topRatedReviews[recommendations.length];
    if (!fallback || recommendations.some((r) => r.reviewId === fallback.reviewId)) {
      break;
    }
    recommendations.push({
      title: fallback.novelTitle,
      author: fallback.novelAuthor ?? undefined,
      reason: buildReason(fallback, message),
      genres: fallback.genres,
      tags: fallback.tags.slice(0, 4),
      confidence: "medium",
      reviewId: fallback.reviewId,
      novelId: fallback.novelId,
    });
  }

  return {
    reply:
      recommendations.length > 0
        ? "Here are some web novels from MoonVerse that match your taste! (Development mode — add OPENAI_API_KEY for live AI recommendations.)"
        : "I couldn't find a strong match yet. Try mentioning genres like fantasy, romance, or LitRPG!",
    recommendations,
  };
}
