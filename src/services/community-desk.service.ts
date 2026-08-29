import { ReadingStatusValue } from "@prisma/client";
import { db } from "@/lib/db";
import {
  buildTasteInsight,
  type TasteInsightSnapshot,
} from "@/lib/taste-signature";
import {
  getReadingListByStatus,
  type ReadingStatusNovel,
} from "@/services/reading-status.service";
import type { ReadingTasteSnapshot } from "@/services/feed.service";

export interface CommunityDeskSnapshot {
  memberSince: string;
  currentlyReading: ReadingStatusNovel | null;
  weekly: { reviews: number; saves: number; follows: number };
  activeStreakDays: number;
}

function startOfDay(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function computeActiveStreak(activeDayKeys: Set<string>): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  const offset = activeDayKeys.has(today.toISOString()) ? 0 : 1;

  for (let i = offset; i < 31; i += 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    if (activeDayKeys.has(day.toISOString())) streak += 1;
    else break;
  }

  return streak;
}

export async function getCommunityDeskSnapshot(
  userId: string
): Promise<CommunityDeskSnapshot> {
  const weekAgo = daysAgo(7);
  const monthAgo = daysAgo(30);

  const [
    user,
    readingList,
    weeklyReviews,
    weeklyFollows,
    weeklySaves,
    recentReviews,
    recentSaves,
    recentFollows,
    recentStatus,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    }),
    getReadingListByStatus(userId, ReadingStatusValue.READING),
    db.review.count({
      where: { userId, createdAt: { gte: weekAgo } },
    }),
    db.follow.count({
      where: { followerId: userId, createdAt: { gte: weekAgo } },
    }),
    db.folderReview.count({
      where: { folder: { userId }, addedAt: { gte: weekAgo } },
    }),
    db.review.findMany({
      where: { userId, createdAt: { gte: monthAgo } },
      select: { createdAt: true },
    }),
    db.folderReview.findMany({
      where: { folder: { userId }, addedAt: { gte: monthAgo } },
      select: { addedAt: true },
    }),
    db.follow.findMany({
      where: { followerId: userId, createdAt: { gte: monthAgo } },
      select: { createdAt: true },
    }),
    db.novelReadingStatus.findMany({
      where: { userId, updatedAt: { gte: monthAgo } },
      select: { updatedAt: true },
    }),
  ]);

  const activeDays = new Set<string>();
  for (const row of recentReviews) activeDays.add(startOfDay(row.createdAt));
  for (const row of recentSaves) activeDays.add(startOfDay(row.addedAt));
  for (const row of recentFollows) activeDays.add(startOfDay(row.createdAt));
  for (const row of recentStatus) activeDays.add(startOfDay(row.updatedAt));

  return {
    memberSince: user?.createdAt.toISOString() ?? new Date().toISOString(),
    currentlyReading: readingList[0] ?? null,
    weekly: {
      reviews: weeklyReviews,
      saves: weeklySaves,
      follows: weeklyFollows,
    },
    activeStreakDays: computeActiveStreak(activeDays),
  };
}

export async function getTasteInsightSnapshot(
  userId: string,
  taste: ReadingTasteSnapshot
): Promise<TasteInsightSnapshot> {
  const weekAgo = daysAgo(7);
  const genreNames = taste.topGenres.map((genre) => genre.name);

  let freshMatchCount = 0;
  if (genreNames.length > 0 || taste.topTag) {
    freshMatchCount = await db.review.count({
      where: {
        createdAt: { gte: weekAgo },
        OR: [
          ...(genreNames.length > 0
            ? [
                {
                  novel: {
                    genres: { some: { name: { in: genreNames } } },
                  },
                },
              ]
            : []),
          ...(taste.topTag
            ? [{ novel: { tags: { some: { slug: taste.topTag.slug } } } }]
            : []),
        ],
      },
    });
  }

  void userId;
  return buildTasteInsight(taste, freshMatchCount);
}
