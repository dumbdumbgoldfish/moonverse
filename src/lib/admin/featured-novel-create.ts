import type { Prisma } from "@prisma/client";
import {
  buildOverlappingFeaturedNovelWhere,
  FEATURED_NOVEL_OVERLAP_ERROR,
  hasOverlappingFeaturedNovelWindow,
  type FeaturedNovelWindow,
} from "@/lib/admin/featured-novel-uniqueness";

type FeaturedNovelRow = FeaturedNovelWindow & {
  novelId: string;
  id: string;
};

/** Serializes featured creates per novel (matches pg_advisory_xact_lock semantics). */
export async function withFeaturedNovelCreateLock<T>(
  novelId: string,
  locks: Map<string, Promise<unknown>>,
  fn: () => Promise<T>
): Promise<T> {
  const previous = locks.get(novelId) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const current = previous.then(() => gate).catch(() => undefined);
  locks.set(novelId, current);

  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (locks.get(novelId) === current) {
      locks.delete(novelId);
    }
  }
}

export async function createFeaturedNovelRowIfNoOverlap(
  rows: FeaturedNovelRow[],
  locks: Map<string, Promise<unknown>>,
  input: {
    novelId: string;
    startsAt: Date;
    endsAt: Date | null;
    id: string;
  }
): Promise<void> {
  return withFeaturedNovelCreateLock(input.novelId, locks, async () => {
    if (
      hasOverlappingFeaturedNovelWindow(input.novelId, input, rows)
    ) {
      throw new Error(FEATURED_NOVEL_OVERLAP_ERROR);
    }
    rows.push({
      id: input.id,
      novelId: input.novelId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    });
  });
}

export async function lockFeaturedNovelForCreate(
  tx: Prisma.TransactionClient,
  novelId: string
): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${novelId}))`;
}

export async function insertFeaturedNovelIfNoOverlap(
  tx: Prisma.TransactionClient,
  input: {
    novelId: string;
    slot: number;
    startsAt: Date;
    endsAt: Date | null;
    createdById: string;
  }
): Promise<void> {
  await lockFeaturedNovelForCreate(tx, input.novelId);

  const overlapping = await tx.featuredNovel.findFirst({
    where: buildOverlappingFeaturedNovelWhere(
      input.novelId,
      input.startsAt,
      input.endsAt
    ),
    select: { id: true },
  });

  if (overlapping) {
    throw new Error(FEATURED_NOVEL_OVERLAP_ERROR);
  }

  await tx.featuredNovel.create({
    data: {
      novelId: input.novelId,
      slot: input.slot,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      createdById: input.createdById,
    },
  });
}
