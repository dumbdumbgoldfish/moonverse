export type MoonieConfidence = "high" | "medium" | "low";

export type MoonieProvenanceSource =
  | "moonverse_catalogue"
  | "moonverse_reviews"
  | "verified_reading_link"
  | "official_publisher"
  | "approved_external"
  | "moonie_reasoning";

export type MoonieMatchEvidenceKind =
  | "canonical_title"
  | "alias"
  | "author"
  | "fuzzy_title"
  | "catalogue_verified"
  | "reading_source"
  | "vision"
  | "genre_tag"
  | "synopsis"
  | "multilingual";

export interface MoonieFieldProvenance {
  field: string;
  source: MoonieProvenanceSource;
  label: string;
}

export interface MoonieMatchEvidence {
  kind: MoonieMatchEvidenceKind;
  label: string;
  score?: number;
}

export type MoonieLookupMode =
  | "exact"
  | "clarification"
  | "partial_memory"
  | "confirmed"
  | "alternatives";

/** Original retrieval intent preserved through candidate clarification. */
export type MoonieLookupPendingIntent =
  | "FIND_READING_SOURCE"
  | "FIND_NOVEL"
  | "NOVEL_OVERVIEW"
  | "NOVEL_REVIEWS";

export interface MoonieLookupCandidate {
  novelId: string;
  title: string;
  canonicalTitle: string;
  author?: string | null;
  coverUrl?: string | null;
  matchedAlias?: string | null;
  confidence: MoonieConfidence;
  confidenceScore: number;
  evidence: MoonieMatchEvidence[];
  genres: string[];
  tags: string[];
  publicationStatus?: string | null;
  originalLanguage?: string | null;
  reason?: string;
  matchPercent?: number;
  provenance?: MoonieFieldProvenance[];
}

export interface MoonieLookupSession {
  mode: MoonieLookupMode;
  query: string;
  candidates: MoonieLookupCandidate[];
  rejectedNovelIds: string[];
  confirmedNovelId?: string | null;
  clues?: string[];
  pendingIntent?: MoonieLookupPendingIntent | null;
}

export type MoonieSourceStatus = "verified" | "none" | "pending";

export type MoonieResponseKind =
  | "chat"
  | "recommendations"
  | "novel_bundle"
  | "compare"
  | "reviews"
  | "catalogue_stat"
  | "error";

export type MoonieRankingMetric =
  | "review_rating"
  | "review_helpful"
  | "review_recent"
  | "review_oldest"
  | "novel_review_count"
  | "novel_average_rating";

export type MoonieEmptyReason =
  | "unknown_status"
  | "no_matches"
  | "unseen_exhausted"
  | "excluded_exhausted"
  | "quota"
  | "error"
  | "retrieval_incomplete";

export type MooniePendingClarification =
  | {
      kind: "review_ranking";
      count: number;
      amongThese: boolean;
    }
  | {
      kind: "review_preference";
      count: number;
    }
  | {
      kind: "constraint_relaxation";
      hard: {
        genres: string[];
        tags: string[];
        inclusionMatch: "all" | "any";
        genreMatch: "all" | "any";
        status: "completed" | "ongoing" | null;
        language: string | null;
        length: "short" | "medium" | "long" | null;
      };
      phase: "pick_constraint" | "genre_or_status";
      offeredGenre?: string;
    }
  | {
      kind: "compare_titles";
      unresolvedTitles?: string[];
      resolvedNovelIds?: string[];
    };

export interface MoonieRankedReview {
  id: string;
  title: string;
  excerpt: string;
  rating: number;
  reviewerName: string;
  reviewerUsername?: string | null;
  novelId: string;
  novelTitle: string;
  containsSpoilers: boolean;
  likeCount?: number;
  commentCount?: number;
}

export interface MoonieCatalogueStat {
  metric: MoonieRankingMetric;
  novelId: string;
  title: string;
  count: number;
  ties: Array<{ novelId: string; title: string; count: number }>;
}

export type MoonieLoadingPhase =
  | "thinking"
  | "searching"
  | "verifying"
  | "reading_image"
  | "matching_titles"
  | "transcribing"
  | "looking_up"
  | "comparing"
  | "parsing_file";

export type MoonieSpoilerMode = "none" | "light" | "full";

export type MoonieResponseState =
  | "empty"
  | "loading"
  | "no_results"
  | "rate_limit"
  | "error"
  | "off_topic";

export interface MoonieReadingSource {
  label: string;
  url: string;
  platform: string;
  badge: "official" | "verified" | "community" | "unverified";
  healthStatus?: "UNKNOWN" | "HEALTHY" | "BROKEN" | "REDIRECTED" | "STALE";
  healthNote?: string | null;
  lastCheckedAt?: string | null;
}

export interface MoonieReviewPreview {
  id: string;
  title: string;
  excerpt: string;
  rating: number;
  reviewerName: string;
  reviewedAt?: string | null;
}

export interface MoonieCommunityInsight {
  averageRating: number | null;
  reviewCount: number;
  previews: MoonieReviewPreview[];
  consensus: string | null;
  signalLevel?: import("@/lib/moonie/community-consensus").MoonieCommunitySignalLevel;
  signalLabel?: string;
  disclaimer?: string | null;
  praised?: import("@/lib/moonie/community-consensus").MoonieCommunityTheme[];
  criticised?: import("@/lib/moonie/community-consensus").MoonieCommunityTheme[];
  mixed?: import("@/lib/moonie/community-consensus").MoonieCommunityTheme[];
  divisive?: import("@/lib/moonie/community-consensus").MoonieCommunityTheme[];
}

export type MoonieSeriesRelationType =
  | "MAIN"
  | "PREQUEL"
  | "SEQUEL"
  | "SIDE_STORY"
  | "SPINOFF";

export interface MoonieSeriesEntry {
  novelId: string;
  title: string;
  order: number;
  relationType: MoonieSeriesRelationType;
  author?: string | null;
  coverUrl?: string | null;
}

export interface MoonieSeriesInfo {
  seriesId: string;
  name: string;
  description?: string | null;
  entries: MoonieSeriesEntry[];
  allEntries?: MoonieSeriesEntry[];
  currentNovelId?: string | null;
  readingOrderComplete: boolean;
  focusKind:
    | "full_series"
    | "reading_order"
    | "next"
    | "before"
    | "first"
    | "standalone"
    | "membership"
    | "book_number"
    | "sequel_check";
  highlightedNovelIds?: string[];
}

export interface MoonieNovelOverview {
  novelId: string;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  publicationStatus?: string | null;
  originalLanguage?: string | null;
  genres: string[];
  tags: string[];
  synopsis?: string | null;
  readingSources: MoonieReadingSource[];
  community: MoonieCommunityInsight | null;
  provenance?: MoonieFieldProvenance[];
  matchedAlias?: string | null;
  confidence?: MoonieConfidence;
}

export interface MoonieNovelReviewGroup {
  novelId: string;
  title: string;
  overview: MoonieNovelOverview;
}

export interface MoonieCompareRow {
  novelId: string;
  title: string;
  author: string | null;
  publicationStatus: string | null;
  genres: string[];
  tags: string[];
  averageRating: number | null;
  reviewCount: number;
  sourceStatus: MoonieSourceStatus;
  hasVerifiedSource: boolean;
  romanceSignals: string[];
  toneSignals: string[];
  pacingSignals: string[];
  missing: string[];
}

export interface MoonieCompareResult {
  rows: MoonieCompareRow[];
  recommendations: MoonieRecommendation[];
  reply: string;
  conclusion?: string;
  unresolvedTitles?: string[];
}

export interface MoonieInterpretedPreferences {
  genres: string[];
  tags: string[];
  excludedTags: string[];
  status: string | null;
  mood: string[];
  language: string | null;
  length?: string | null;
  influencedBy?: string[];
}

export interface MoonieScoreBreakdown {
  semantic: number;
  structured: number;
  quality: number;
  history: number;
  diversity: number;
}

export interface MoonieRecommendation {
  novelId: string;
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  reason: string;
  reasons?: string[];
  drawback?: string | null;
  genres: string[];
  tags?: string[];
  matchingLabels?: string[];
  confidence: MoonieConfidence;
  matchPercent?: number;
  scoreBreakdown?: MoonieScoreBreakdown;
  influencedBy?: string[];
  publicationStatus?: string | null;
  averageRating?: number | null;
  reviewCount?: number;
  reviewId?: string;
  sourceStatus: MoonieSourceStatus;
  availableOn?: string[];
  primaryReadUrl?: string;
  platformName?: string;
  readingSources?: MoonieReadingSource[];
  provenance?: MoonieFieldProvenance[];
  matchEvidence?: MoonieMatchEvidence[];
  matchedAlias?: string | null;
  personalizationReasons?: string[];
  community?: MoonieCommunityInsight | null;
}

export interface MoonieReviewerResult {
  id: string;
  displayName: string;
  username: string;
  avatarInitials: string;
  avatarUrl?: string | null;
  reviewCount: number;
  followerCount: number;
  isFollowing?: boolean;
}

export interface MoonieReviewerSession {
  reviewers: MoonieReviewerResult[];
  rankBy: "reviews" | "followers";
  queryType: "ranking" | "lookup";
  activeReviewerId?: string | null;
}

export interface MoonieReviewerReviewPreview {
  id: string;
  title: string;
  rating: number;
  novelId: string;
  novelTitle: string;
}

export interface MoonieReviewerReviewEntry {
  reviewId: string;
  reviewTitle: string;
  novelId: string;
  novelTitle: string;
  rating: number;
  order: number;
}

export interface MoonieReviewerReviewSession {
  reviewerId: string;
  reviewerDisplayName: string;
  reviews: MoonieReviewerReviewEntry[];
  activeReviewIndex?: number | null;
}

export interface MoonieReviewerGroupItem {
  id: string;
  displayName: string;
  username: string;
  avatarInitials: string;
  avatarUrl?: string | null;
  reviewCount: number;
  followerCount: number;
  bio?: string | null;
  topGenres: string[];
  isFollowing?: boolean;
  recentReview?: {
    id: string;
    title: string;
    novelTitle: string;
    rating: number;
  } | null;
}

export interface MoonieReviewerGroupOverview {
  reviewers: MoonieReviewerGroupItem[];
  emphasizeAuthoredReviews?: boolean;
}

export interface MoonieReviewerOverview {
  id: string;
  displayName: string;
  username: string;
  avatarInitials: string;
  avatarUrl?: string | null;
  bio?: string | null;
  reviewCount: number;
  followerCount: number;
  followingCount: number;
  averageRatingGiven?: number | null;
  topGenres: string[];
  recentReviews: MoonieReviewerReviewPreview[];
  isFollowing?: boolean;
  emphasizeAuthoredReviews?: boolean;
}

export interface MoonieChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Client-only presentation hint; never persist with conversation history. */
  animateEntrance?: boolean;
  /** Session / resume display metadata for sent attachments (no binary payloads). */
  userAttachment?: MoonieUserAttachmentDisplay;
  recommendations?: MoonieRecommendation[];
  novelOverview?: MoonieNovelOverview;
  novelReviewGroups?: MoonieNovelReviewGroup[];
  followUpQuestion?: string | null;
  quickPrompts?: string[];
  interpretedPreferences?: MoonieInterpretedPreferences;
  isError?: boolean;
  state?: MoonieResponseState;
  /** Which quota audience produced a rate_limit card — avoids cross-session copy drift. */
  quotaAudience?: "guest" | "member";
  responseKind?: MoonieResponseKind;
  compare?: MoonieCompareResult;
  lookupSession?: MoonieLookupSession;
  analyticsIntent?: string;
  reviewerResults?: MoonieReviewerResult[];
  reviewerSession?: MoonieReviewerSession;
  reviewerOverview?: MoonieReviewerOverview;
  reviewerGroupOverview?: MoonieReviewerGroupOverview;
  reviewerReviewSession?: MoonieReviewerReviewSession;
  seriesInfo?: MoonieSeriesInfo | null;
  emptyReason?: MoonieEmptyReason;
  pendingClarification?: MooniePendingClarification | null;
  rankedReviews?: MoonieRankedReview[];
  catalogueStat?: MoonieCatalogueStat;
  rankingMetric?: MoonieRankingMetric | null;
  requestedCount?: number;
  explicitCountedReviews?: boolean;
  lookupContextSuppressed?: boolean;
}

export type MoonieUserAttachmentType = "image" | "file" | "voice";

/** Lightweight attachment display for user chat bubbles (not full file/image payloads). */
export interface MoonieUserAttachmentDisplay {
  type: MoonieUserAttachmentType;
  name?: string;
  mimeType?: string;
  /** Session-only data URL for optimistic image preview; not persisted to the database. */
  imagePreviewUrl?: string;
}

export interface MooniePersistedUserAttachment {
  type: MoonieUserAttachmentType;
  name?: string;
  mimeType?: string;
}

export interface MoonieRecommendResponse {
  reply: string;
  summary?: string;
  recommendations: MoonieRecommendation[];
  interpretedPreferences?: MoonieInterpretedPreferences;
  followUpQuestion?: string | null;
  quickPrompts?: string[];
  conversationId?: string;
  guestTurnsRemaining?: number;
  quotaRemaining?: number;
  state?: MoonieResponseState;
  responseKind?: MoonieResponseKind;
  loadingPhase?: MoonieLoadingPhase;
  novelOverview?: MoonieNovelOverview;
  novelReviewGroups?: MoonieNovelReviewGroup[];
  compare?: MoonieCompareResult;
  lookupSession?: MoonieLookupSession;
  consumesQuota?: boolean;
  spoilerMode?: MoonieSpoilerMode;
  analyticsIntent?: string;
  rememberPreferenceOffer?: Partial<MoonieInterpretedPreferences> | null;
  reviewerResults?: MoonieReviewerResult[];
  reviewerSession?: MoonieReviewerSession;
  reviewerOverview?: MoonieReviewerOverview;
  reviewerGroupOverview?: MoonieReviewerGroupOverview;
  reviewerReviewSession?: MoonieReviewerReviewSession;
  seriesInfo?: MoonieSeriesInfo | null;
  analyticsConfidenceTier?: MoonieConfidence | null;
  emptyReason?: MoonieEmptyReason;
  pendingClarification?: MooniePendingClarification | null;
  rankedReviews?: MoonieRankedReview[];
  catalogueStat?: MoonieCatalogueStat;
  rankingMetric?: MoonieRankingMetric | null;
  requestedCount?: number;
  explicitCountedReviews?: boolean;
  lookupContextSuppressed?: boolean;
}

export interface MoonieRecommendErrorResponse {
  error: string;
  rateLimited?: boolean;
  quotaRemaining?: number;
}

export interface MoonieTasteProfileView {
  favouriteGenres: string[];
  favouriteTags: string[];
  favouriteMoods?: string[];
  preferredPlatforms?: string[];
  avoidedTags: string[];
  preferredStatus: string | null;
  preferredLength: string | null;
  romanceLevel: string | null;
  preferredProtagonist: string | null;
  preferredLanguage: string | null;
  useTasteByDefault: boolean;
  preferredGenreNamesFromOnboarding: string[];
  readingStatusCount: number;
  personalization?: {
    useSavedNovels: boolean;
    useSavedReviews: boolean;
    useReadingList: boolean;
    useLikes: boolean;
    useFollowedReviewers: boolean;
    useSearchHistory: boolean;
  };
}
