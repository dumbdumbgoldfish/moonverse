import {
  extractCompareTitles,
  extractTitlesFromMultiline,
  isCompareTheseMessage,
} from "@/lib/moonie/intent";
import { spoilerConstraintForOpenAI } from "@/lib/moonie/spoiler-mode";
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
  bundle: Awaited<ReturnType<typeof buildNovelBundle>>
): MoonieCompareRow | null {
  if (!bundle.recommendation || !bundle.overview) return null;
  const rec = bundle.recommendation;
  const tags = bundle.overview.tags;
  const missing: string[] = [];

  if (!rec.publicationStatus) missing.push("completion status");
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
    publicationStatus: rec.publicationStatus ?? null,
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
      `Choose **${byRating[0].title}** if you want the higher MoonVerse rating (${byRating[0].averageRating?.toFixed(1)}/5 across ${byRating[0].reviewCount} reviews).`
    );
    parts.push(
      `Choose **${byRating[1].title}** if you prefer the alternative tone/tags (${byRating[1].genres.slice(0, 2).join(", ") || "see tags above"}).`
    );
  }

  const darker = rows.filter((row) => row.toneSignals.length > 0);
  if (darker.length === 1) {
    parts.push(
      `For a darker tone (from MoonVerse tags), **${darker[0].title}** is the stronger match (${darker[0].toneSignals.join(", ")}).`
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
      `For lower romance signals in tags, **${lessRomance[0].row.title}** has fewer romance-tagged signals.`
    );
  }

  const completed = rows.filter(
    (row) => row.publicationStatus?.toLowerCase() === "completed"
  );
  if (completed.length === 1 && rows.length === 2) {
    const other = rows.find((row) => row.novelId !== completed[0].novelId);
    if (other && other.publicationStatus?.toLowerCase() !== "completed") {
      parts.push(
        `Choose **${completed[0].title}** if you want a completed catalogue status.`
      );
    }
  }

  if (parts.length === 0) {
    return "Both titles are verified on MoonVerse. Use genres, tags, and ratings above to decide — I only label attributes backed by catalogue or review data.";
  }

  return parts.join(" ");
}

export async function buildNovelComparison(options: {
  message: string;
  userId?: string;
  spoilerMode?: MoonieSpoilerMode;
  titleHints?: string[];
  priorUserMessage?: string | null;
  activeNovelTitle?: string | null;
}): Promise<MoonieCompareResult> {
  let titles =
    options.titleHints && options.titleHints.length >= 2
      ? options.titleHints.slice(0, FILE_ATTACHMENT_MAX_TITLES)
      : extractCompareTitles(options.message, options.activeNovelTitle);

  if (titles.length < 2 && isCompareTheseMessage(options.message)) {
    if (options.priorUserMessage) {
      titles = extractTitlesFromMultiline(options.priorUserMessage);
    }
    if (titles.length < 2) {
      titles = extractTitlesFromMultiline(options.message);
    }
  }

  if (titles.length < 2) {
    return {
      rows: [],
      recommendations: [],
      reply:
        "Name two or three novels to compare, for example: Compare Lord of the Mysteries and Reverend Insanity.",
      unresolvedTitles: titles,
    };
  }

  const rows: MoonieCompareRow[] = [];
  const recommendations = [];
  const unresolvedTitles: string[] = [];

  for (const title of titles) {
    const resolved = await resolveCatalogueTitleForCompare(title, options.userId);
    if (!resolved) {
      unresolvedTitles.push(title);
      continue;
    }

    const bundle = await buildNovelBundle({
      novelId: resolved.candidate.id,
      userId: options.userId,
      reason: `Verified catalogue entry for comparison: "${resolved.candidate.title}".`,
      spoilerMode: options.spoilerMode,
      lookupCandidate: resolved.lookup,
    });

    const row = buildCompareRow(bundle);
    if (row) {
      rows.push(row);
      if (bundle.recommendation) recommendations.push(bundle.recommendation);
    } else {
      unresolvedTitles.push(title);
    }
  }

  if (rows.length < 2) {
    const verifiedCount = rows.length;
    const unresolvedList = unresolvedTitles.map((title) => `"${title}"`).join(", ");
    let reply: string;

    if (verifiedCount === 1 && unresolvedTitles.length > 0) {
      reply = `I could only verify 1 of the titles in your file, so I can't make a reliable comparison yet.${
        unresolvedList ? ` I couldn't verify: ${unresolvedList}.` : ""
      } Try the full official title for the missing entries.`;
    } else if (verifiedCount === 0 && unresolvedTitles.length > 0) {
      reply = `I couldn't verify any of the titles in your file (${unresolvedList}), so I can't make a reliable comparison yet. Try the full official title.`;
    } else {
      const missing = unresolvedTitles.length
        ? unresolvedList
        : "those titles";
      reply = `I could not verify at least two catalogue matches for ${missing}. Try the full official title.`;
    }

    return {
      rows,
      recommendations,
      unresolvedTitles,
      reply,
    };
  }

  const intro = rows
    .map((row) => {
      const rating =
        row.averageRating != null
          ? `${row.averageRating.toFixed(1)}/5 · ${row.reviewCount} reviews`
          : `${row.reviewCount} reviews`;
      return `**${row.title}**${row.author ? ` by ${row.author}` : ""} — ${row.publicationStatus ?? "status unknown"} — ${rating}`;
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
    return `From MoonVerse tags, **${ranked[0].title}** has stronger dark-tone signals (${ranked[0].toneSignals.join(", ")}). ${spoilerConstraintForOpenAI(options.spoilerMode ?? "none")}`;
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
    return `**${ranked[0].title}** has fewer romance-related tags (${ranked[0].romanceSignals.join(", ") || "none listed"}).`;
  }

  return null;
}
