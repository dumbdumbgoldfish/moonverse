const FAR_FUTURE = new Date("9999-12-31T23:59:59.999Z");

export const FEATURED_NOVEL_OVERLAP_ERROR =
  "This novel already has a featured spotlight entry with an overlapping schedule. Remove the existing entry or choose a non-overlapping window.";

export interface FeaturedNovelWindow {
  startsAt: Date;
  endsAt: Date | null;
}

/**
 * Half-open windows [startsAt, endsAt): touching boundaries do not overlap.
 * Open-ended windows use endsAt = null (infinite end).
 */
export function featuredNovelWindowsOverlap(
  proposed: FeaturedNovelWindow,
  existing: FeaturedNovelWindow
): boolean {
  const proposedEnd = proposed.endsAt ?? FAR_FUTURE;
  const existingEnd = existing.endsAt ?? FAR_FUTURE;
  return proposed.startsAt < existingEnd && existing.startsAt < proposedEnd;
}

export function hasOverlappingFeaturedNovelWindow(
  novelId: string,
  proposed: FeaturedNovelWindow,
  existingRows: Array<FeaturedNovelWindow & { novelId: string }>
): boolean {
  return existingRows.some(
    (row) =>
      row.novelId === novelId &&
      featuredNovelWindowsOverlap(proposed, {
        startsAt: row.startsAt,
        endsAt: row.endsAt,
      })
  );
}

/** Prisma where clause for an overlapping featured window on the same novel. */
export function buildOverlappingFeaturedNovelWhere(
  novelId: string,
  startsAt: Date,
  endsAt: Date | null
) {
  const effectiveEnd = endsAt ?? FAR_FUTURE;
  return {
    novelId,
    startsAt: { lt: effectiveEnd },
    OR: [{ endsAt: null }, { endsAt: { gt: startsAt } }],
  };
}

export function isFeaturedNovelOverlapError(error: unknown): boolean {
  return (
    error instanceof Error && error.message === FEATURED_NOVEL_OVERLAP_ERROR
  );
}
