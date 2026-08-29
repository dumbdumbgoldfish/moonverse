import { db } from "@/lib/db";

export interface AdminSearchResult {
  id: string;
  type: "user" | "novel" | "review" | "report";
  label: string;
  meta: string;
  href: string;
}

export async function adminGlobalSearch(
  query: string,
  limit = 12
): Promise<AdminSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const perType = Math.max(2, Math.ceil(limit / 4));
  const results: AdminSearchResult[] = [];

  const [users, novels, reviews, reports] = await Promise.all([
    db.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: perType,
      select: { id: true, username: true, displayName: true, role: true },
    }),
    db.novel.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { author: { contains: q, mode: "insensitive" } },
        ],
      },
      take: perType,
      select: { id: true, title: true, author: true },
    }),
    db.review.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      take: perType,
      select: {
        id: true,
        title: true,
        user: { select: { username: true } },
      },
    }),
    db.report.findMany({
      where:
        q.length > 8
          ? {
              OR: [
                { id: { startsWith: q } },
                { reason: { contains: q, mode: "insensitive" } },
              ],
            }
          : { reason: { contains: q, mode: "insensitive" } },
      take: perType,
      select: { id: true, targetType: true, status: true },
    }),
  ]);

  for (const user of users) {
    results.push({
      id: user.id,
      type: "user",
      label: user.displayName,
      meta: `@${user.username} · ${user.role}`,
      href: `/admin/users/${user.id}`,
    });
  }

  for (const novel of novels) {
    results.push({
      id: novel.id,
      type: "novel",
      label: novel.title,
      meta: novel.author ?? "Unknown author",
      href: `/admin/novels?q=${encodeURIComponent(novel.title)}`,
    });
  }

  for (const review of reviews) {
    results.push({
      id: review.id,
      type: "review",
      label: review.title,
      meta: `@${review.user.username}`,
      href: `/admin/reviews?q=${encodeURIComponent(review.title)}`,
    });
  }

  for (const report of reports) {
    results.push({
      id: report.id,
      type: "report",
      label: `${report.targetType} report`,
      meta: report.status,
      href: `/admin/inbox?selected=report-${report.id}`,
    });
  }

  return results.slice(0, limit);
}
