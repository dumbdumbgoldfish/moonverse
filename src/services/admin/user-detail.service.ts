import { db } from "@/lib/db";
import { listAuditLogs } from "@/services/audit.service";

export interface AdminUserDetail {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  isSuspended: boolean;
  emailVerified: boolean;
  createdAt: string;
  reviewCount: number;
  commentCount: number;
  followerCount: number;
  followingCount: number;
  reportsFiled: number;
  reportsAgainst: number;
  moonieConversationCount: number;
  recentReviews: Array<{
    id: string;
    title: string;
    moderationStatus: string;
    createdAt: string;
  }>;
  recentAudit: Awaited<ReturnType<typeof listAuditLogs>>;
}

export async function getAdminUserDetail(
  userId: string
): Promise<AdminUserDetail | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          reviews: true,
          comments: true,
          followers: true,
          following: true,
          reportsFiled: true,
          moonieConversations: true,
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          moderationStatus: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) return null;

  const reportsAgainst = await db.report.count({
    where: { targetType: "USER", targetId: userId },
  });

  const allAudit = await listAuditLogs(200);
  const recentAudit = allAudit.filter(
    (log) =>
      log.entityId === userId ||
      (log.meta &&
        typeof log.meta === "object" &&
        (log.meta as Record<string, unknown>).userId === userId)
  );

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    isSuspended: user.isSuspended,
    emailVerified: user.emailVerified != null,
    createdAt: user.createdAt.toISOString(),
    reviewCount: user._count.reviews,
    commentCount: user._count.comments,
    followerCount: user._count.followers,
    followingCount: user._count.following,
    reportsFiled: user._count.reportsFiled,
    reportsAgainst,
    moonieConversationCount: user._count.moonieConversations,
    recentReviews: user.reviews.map((review) => ({
      id: review.id,
      title: review.title,
      moderationStatus: review.moderationStatus,
      createdAt: review.createdAt.toISOString(),
    })),
    recentAudit: recentAudit.slice(0, 15),
  };
}
