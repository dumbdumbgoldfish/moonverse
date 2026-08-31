import {
  enumerateCompareTitleParses,
  extractCompareTitles,
  extractOrdinalCompareTitlesFromRecommendations,
  extractTitlesFromMultiline,
  isCompareTheseMessage,
  preferCompareTitleParse,
} from "@/lib/moonie/intent";
import { spoilerConstraintForOpenAI } from "@/lib/moonie/spoiler-mode";
import { constraintEligiblePublicationStatus } from "@/lib/moonie/metadata-eligibility";
import {
  buildNovelBundle,
  resolveCatalogueTitleForCompare,
} from "@/services/moonie-novel-lookup.service";
import { FILE_ATTACHMENT_MAX_TITLES } from "@/lib/moonie/file-attachment";
import type {
  MoonieCompareResult,
  MoonieCompareRow,
  MoonieSpoilerMode,
} from "@/types/moonie";

const ROMANCE_TAG_RE =
  /\b(romance|romantic|slow.?burn|love interest|harem|bl|gl|ml|fl)\b/i;
const DARK_TAG_RE =
  /\b(dark|grim|horror|psychological|tragedy|angst|brutal|mature)\b/i;
const PACING_TAG_RE =
  /\b(fast.?paced|slow.?burn|slice.?of.?life|action|adventure)\b/i;

function tagSignals(tags: string[], pattern: RegExp): string[] {
  return tags.filter((tag) => pattern.test(tag));
}

function buildCompareRow(
  bundle: Awaited<ReturnType<typeof buildNovelBundle>>,
  eligibleStatus: string | null
): MoonieCompareRow | null {
  if (!bundle.recommendation || !bundle.overview) return null;
  const rec = bundle.recommendation;
  const tags = bundle.overview.tags;
  const missing: string[] = [];

  if (!eligibleStatus) missing.push("completion status");
  if (rec.averageRating == null) missing.push("community rating");
  if ((rec.reviewCount ?? 0) === 0) missing.push("MoonVerse reviews");
  if (rec.sourceStatus === "none") missing.push("verified reading source");

  const romanceSignals = tagSignals(tags, ROMANCE_TAG_RE);
  const toneSignals = tagSignals(tags, DARK_TAG_RE);
  const pacingSignals = tagSignals(tags, PACING_TAG_RE);

  if (romanceSignals.length === 0) missing.push("romance level (no romance tags)");
  if (toneSignals.length === 0) missing.push("darkness/tone (no matching tags)");
  if (pacingSignals.length === 0) missing.push("pacing (no matching tags)");

  return {
    novelId: rec.novelId,
    title: rec.title,
    author: rec.author ?? null,
    publicationStatus: eligibleStatus,
    genres: rec.genres,
    tags: tags.slice(0, 8),
    averageRating: rec.averageRating ?? null,
    reviewCount: rec.reviewCount ?? 0,
    sourceStatus: rec.sourceStatus,
    hasVerifiedSource: rec.sourceStatus === "verified",
    romanceSignals,
    toneSignals,
    pacingSignals,
    missing,
  };
}

function compareConclusion(rows: MoonieCompareRow[]): string {
  if (rows.length < 2) {
    return "I need at least two verified catalogue matches to compare.";
  }

  const parts: string[] = [];

  const byRating = [...rows].sort(
    (a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0)
  );
  if (
    byRating[0].averageRating != null &&
    byRating[1].averageRating != null &&
    byRating[0].averageRating !== byRating[1].averageRating
  ) {
    parts.push(
      `Choose ${byRating[0].title} if you want the higher MoonVerse rating (${byRating[0].averageRating?.toFixed(1)}/5 across ${byRating[0].reviewCount} reviews).`
    );
    parts.push(
      `Choose ${byRating[1].title} if you prefer the alternative tone/tags (${byRating[1].genres.slice(0, 2).join(", ") || "see tags above"}).`
    );
  }

  const darker = rows.filter((row) => row.toneSignals.length > 0);
  if (darker.length === 1) {
    parts.push(
      `For a darker tone (from MoonVerse tags), ${darker[0].title} is the stronger match (${darker[0].toneSignals.join(", ")}).`
    );
  }

  const lessRomance = rows
    .map((row) => ({ row, count: row.romanceSignals.length }))
    .sort((a, b) => a.count - b.count);
  if (
    lessRomance[0].count < lessRomance[lessRomance.length - 1].count &&
    lessRomance[0].count === 0
  ) {
    parts.push(
      `For lower romance signals in tags, ${lessRomance[0].row.title} has fewer romance-tagged signals.`
    );
  }

  const completed = rows.filter(
    (row) => row.publicationStatus?.toLowerCase() === "completed"
  );
  if (completed.length === 1 && rows.length === 2) {
    const other = rows.find((row) => row.novelId !== completed[0].novelId);
    if (other && other.publicationStatus?.toLowerCase() !== "completed") {
      parts.push(
        `Choose ${completed[0].title} if you want a completed catalogue status.`
      );
    }
  }

  if (parts.length === 0) {
    return "Both titles are verified on MoonVerse. Use genres, tags, and ratings above to decide — I only label attributes backed by catalogue or review data.";
  }

  return parts.join(" ");
}

async function resolveCompareTitlesToRows(options: {
  titles: string[];
  userId?: string;
  spoilerMode?: MoonieSpoilerMode;
}): Promise<{
  rows: MoonieCompareRow[];
  recommendations: NonNullable<
    Awaited<ReturnType<typeof buildNovelBundle>>["recommendation"]
  >[];
  unresolvedTitles: string[];
}> {
  const rows: MoonieCompareRow[] = [];
  const recommendations: NonNullable<
    Awaited<ReturnType<typeof buildNovelBundle>>["recommendation"]
  >[] = [];
  const unresolvedTitles: string[] = [];
  const seen = new Set<string>();

  for (const title of options.titles) {
    const resolved = await resolveCatalogueTitleForCompare(title, options.userId);
    if (!resolved) {
      unresolvedTitles.push(title);
      continue;
    }
    if (seen.has(resolved.candidate.id)) {
      continue;
    }

    const bundle = await buildNovelBundle({
      novelId: resolved.candidate.id,
      userId: options.userId,
      reason: `Verified catalogue entry for comparison: "${resolved.candidate.title}".`,
      spoilerMode: options.spoilerMode,
      lookupCandidate: resolved.lookup,
    });

    const eligibleStatus = constraintEligiblePublicationStatus(
      resolved.candidate.metadataSource,
      resolved.candidate.publicationStatus,
      resolved.candidate.genres,
      resolved.candidate.tags
    );
    const row = buildCompareRow(bundle, eligibleStatus);
    if (row) {
      seen.add(row.novelId);
      rows.push(row);
      if (bundle.recommendation) {
        recommendations.push({
          ...bundle.recommendation,
          publicationStatus: eligibleStatus,
        });
      }
    } else {
      unresolvedTitles.push(title);
    }
  }

  return { rows, recommendations, unresolvedTitles };
}

async function loadCompareRowsByIds(options: {
  novelIds: string[];
  userId?: string;
  spoilerMode?: MoonieSpoilerMode;
}): Promise<{
  rows: MoonieCompareRow[];
  recommendations: NonNullable<
    Awaited<ReturnType<typeof buildNovelBundle>>["recommendation"]
  >[];
}> {
  const rows: MoonieCompareRow[] = [];
  const recommendations: NonNullable<
    Awaited<ReturnType<typeof buildNovelBundle>>["recommendation"]
  >[] = [];
  const seen = new Set<string>();

  for (const novelId of options.novelIds) {
    if (seen.has(novelId)) continue;
    const bundle = await buildNovelBundle({
      novelId,
      userId: options.userId,
      reason: "Verified catalogue entry kept from the pending comparison.",
      spoilerMode: options.spoilerMode,
    });
    if (!bundle.recommendation) continue;
    const row = buildCompareRow(
      bundle,
      bundle.recommendation.publicationStatus ?? null
    );
    if (!row) continue;
    seen.add(row.novelId);
    rows.push(row);
    recommendations.push(bundle.recommendation);
  }

  return { rows, recommendations };
}

function compareClarificationReply(options: {
  rows: MoonieCompareRow[];
  unresolvedTitles: string[];
  fromFile: boolean;
}): string {
  const verifiedCount = options.rows.length;
  const unresolvedList = options.unresolvedTitles
    .map((title) => `"${title}"`)
    .join(", ");
  const kept = options.rows[0]?.title;

  if (verifiedCount === 1 && options.unresolvedTitles.length > 0) {
    if (options.fromFile) {
      return `I could only verify 1 of the titles in your file, so I can't make a reliable comparison yet.${
        unresolvedList ? ` I couldn't verify: ${unresolvedList}.` : ""
      } Try the full official title for the missing entries.`;
    }
    return `I verified ${kept}. I couldn't verify ${unresolvedList}. Name the other title to compare — I will keep ${kept} and will not substitute a different novel.`;
  }

  if (verifiedCount === 1) {
    return `I verified ${kept}. Name one more catalogue title to compare with it.`;
  }

  if (verifiedCount === 0 && options.unresolvedTitles.length > 0) {
    if (options.fromFile) {
      return `I couldn't verify any of the titles in your file (${unresolvedList}), so I can't make a reliable comparison yet. Try the full official title.`;
    }
    return `I couldn't verify ${unresolvedList}. Name two or three catalogue titles to compare, for example: Compare Lord of the Mysteries and Reverend Insanity.`;
  }

  const missing = options.unresolvedTitles.length
    ? unresolvedList
    : "those titles";
  return `I could not verify at least two catalogue matches for ${missing}. Try the full official title.`;
}

export async function buildNovelComparison(options: {
  message: string;
  userId?: string;
  spoilerMode?: MoonieSpoilerMode;
  titleHints?: string[];
  priorUserMessage?: string | null;
  activeNovelTitle?: string | null;
  priorRecommendations?: Array<{ title: string }>;
  priorResolvedNovelIds?: string[];
}): Promise<MoonieCompareResult> {
  const fromFile = Boolean(
    options.titleHints && options.titleHints.length >= 2
  );
  const ordinalTitles = options.priorRecommendations
    ? extractOrdinalCompareTitlesFromRecommendations(
        options.message,
        options.priorRecommendations
      )
    : [];

  let lockedTitles: string[] | null =
    ordinalTitles.length >= 2
      ? ordinalTitles
      : fromFile
        ? options.titleHints!.slice(0, FILE_ATTACHMENT_MAX_TITLES)
        : null;

  if (!lockedTitles && isCompareTheseMessage(options.message)) {
    const fromPrior = options.priorUserMessage
      ? extractTitlesFromMultiline(options.priorUserMessage)
      : [];
    const fromMessage = extractTitlesFromMultiline(options.message);
    lockedTitles =
      fromPrior.length >= 2
        ? fromPrior
        : fromMessage.length >= 2
          ? fromMessage
          : null;
  }

  const titleParses = lockedTitles
    ? [lockedTitles]
    : enumerateCompareTitleParses(
        options.message,
        options.activeNovelTitle
      );

  if (titleParses.length === 0) {
    return {
      rows: [],
      recommendations: [],
      reply:
        "Name two or three novels to compare, for example: Compare Lord of the Mysteries and Reverend Insanity.",
      unresolvedTitles: [],
    };
  }

  let best: Awaited<ReturnType<typeof resolveCompareTitlesToRows>> | null = null;

  for (const titles of titleParses) {
    const resolved = await resolveCompareTitlesToRows({
      titles,
      userId: options.userId,
      spoilerMode: options.spoilerMode,
    });
    if (
      !best ||
      preferCompareTitleParse(
        {
          resolvedCount: resolved.rows.length,
          titleCount: titles.length,
        },
        {
          resolvedCount: best.rows.length,
          titleCount:
            best.rows.length + best.unresolvedTitles.length || titles.length,
        }
      ) < 0
    ) {
      best = resolved;
    }
    if (resolved.rows.length >= 2 && resolved.unresolvedTitles.length === 0) {
      break;
    }
  }

  const merged = best ?? {
    rows: [],
    recommendations: [],
    unresolvedTitles: extractCompareTitles(
      options.message,
      options.activeNovelTitle
    ),
  };

  if (merged.rows.length < 2 && (options.priorResolvedNovelIds?.length ?? 0) > 0) {
    const prior = await loadCompareRowsByIds({
      novelIds: options.priorResolvedNovelIds!,
      userId: options.userId,
      spoilerMode: options.spoilerMode,
    });
    const seen = new Set(merged.rows.map((row) => row.novelId));
    for (let index = 0; index < prior.rows.length; index += 1) {
      const row = prior.rows[index]!;
      if (seen.has(row.novelId)) continue;
      merged.rows.unshift(row);
      const rec = prior.recommendations[index];
      if (rec) merged.recommendations.unshift(rec);
      seen.add(row.novelId);
    }
  }

  const rows = merged.rows;
  const recommendations = merged.recommendations;
  const unresolvedTitles = merged.unresolvedTitles;

  if (rows.length < 2) {
    return {
      rows,
      recommendations,
      unresolvedTitles,
      reply: compareClarificationReply({
        rows,
        unresolvedTitles,
        fromFile,
      }),
    };
  }

  const intro = rows
    .map((row) => {
      const rating =
        row.averageRating != null
          ? `${row.averageRating.toFixed(1)}/5 · ${row.reviewCount} reviews`
          : `${row.reviewCount} reviews`;
      return `${row.title}${row.author ? ` by ${row.author}` : ""} — ${row.publicationStatus ?? "status unknown"} — ${rating}`;
    })
    .join("\n");

  const conclusion = compareConclusion(rows);
  const spoilerNote =
    options.spoilerMode === "none"
      ? "Spoiler-safe mode is on, so I kept this comparison to catalogue facts and non-spoiler signals."
      : "";

  return {
    rows,
    recommendations,
    unresolvedTitles,
    reply: [intro, conclusion, spoilerNote].filter(Boolean).join("\n\n"),
    conclusion,
  };
}

export async function answerCompareFollowUp(options: {
  message: string;
  compareRows: MoonieCompareRow[];
  spoilerMode?: MoonieSpoilerMode;
}): Promise<string | null> {
  const lower = options.message.toLowerCase();
  const rows = options.compareRows;
  if (rows.length < 2) return null;

  if (/\b(darker|dark|grim|brutal)\b/.test(lower)) {
    const ranked = [...rows].sort(
      (a, b) => b.toneSignals.length - a.toneSignals.length
    );
    if (ranked[0].toneSignals.length === 0) {
      return "Neither title has darkness/grim tags on MoonVerse, so I cannot rank them as darker from verified tag data.";
    }
    return `From MoonVerse tags, ${ranked[0].title} has stronger dark-tone signals (${ranked[0].toneSignals.join(", ")}). ${spoilerConstraintForOpenAI(options.spoilerMode ?? "none")}`;
  }

  if (/\b(less romance|lower romance|no romance|romance)\b/.test(lower)) {
    const ranked = [...rows].sort(
      (a, b) => a.romanceSignals.length - b.romanceSignals.length
    );
    if (
      ranked[0].romanceSignals.length ===
      ranked[ranked.length - 1].romanceSignals.length
    ) {
      return "Romance level looks similar from available MoonVerse tags — neither stands out clearly.";
    }
    return `${ranked[0].title} has fewer romance-related tags (${ranked[0].romanceSignals.join(", ") || "none listed"}).`;
  }

  return null;
}
