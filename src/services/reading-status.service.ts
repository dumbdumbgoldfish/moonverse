import { ReadingStatusValue } from "@prisma/client";
import { db } from "@/lib/db";

export async function getReadingStatus(
  userId: string,
  novelId: string
): Promise<ReadingStatusValue | null> {
  const status = await db.novelReadingStatus.findUnique({
    where: { userId_novelId: { userId, novelId } },
    select: { status: true },
  });
  return status?.status ?? null;
}

export async function setReadingStatus(
  userId: string,
  novelId: string,
  status: ReadingStatusValue
): Promise<void> {
  const novel = await db.novel.findUnique({
    where: { id: novelId },
    select: { id: true },
  });
  if (!novel) throw new Error("Novel not found.");

  await db.novelReadingStatus.upsert({
    where: { userId_novelId: { userId, novelId } },
    create: { userId, novelId, status },
    update: { status },
  });
}

export async function clearReadingStatus(
  userId: string,
  novelId: string
): Promise<void> {
  await db.novelReadingStatus.deleteMany({ where: { userId, novelId } });
}

export interface ReadingStatusNovel {
  novelId: string;
  novelTitle: string;
  novelAuthor: string | null;
  coverUrl: string;
  status: ReadingStatusValue;
  updatedAt: string;
}

export async function getReadingListByStatus(
  userId: string,
  status: ReadingStatusValue
): Promise<ReadingStatusNovel[]> {
  const rows = await db.novelReadingStatus.findMany({
    where: { userId, status },
    orderBy: { updatedAt: "desc" },
    include: { novel: { select: { id: true, title: true, author: true, coverUrl: true } } },
  });

  return rows.map((row) => ({
    novelId: row.novel.id,
    novelTitle: row.novel.title,
    novelAuthor: row.novel.author,
    coverUrl: row.novel.coverUrl ?? "",
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getReadingStatusCounts(
  userId: string
): Promise<Record<ReadingStatusValue, number>> {
  const grouped = await db.novelReadingStatus.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });

  const counts: Record<ReadingStatusValue, number> = {
    WANT: 0,
    READING: 0,
    FINISHED: 0,
  };
  for (const row of grouped) {
    counts[row.status] = row._count._all;
  }
  return counts;
}
