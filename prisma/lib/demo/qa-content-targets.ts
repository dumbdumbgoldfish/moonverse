/**
 * Phase 2 Admin QA content extension — novels, reviews, comments, replies, likes.
 * Additive on top of the user extension; all records are real Postgres rows.
 */

export const QA_CONTENT_MANIFEST_VERSION = 1;

export const QA_CONTENT_TARGETS = {
  novels: 400,
  reviews: 12000,
  topLevelComments: 6000,
  commentReplies: 2500,
  reviewLikes: 25000,
  commentLikes: 4000,
  folderSaves: 3000,
  notifications: 2000,
  /** Spread activity across this window (days). */
  activityWindowDays: 180,
} as const;

export const QA_CONTENT_RNG_SEED = 20260829_2;
