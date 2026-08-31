/**
 * Documented demo fixtures for Moonie/Search acceptance tests.
 *
 * Synthetic catalogue rows are valid test inputs when expectations are explicit.
 * Unknown provenance (null metadataSource) is not low-trust stripping and not
 * independent verification — fixtures document the intended constraint behavior.
 */

import type { MoonieRecommendation } from "@/types/moonie";
import type { MoonieReviewerResult, MoonieReviewerSession } from "@/types/moonie";

/** Live integration seed that returns recommendation cards from the demo catalogue. */
export const MOONIE_INTEGRATION_SEED_MESSAGE = "Recommend fantasy novels";

/** Batch discovery without completed (slice-of-life tag path on demo DB). */
export const MOONIE_SLICE_OF_LIFE_SEED_MESSAGE = "Show me slice-of-life novels";

/** Hard-constraint message for completed + slice-of-life acceptance. */
export const DEMO_COMPLETED_SLICE_OF_LIFE_MESSAGE =
  "Show me completed slice-of-life novels";

/** Documented novels: independent status unknown at source; eligible for constraint tests. */
export const DEMO_COMPLETED_SLICE_OF_LIFE_NOVELS = [
  {
    genres: ["Romance"],
    tags: ["slice-of-life"],
    publicationStatus: "Completed",
    metadataSource: null,
  },
  {
    genres: ["Slice of Life"],
    tags: [],
    publicationStatus: "Completed",
    metadataSource: null,
  },
] as const;

/** Low-trust demo row: explicit Completed status is eligible for hard filters. */
export const DEMO_LOW_TRUST_COMPLETED_SLICE_OF_LIFE = {
  genres: ["Romance"],
  tags: ["slice-of-life"],
  publicationStatus: "Completed",
  metadataSource: "seed-catalog",
} as const;

/** Low-trust demo row with unknown status — must not satisfy completed hard filters. */
export const DEMO_LOW_TRUST_UNKNOWN_SLICE_OF_LIFE = {
  genres: ["Romance"],
  tags: ["slice-of-life"],
  publicationStatus: null,
  metadataSource: "seed-catalog",
} as const;

/** Low-trust completed found-family fixture for acceptance tests. */
export const DEMO_LOW_TRUST_COMPLETED_FOUND_FAMILY = {
  genres: ["Romance"],
  tags: ["found family"],
  publicationStatus: "Completed",
  metadataSource: "seed-catalog",
} as const;

/** Low-trust ongoing found-family — must not match completed requests. */
export const DEMO_LOW_TRUST_ONGOING_FOUND_FAMILY = {
  genres: ["Romance"],
  tags: ["found family"],
  publicationStatus: "Ongoing",
  metadataSource: "seed-catalog",
} as const;

/** Trusted QA row: editorial status may satisfy completed when tagged slice-of-life. */
export const DEMO_TRUSTED_COMPLETED_SLICE_OF_LIFE = {
  genres: ["Romance"],
  tags: ["slice-of-life"],
  publicationStatus: "Completed",
  metadataSource: "admin-qa-content-v1",
} as const;

export function demoRecommendation(
  novelId: string,
  title: string,
  overrides: Partial<MoonieRecommendation> = {}
): MoonieRecommendation {
  return {
    novelId,
    title,
    author: "Demo Author",
    reason: "Fixture recommendation for acceptance tests.",
    genres: ["Fantasy"],
    tags: ["slice-of-life"],
    confidence: "high",
    matchPercent: 85,
    sourceStatus: "verified",
    availableOn: [],
    ...overrides,
  };
}

export function demoRecommendationBatch(count = 2): MoonieRecommendation[] {
  return Array.from({ length: count }, (_, index) =>
    demoRecommendation(`demo-novel-${index + 1}`, `Demo Novel ${index + 1}`, {
      matchPercent: 90 - index * 5,
    })
  );
}

/** Controlled reviewer ranking rows for follow-up / ordinal tests (not global winners). */
export function demoReviewerRankingResults(
  count = 5
): MoonieReviewerResult[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `fixture-reviewer-${index + 1}`,
    displayName: `Fixture Reviewer ${index + 1}`,
    username: `fixturereviewer${index + 1}`,
    avatarInitials: `F${index + 1}`,
    avatarUrl: null,
    reviewCount: 50 - index,
    followerCount: index + 1,
  }));
}

export function demoReviewerRankingSession(count = 5): MoonieReviewerSession {
  return {
    reviewers: demoReviewerRankingResults(count),
    rankBy: "reviews",
    queryType: "ranking",
    activeReviewerId: "fixture-reviewer-1",
  };
}
