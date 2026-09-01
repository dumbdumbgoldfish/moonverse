import {
  ContentModerationStatus,
  ReadingLinkModerationStatus,
} from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeConfidence } from "@/lib/moonie/guardrails";
import {
  compareQueryAlignsWithLookup,
  isAcceptedCompareCatalogueMatch,
} from "@/lib/moonie/compare-acceptance";
import { matchPercent } from "@/lib/moonie/ranking";
import { buildCatalogueFieldProvenance } from "@/lib/moonie/provenance";
import {
  scoreCatalogueCandidates,
  fetchNovelCandidatesByIds,
} from "@/services/moonie-identification.service";
import {
  findCandidateNovels,
  type NovelCandidate,
} from "@/services/moonie-pipeline.service";
import type {
  MoonieCommunityInsight,
  MoonieLookupCandidate,
  MoonieNovelOverview,
  MoonieReadingSource,
  MoonieRecommendation,
  MoonieSourceStatus,
  MoonieSpoilerMode,
} from "@/types/moonie";
import type { NovelFactualField } from "@/lib/moonie/intent";
import {
  sanitizeCommunityInsightForMode,
  sanitizeReviewExcerpt,
  sanitizeReviewTitleForMode,
} from "@/lib/moonie/spoiler-mode";
import { constraintEligiblePublicationStatus } from "@/lib/moonie/metadata-eligibility";
import { moonieDisplayCoverUrl } from "@/lib/review-utils";
import {
  isPromotableReadingLinkHealth,
  readingLinkHealthNote,
} from "@/lib/reading-link/health-check";
import {
  buildCommunityConsensusFromReviews,
  communityDisclaimer,
  communitySignalLabel,
  communitySignalLevel,
} from "@/lib/moonie/community-consensus";

async function resolveReadingSources(novelId: string): Promise<{
  status: MoonieSourceStatus;
  availableOn: string[];
  primaryReadUrl?: string;
  platformName?: string;
  sources: MoonieReadingSource[];
}> {
  const links = await db.readingLink.findMany({
    where: {
      novelId,
      active: true,
      moderationStatus: {
        in: [
          ReadingLinkModerationStatus.APPROVED,
          ReadingLinkModerationStatus.PENDING,
          ReadingLinkModerationStatus.NEEDS_REVIEW,
        ],
      },
    },
    orderBy: [{ isVerified: "desc" }, { isOfficial: "desc" }, { sortOrder: "asc" }],
  });

  const sources: MoonieReadingSource[] = links.slice(0, 6).map((link) => {
    const badge =
      link.moderationStatus === ReadingLinkModerationStatus.APPROVED &&
      link.isOfficial
        ? "official"
        : link.moderationStatus === ReadingLinkModerationStatus.APPROVED &&
            link.isVerified
          ? "verified"
          : link.moderationStatus === ReadingLinkModerationStatus.APPROVED
            ? "community"
            : "unverified";
    return {
      label: link.label || link.platform,
      url: link.url,
      platform: link.platform,
      badge,
      healthStatus: link.healthStatus,
      lastCheckedAt: link.lastCheckedAt?.toISOString() ?? null,
      healthNote: readingLinkHealthNote({
        healthStatus: link.healthStatus,
        lastCheckedAt: link.lastCheckedAt,
        badge,
      }),
    };
  });

  const promotable = sources.filter((source) =>
    isPromotableReadingLinkHealth(
      source.healthStatus ?? "UNKNOWN",
      source.lastCheckedAt ? new Date(source.lastCheckedAt) : null
    )
  );

  const verified = promotable.filter(
    (source) => source.badge === "official" || source.badge === "verified"
  );

  if (verified.length > 0) {
    const primary = verified[0];
    return {
      status: "verified",
      availableOn: verified.map((source) => source.label),
      primaryReadUrl: primary.url,
      platformName: primary.label,
      sources,
    };
  }

  const communityPromotable = promotable.filter(
    (source) => source.badge === "community"
  );
  if (communityPromotable.length > 0) {
    const primary = communityPromotable[0];
    return {
      status: "verified",
      availableOn: communityPromotable.map((source) => source.label),
      primaryReadUrl: primary.url,
      platformName: primary.label,
      sources,
    };
  }

  if (sources.length > 0 && promotable.length === 0) {
    return {
      status: "none",
      availableOn: [],
      sources,
    };
  }

  const pending = sources.some((source) => source.badge === "unverified");
  if (pending) {
    return { status: "pending", availableOn: [], sources };
  }

  return { status: "none", availableOn: [], sources };
}

export async function buildCommunityInsight(
  novelId: string,
  spoilerMode: MoonieSpoilerMode = "none"
): Promise<MoonieCommunityInsight | null> {
  const reviewWhere =
    spoilerMode === "none"
      ? {
          novelId,
          moderationStatus: ContentModerationStatus.OK,
          containsSpoilers: false,
        }
      : { novelId, moderationStatus: ContentModerationStatus.OK };

  const reviews = await db.review.findMany({
    where: reviewWhere,
    orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
    take: 3,
    select: {
      id: true,
      title: true,
      body: true,
      rating: true,
      containsSpoilers: true,
      createdAt: true,
      user: { select: { displayName: true, username: true } },
    },
  });

  const aggregate = await db.review.aggregate({
    where: reviewWhere,
    _avg: { rating: true },
    _count: { _all: true },
  });

  const count = aggregate._count._all;
  if (count === 0) return null;

  const averageRating = aggregate._avg.rating ?? null;
  const signalLevel = communitySignalLevel(count);
  const signalLabel = communitySignalLabel(signalLevel);
  const disclaimer = communityDisclaimer(count, signalLevel);

  const consensusSnippets = await db.review.findMany({
    where: reviewWhere,
    select: { rating: true, title: true, body: true, containsSpoilers: true },
    take: 40,
    orderBy: [{ likeCount: "desc" }, { createdAt: "desc" }],
  });

  const themeConsensus = buildCommunityConsensusFromReviews(
    consensusSnippets
      .map((review) => {
        const excerpt = sanitizeReviewExcerpt({
          title: review.title,
          body: review.body,
          containsSpoilers: review.containsSpoilers,
          mode: spoilerMode,
        });
        if (!excerpt) return null;
        const safeTitle = sanitizeReviewTitleForMode({
          title: review.title,
          containsSpoilers: review.containsSpoilers,
          mode: spoilerMode,
        });
        return {
          rating: review.rating,
          text: `${safeTitle} ${excerpt}`,
        };
      })
      .filter((row): row is { rating: number; text: string } => row != null)
  );

  let consensus: string | null = null;
  if (themeConsensus && themeConsensus.praised.length > 0) {
    consensus = `Readers often praise ${themeConsensus.praised
      .slice(0, 2)
      .map((t) => t.label)
      .join(" and ")}.`;
  } else if (count >= 3) {
    consensus =
      "MoonVerse readers have shared enough reviews to form an early consensus. Open the novel page for the full salon.";
  } else if (count > 0) {
    consensus = disclaimer;
  }

  return {
    averageRating,
    reviewCount: count,
    previews: reviews
      .map((review) => {
        const excerpt = sanitizeReviewExcerpt({
          title: review.title,
          body: review.body,
          containsSpoilers: review.containsSpoilers,
          mode: spoilerMode,
        });
        if (!excerpt) return null;
        return {
          id: review.id,
          title: sanitizeReviewTitleForMode({
            title: review.title,
            containsSpoilers: review.containsSpoilers,
            mode: spoilerMode,
          }),
          excerpt,
          rating: review.rating,
          reviewerName:
            review.user.displayName?.trim() || review.user.username || "Reader",
          reviewedAt: review.createdAt.toISOString(),
        };
      })
      .filter((preview): preview is NonNullable<typeof preview> => preview != null),
    consensus,
    signalLevel: themeConsensus?.signalLevel ?? signalLevel,
    signalLabel: themeConsensus?.signalLabel ?? signalLabel,
    disclaimer: themeConsensus?.disclaimer ?? disclaimer,
    praised: themeConsensus?.praised ?? [],
    criticised: themeConsensus?.criticised ?? [],
    mixed: themeConsensus?.mixed ?? [],
    divisive: themeConsensus?.divisive ?? [],
  };
}

/** Re-sanitize stored recommendation community blocks under the active spoiler mode. */
export async function refreshRecommendationsForSpoilerMode(
  recommendations: MoonieRecommendation[],
  spoilerMode: MoonieSpoilerMode
): Promise<MoonieRecommendation[]> {
  if (spoilerMode === "full") return recommendations;

  return Promise.all(
    recommendations.map(async (rec) => {
      if (!rec.community) return rec;
      try {
        const community = await buildCommunityInsight(rec.novelId, spoilerMode);
        if (community) {
          return { ...rec, community };
        }
      } catch {
        // Fall through to stored-community sanitization when refresh fails.
      }
      return {
        ...rec,
        community: sanitizeCommunityInsightForMode(rec.community, spoilerMode, {
          unverifiedStoredFallback: true,
        }),
      };
    })
  );
}

function candidateToRecommendation(
  candidate: NovelCandidate,
  source: Awaited<ReturnType<typeof resolveReadingSources>>,
  reason: string,
  lookup?: MoonieLookupCandidate | null
): MoonieRecommendation {
  const confidence = lookup?.confidence ??
    normalizeConfidence(
      candidate.score >= 0.55 ? "high" : candidate.score >= 0.35 ? "medium" : "low"
    );
  const primaryBadge = source.sources[0]?.badge;

  return {
    novelId: candidate.id,
    title: candidate.title,
    author: candidate.author,
    coverUrl: moonieDisplayCoverUrl(candidate.coverUrl, lookup?.coverUrl),
    reason,
    reasons: lookup?.evidence.map((e) => e.label) ?? [reason],
    drawback: candidate.reviewCount === 0 ? "Few MoonVerse reviews yet." : null,
    genres: candidate.genres,
    tags: candidate.tags.slice(0, 6),
    matchingLabels: lookup?.evidence.map((e) => e.label).slice(0, 3) ??
      candidate.genres.slice(0, 2),
    confidence,
    matchPercent: lookup?.matchPercent ?? matchPercent(candidate.score),
    scoreBreakdown: candidate.scoreBreakdown,
    publicationStatus: constraintEligiblePublicationStatus(
      candidate.metadataSource,
      candidate.publicationStatus,
      candidate.genres,
      candidate.tags
    ),
    averageRating: candidate.averageRating,
    reviewCount: candidate.reviewCount,
    reviewId: candidate.topReviewId ?? undefined,
    sourceStatus: source.status,
    availableOn: source.availableOn,
    primaryReadUrl: source.primaryReadUrl,
    platformName: source.platformName,
    readingSources: source.sources,
    provenance: lookup?.provenance ??
      buildCatalogueFieldProvenance({
        hasCommunity: candidate.reviewCount > 0,
        readingLinkBadge: primaryBadge,
      }),
    matchEvidence: lookup?.evidence,
    matchedAlias: lookup?.matchedAlias ?? null,
  };
}

async function loadCandidateById(
  novelId: string,
  _userId?: string
): Promise<NovelCandidate | null> {
  void _userId;
  const rows = await fetchNovelCandidatesByIds([novelId]);
  return rows[0] ?? null;
}

export async function searchCatalogueByTitle(
  query: string,
  userId?: string
): Promise<NovelCandidate | null> {
  const scored = await scoreCatalogueCandidates({
    query,
    userId,
    limit: 5,
  });

  if (scored.length === 0) return null;

  const top = scored[0]!;
  const candidates = await findCandidateNovels({
    prefs: {
      genres: [],
      tags: [],
      excludedTags: [],
      status: null,
      mood: [],
      language: null,
      length: null,
    },
    userId,
    queryText: top.canonicalTitle,
    strictGenreFilter: false,
    limit: 5,
  });

  const exact = candidates.find((c) => c.id === top.novelId);
  if (exact) return exact;
  const [byId] = await fetchNovelCandidatesByIds([top.novelId]);
  return byId ?? null;
}

export async function resolveCatalogueTitleForCompare(
  query: string,
  userId?: string
): Promise<{
  candidate: NovelCandidate;
  lookup: MoonieLookupCandidate;
} | null> {
  const scored = await scoreCatalogueCandidates({
    query,
    userId,
    preferRawTitleQuery: true,
    explicitTitleLookup: true,
    limit: 5,
  });

  const top = scored[0];
  if (!top || !isAcceptedCompareCatalogueMatch(top)) {
    return null;
  }
  if (!compareQueryAlignsWithLookup(query, top)) {
    return null;
  }

  const [candidate] = await fetchNovelCandidatesByIds([top.novelId]);
  if (!candidate) {
    return null;
  }

  return { candidate, lookup: top };
}

export async function buildNovelBundle(options: {
  novelId?: string;
  titleQuery?: string;
  userId?: string;
  reason?: string;
  spoilerMode?: MoonieSpoilerMode;
  lookupCandidate?: MoonieLookupCandidate;
}): Promise<{
  recommendation: MoonieRecommendation | null;
  overview: MoonieNovelOverview | null;
  community: MoonieCommunityInsight | null;
}> {
  let candidate: NovelCandidate | null = null;

  if (options.novelId) {
    candidate = await loadCandidateById(options.novelId, options.userId);
  }

  if (!candidate && options.titleQuery) {
    candidate = await searchCatalogueByTitle(options.titleQuery, options.userId);
  }

  if (!candidate) {
    return { recommendation: null, overview: null, community: null };
  }

  const spoilerMode = options.spoilerMode ?? "none";
  const source = await resolveReadingSources(candidate.id);
  const community = await buildCommunityInsight(candidate.id, spoilerMode);
  const lookup = options.lookupCandidate ?? null;
  const reason =
    options.reason ??
    `Verified match in the MoonVerse catalogue for "${candidate.title}".`;

  const recommendation = candidateToRecommendation(
    candidate,
    source,
    reason,
    lookup
  );

  if (community) {
    recommendation.reviewCount = community.reviewCount;
    recommendation.averageRating = community.averageRating;
  }

  const primaryBadge = source.sources[0]?.badge;

  const overview: MoonieNovelOverview = {
    novelId: candidate.id,
    title: candidate.title,
    author: candidate.author,
    coverUrl: moonieDisplayCoverUrl(candidate.coverUrl, lookup?.coverUrl),
    publicationStatus: constraintEligiblePublicationStatus(
      candidate.metadataSource,
      candidate.publicationStatus,
      candidate.genres,
      candidate.tags
    ),
    originalLanguage: candidate.originalLanguage,
    genres: candidate.genres,
    tags: candidate.tags.slice(0, 8),
    synopsis: spoilerMode === "full" ? candidate.synopsis : null,
    readingSources: source.sources,
    community,
    provenance:
      lookup?.provenance ??
      buildCatalogueFieldProvenance({
        hasCommunity: Boolean(community),
        readingLinkBadge: primaryBadge,
      }),
    matchedAlias: lookup?.matchedAlias ?? null,
    confidence: lookup?.confidence ?? recommendation.confidence,
  };

  return { recommendation, overview, community };
}

function pickPromotableReadingSource(
  sources: MoonieReadingSource[]
): MoonieReadingSource | null {
  for (const source of sources) {
    if (
      isPromotableReadingLinkHealth(
        source.healthStatus ?? "UNKNOWN",
        source.lastCheckedAt ? new Date(source.lastCheckedAt) : null
      )
    ) {
      return source;
    }
  }
  return null;
}

function formatReadingLinkEmphasis(overview: MoonieNovelOverview): string {
  if (overview.readingSources.length === 0) {
    return `I found **${overview.title}**, but MoonVerse doesn't currently have a verified reading source for it.`;
  }

  const primary = pickPromotableReadingSource(overview.readingSources);
  if (!primary) {
    return `MoonVerse has reading links for **${overview.title}**, but none are currently confirmed working.`;
  }

  const badgeLabel =
    primary.badge === "official"
      ? "Official"
      : primary.badge === "verified"
        ? "Verified"
        : "Source";
  const healthSuffix = primary.healthNote ? ` ${primary.healthNote}` : "";
  const parts: string[] = [`**${overview.title}**`];
  if (overview.author) parts.push(`by ${overview.author}`);
  parts.push(
    `Where to read: ${primary.label} (${badgeLabel}).${healthSuffix}`
  );
  return parts.join(" ");
}

export function formatNovelFactualFieldReply(
  overview: MoonieNovelOverview,
  field: NovelFactualField
): string {
  const title = overview.title;

  switch (field) {
    case "author":
      return overview.author
        ? `**${title}** is listed with author **${overview.author}** in the MoonVerse catalogue.`
        : `MoonVerse does not list an author for **${title}**.`;
    case "genre":
      if (overview.genres.length === 0) {
        return `MoonVerse does not list genres for **${title}**.`;
      }
      return `**${title}** is catalogued under ${overview.genres.join(", ")}.`;
    case "tags":
      if (overview.tags.length === 0) {
        return `MoonVerse does not list tags for **${title}**.`;
      }
      return `**${title}** is tagged with ${overview.tags.join(", ")}.`;
    case "status":
      if (overview.publicationStatus) {
        return `**${title}** is listed as **${overview.publicationStatus}** in the MoonVerse catalogue.`;
      }
      return `MoonVerse does not list a publication status for **${title}**.`;
    case "rating":
      const community = overview.community;
      if (!community || community.averageRating == null) {
        return `MoonVerse does not have an average rating for **${title}** yet.`;
      }
      return `**${title}** has a **${community.averageRating.toFixed(1)}/5** average rating on MoonVerse across ${community.reviewCount} review${community.reviewCount === 1 ? "" : "s"}.`;
    case "review_count":
      const reviewCommunity = overview.community;
      if (!reviewCommunity || reviewCommunity.reviewCount === 0) {
        return `There aren't any public MoonVerse reviews for **${title}** yet.`;
      }
      return `**${title}** has **${reviewCommunity.reviewCount}** public MoonVerse review${reviewCommunity.reviewCount === 1 ? "" : "s"}.`;
    case "reading_link":
      return formatNovelBundleReply({
        overview,
        emphasizeReadingLink: true,
      });
    case "review_link":
      return `You can read MoonVerse reviews for **${title}** at /novels/${overview.novelId}.`;
  }
}

export function formatNovelBundleReply(options: {
  overview: MoonieNovelOverview;
  emphasizeReadingLink?: boolean;
  emphasizeReviews?: boolean;
  emphasizeStatus?: boolean;
}): string {
  const { overview } = options;

  if (options.emphasizeStatus) {
    const title = overview.title;
    if (overview.publicationStatus) {
      return `${title} is listed as **${overview.publicationStatus}** in the MoonVerse catalogue.`;
    }
    return `MoonVerse does not list a publication status for **${title}**.`;
  }

  if (options.emphasizeReviews) {
    const title = overview.title;
    const community = overview.community;

    if (!community || community.reviewCount === 0) {
      return `There aren't any MoonVerse reviews for **${title}** yet.`;
    }

    const { reviewCount, averageRating } = community;
    const ratingSuffix =
      averageRating != null
        ? ` · ${averageRating.toFixed(1)} average`
        : "";
    return `I found ${reviewCount} MoonVerse review${reviewCount === 1 ? "" : "s"} for **${title}**${ratingSuffix}.`;
  }

  if (options.emphasizeReadingLink && !options.emphasizeReviews) {
    return formatReadingLinkEmphasis(overview);
  }

  const parts: string[] = [`**${overview.title}**`];
  if (overview.author) parts.push(`by ${overview.author}`);
  if (overview.publicationStatus) {
    parts.push(`Status: ${overview.publicationStatus}.`);
  }

  if (options.emphasizeReadingLink) {
    const primary = pickPromotableReadingSource(overview.readingSources);
    if (primary) {
      const badgeLabel =
        primary.badge === "official"
          ? "Official"
          : primary.badge === "verified"
            ? "Verified"
            : "Source";
      const healthSuffix = primary.healthNote ? ` ${primary.healthNote}` : "";
      parts.push(
        `Where to read: ${primary.label} (${badgeLabel}).${healthSuffix}`
      );
    } else if (overview.readingSources.length > 0) {
      parts.push(
        "MoonVerse has reading links for this novel, but none are currently confirmed working."
      );
    } else {
      parts.push(
        "I found the novel, but I could not verify a reading link on MoonVerse yet."
      );
    }
  }

  if (overview.community) {
    const rating =
      overview.community.averageRating != null
        ? `${overview.community.averageRating.toFixed(1)}/5`
        : "no rating yet";
    parts.push(
      `MoonVerse: ${rating} across ${overview.community.reviewCount} review${overview.community.reviewCount === 1 ? "" : "s"}.`
    );
    if (options.emphasizeReviews && overview.community.consensus) {
      parts.push(overview.community.consensus);
    }
  } else if (options.emphasizeReviews) {
    parts.push("No MoonVerse reviews yet for this title.");
  }

  return parts.join(" ");
}
