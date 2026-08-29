import { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import { resolveCoverUrl } from "@/lib/review-utils";
import { createNotification } from "@/services/notification.service";
import { getPersonalizedReviews } from "@/services/review.service";

export interface MoonieDailyPick {
  reviewId: string;
  novelId: string;
  novelTitle: string;
  coverUrl: string;
  reason: string;
  isNew: boolean;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

/**
 * Returns today's Moonie daily pick for a user, creating one (and a
 * MOONIE_DAILY_PICK notification) the first time it's requested each day.
 */
export async function getOrCreateDailyPick(
  userId: string
): Promise<MoonieDailyPick | null> {
  const todayStart = startOfToday();

  const existingNotification = await db.notification.findFirst({
    where: {
      userId,
      type: NotificationType.MOONIE_DAILY_PICK,
      createdAt: { gte: todayStart },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingNotification?.link) {
    const reviewId = existingNotification.link.split("/").pop();
    if (reviewId) {
      const review = await db.review.findUnique({
        where: { id: reviewId },
        include: { novel: { select: { id: true, title: true, coverUrl: true } } },
      });
      if (review) {
        return {
          reviewId: review.id,
          novelId: review.novel.id,
          novelTitle: review.novel.title,
          coverUrl: resolveCoverUrl(review.novel.coverUrl),
          reason: existingNotification.message,
          isNew: false,
        };
      }
    }
  }

  const candidates = await getPersonalizedReviews(userId, { limit: 20 });
  const pool = candidates.length > 0 ? candidates : await getPersonalizedReviews(
    userId,
    { limit: 20, allowTrendingFallback: true }
  );

  if (pool.length === 0) return null;

  const pick = pool[Math.floor(Math.random() * pool.length)];
  const reason = `Today's pick: "${pick.novelTitle}". ${pick.genres.slice(0, 2).join(" & ") || "A MoonVerse favorite"}, chosen just for you.`;

  await createNotification({
    userId,
    type: NotificationType.MOONIE_DAILY_PICK,
    message: reason,
    link: `/reviews/${pick.id}`,
    metadata: {
      reviewId: pick.id,
      reviewTitle: pick.title,
      novelId: pick.novelId,
      novelTitle: pick.novelTitle,
      coverUrl: pick.coverUrl,
      snippet: reason,
    },
  });

  return {
    reviewId: pick.id,
    novelId: pick.novelId,
    novelTitle: pick.novelTitle,
    coverUrl: pick.coverUrl,
    reason,
    isNew: true,
  };
}
