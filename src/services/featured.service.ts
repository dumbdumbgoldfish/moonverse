import { db } from "@/lib/db";
import { insertFeaturedNovelIfNoOverlap } from "@/lib/admin/featured-novel-create";
import { resolveCoverUrl } from "@/lib/review-utils";

export interface FeaturedNovelItem {
  id: string;
  novelId: string;
  novelTitle: string;
  novelAuthor: string | null;
  coverUrl: string;
  slot: number;
  startsAt: string;
  endsAt: string | null;
}

/** Active featured novels ordered by slot, for the public spotlight shelf. */
export async function getActiveFeaturedNovels(
  limit = 8
): Promise<FeaturedNovelItem[]> {
  const now = new Date();
  const rows = await db.featuredNovel.findMany({
    where: {
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
    orderBy: [{ slot: "asc" }, { startsAt: "desc" }],
    take: limit,
    include: { novel: { select: { id: true, title: true, author: true, coverUrl: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    novelId: row.novel.id,
    novelTitle: row.novel.title,
    novelAuthor: row.novel.author,
    coverUrl: resolveCoverUrl(row.novel.coverUrl),
    slot: row.slot,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
  }));
}

export interface AdminFeaturedNovelItem extends FeaturedNovelItem {
  isActive: boolean;
  createdByUsername: string | null;
}

export async function getAllFeaturedNovels(): Promise<AdminFeaturedNovelItem[]> {
  const now = new Date();
  const rows = await db.featuredNovel.findMany({
    orderBy: [{ startsAt: "desc" }],
    include: {
      novel: { select: { id: true, title: true, author: true, coverUrl: true } },
      createdBy: { select: { username: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    novelId: row.novel.id,
    novelTitle: row.novel.title,
    novelAuthor: row.novel.author,
    coverUrl: resolveCoverUrl(row.novel.coverUrl),
    slot: row.slot,
    startsAt: row.startsAt.toISOString(),
    endsAt: row.endsAt?.toISOString() ?? null,
    isActive: row.startsAt <= now && (!row.endsAt || row.endsAt >= now),
    createdByUsername: row.createdBy?.username ?? null,
  }));
}

export interface CreateFeaturedNovelInput {
  novelId: string;
  slot?: number;
  startsAt?: Date;
  endsAt?: Date | null;
  createdById: string;
}

export async function createFeaturedNovel(
  input: CreateFeaturedNovelInput
): Promise<void> {
  const novel = await db.novel.findUnique({
    where: { id: input.novelId },
    select: { id: true },
  });
  if (!novel) throw new Error("Novel not found.");

  const startsAt = input.startsAt ?? new Date();
  const endsAt = input.endsAt ?? null;

  await db.$transaction(async (tx) => {
    await insertFeaturedNovelIfNoOverlap(tx, {
      novelId: input.novelId,
      slot: input.slot ?? 0,
      startsAt,
      endsAt,
      createdById: input.createdById,
    });
  });
}

export async function deleteFeaturedNovel(id: string): Promise<void> {
  await db.featuredNovel.delete({ where: { id } });
}
