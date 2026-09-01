import { db } from "@/lib/db";
import { getInboxCounts } from "@/services/admin/inbox.service";
import type {
  AdminDashboardAttention,
  AdminDashboardStats,
  AdminReviewSummary,
  AdminUserSummary,
} from "@/types/admin";

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [users, reviews, novels, comments, likes, folders] = await Promise.all([
    db.user.count(),
    db.review.count(),
    db.novel.count(),
    db.comment.count(),
    db.like.count(),
    db.folder.count(),
  ]);

  return { users, reviews, novels, comments, likes, folders };
}

export async function getAdminDashboardAttention(): Promise<AdminDashboardAttention> {
  const counts = await getInboxCounts();

  return {
    openReports: counts.report,
    pendingReadingLinks: counts.reading_link,
    unhealthyReadingLinks: counts.reading_link_unhealthy,
    pendingTagSuggestions: counts.tag_suggestion,
    autoFlaggedReviews: counts.review_flagged,
    autoFlaggedComments: counts.comment_flagged,
    queueTotal: counts.total,
  };
}

export async function getAdminLatestReviews(
  limit = 5
): Promise<AdminReviewSummary[]> {
  const reviews = await db.review.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { username: true } },
      novel: { select: { title: true } },
    },
  });

  return reviews.map((review) => ({
    id: review.id,
    title: review.title,
    rating: review.rating,
    novelTitle: review.novel.title,
    reviewerUsername: review.user.username,
    likeCount: review.likeCount,
    commentCount: review.commentCount,
    saveCount: review.saveCount,
    shareCount: review.shareCount,
    moderationStatus: review.moderationStatus,
    createdAt: review.createdAt.toISOString(),
  }));
}

export async function getAdminLatestUsers(
  limit = 5
): Promise<AdminUserSummary[]> {
  const users = await db.user.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { reviews: true, followers: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    isSuspended: user.isSuspended,
    reviewCount: user._count.reviews,
    followerCount: user._count.followers,
    createdAt: user.createdAt.toISOString(),
  }));
}

export async function getSystemInfo() {
  let databaseStatus: "connected" | "error" = "connected";
  try {
    await db.$queryRaw`SELECT 1`;
  } catch {
    databaseStatus = "error";
  }

  return {
    appName: "MoonVerse",
    environment: process.env.NODE_ENV ?? "development",
    databaseStatus,
    moonieMode: process.env.OPENAI_API_KEY
      ? "Grounded + OpenAI explanations"
      : "Grounded catalogue",
  };
}
