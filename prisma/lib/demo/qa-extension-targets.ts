/**
 * MoonVerse Admin QA extension — additive demo data targets.
 * Extends the existing 100-user development dataset with 1,529 synthetic users (~1,629 total).
 * All records are stored in Postgres and consumed by real application/admin logic.
 */

export const QA_EXTENSION_EMAIL_DOMAIN = "moonverse.qa";

/** Additional users to import on top of the existing development dataset. */
export const QA_USER_ADD_COUNT = 1529;

export const QA_EXTENSION_TARGETS = {
  reviews: 4800,
  comments: 2400,
  commentReplies: 480,
  likes: 14000,
  commentLikes: 1800,
  follows: 5200,
  folders: 1100,
  folderItems: 4200,
  notifications: 3200,
  readingStatuses: 3600,
  reportsOpen: 98,
  reportsResolved: 62,
  reportsDismissed: 35,
  tagSuggestionsPending: 45,
  tagSuggestionsApproved: 20,
  tagSuggestionsRejected: 28,
  tagSuggestionsMapped: 15,
  readingLinksPending: 32,
  readingLinksNeedsReview: 14,
  readingLinksRejected: 10,
  moonieConversations: 420,
  moonieEvents: 950,
  auditLogs: 140,
  /** Fraction of new QA users marked suspended. */
  suspendedFraction: 0.031,
  /** Fraction without emailVerified timestamp. */
  unverifiedFraction: 0.34,
  /** Fraction of new reviews auto-flagged. */
  autoFlaggedReviewFraction: 0.014,
  /** Fraction of new comments auto-flagged. */
  autoFlaggedCommentFraction: 0.016,
} as const;

export const QA_RNG_SEED = 20260829;
