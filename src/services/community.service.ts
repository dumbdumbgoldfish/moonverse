import { db } from "@/lib/db";
import { getInitials } from "@/lib/review-utils";

export interface CommunityStats {
  totalReviews: number;
  totalUsers: number;
  totalNovels: number;
}

export interface FeaturedReviewer {
  username: string;
  displayName: string;
  avatar: string;
  reviewCount: number;
}

export async function getCommunityStats(): Promise<CommunityStats> {
  const [totalReviews, totalUsers, totalNovels] = await Promise.all([
    db.review.count(),
    db.user.count(),
    db.novel.count(),
  ]);

  return { totalReviews, totalUsers, totalNovels };
}

export async function getFeaturedReviewers(limit = 4): Promise<FeaturedReviewer[]> {
  const grouped = await db.review.groupBy({
    by: ["userId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  if (grouped.length === 0) return [];

  const users = await db.user.findMany({
    where: { id: { in: grouped.map((g) => g.userId) } },
    select: { id: true, username: true, displayName: true },
  });

  const userById = Object.fromEntries(users.map((u) => [u.id, u]));

  return grouped
    .map((row) => {
      const user = userById[row.userId];
      if (!user) return null;
      return {
        username: user.username,
        displayName: user.displayName,
        avatar: getInitials(user.displayName),
        reviewCount: row._count.id,
      };
    })
    .filter((r): r is FeaturedReviewer => r !== null);
}

export async function getPopularTags(limit = 12) {
  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    take: limit,
    select: { id: true, name: true, slug: true },
  });
  return tags;
}
