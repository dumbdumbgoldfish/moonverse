import type { Prisma } from "@prisma/client";
import { labelsMatch } from "@/lib/moonie/label-match";

/** Demo / Open Library rows where secondary genres and status were synthetically assigned. */
export const LOW_TRUST_METADATA_SOURCES = new Set([
  "seed-catalog",
  "open-library-demo",
]);

/** Curated catalogue rows with independent editorial provenance. */
export const TRUSTED_METADATA_SOURCES = new Set([
  "verified-catalog",
  "admin-qa-content-v1",
]);

/** Progression-fantasy lanes that must not be inferred for literary catalogue titles. */
export const PROGRESSION_FANTASY_GENRE_SLUGS = new Set([
  "xianxia",
  "wuxia",
  "murim",
  "cultivation",
  "system",
  "reincarnation",
  "transmigration",
  "regression",
  "litrpg",
  "dungeon",
  "apocalypse",
  "villainess",
]);

const CURATED_TRANSLATION_ORIGIN_TAG_SLUGS = new Set([
  "translated-cn",
  "chinese-original",
  "translated-jp",
  "japanese-original",
  "translated-kr",
  "korean-original",
]);

export interface MetadataEligibilityNovel {
  metadataSource?: string | null;
  genres: string[];
  tags?: string[];
  publicationStatus?: string | null;
  originalLanguage?: string | null;
  lengthBand?: string | null;
  chapterCount?: number | null;
}

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

export function isLowTrustCatalogueMetadata(
  metadataSource?: string | null
): boolean {
  if (!metadataSource) return false;
  return LOW_TRUST_METADATA_SOURCES.has(metadataSource);
}

export function isTrustedCatalogueMetadata(
  metadataSource?: string | null
): boolean {
  if (!metadataSource) return false;
  return TRUSTED_METADATA_SOURCES.has(metadataSource);
}

export function isProgressionFantasyLabel(label: string): boolean {
  const slug = normalizeSlug(label);
  if (PROGRESSION_FANTASY_GENRE_SLUGS.has(slug)) return true;
  return /\b(cultivation|xianxia|wuxia|murim)\b/i.test(label);
}

/**
 * Curated web-novel catalogue evidence (translated lanes or RR+English pair).
 * A lone `royal-road` tag is not sufficient.
 */
export function hasCuratedWebNovelOriginEvidence(tags: string[] = []): boolean {
  const slugs = tags.map((tag) => normalizeSlug(tag));
  if (slugs.some((slug) => CURATED_TRANSLATION_ORIGIN_TAG_SLUGS.has(slug))) {
    return true;
  }
  return slugs.includes("english-original") && slugs.includes("royal-road");
}

const OPEN_LIBRARY_SUBJECT_GENRE_SLUGS = new Set([
  "fantasy",
  "sci-fi",
  "romance",
  "horror",
  "adventure",
  "mystery",
  "ya",
  "historical",
  "thriller",
  "military",
  "sports",
  "crime",
  "family",
  "time-travel",
  "supernatural",
  "urban",
  "psychological",
  "drama",
  "gaming",
]);

/** Secondary lanes common on curated CN/RR web novels (not OL subject imports). */
const WEB_NOVEL_COMPANION_GENRE_SLUGS = new Set([
  "comedy",
  "fantasy",
  "adventure",
  "action",
  "romance",
]);

function isOpenLibrarySubjectGenre(label: string): boolean {
  return OPEN_LIBRARY_SUBJECT_GENRE_SLUGS.has(normalizeSlug(label));
}

function isWebNovelCompanionGenre(label: string): boolean {
  return WEB_NOVEL_COMPANION_GENRE_SLUGS.has(normalizeSlug(label));
}

function isPrimaryProgressionLane(label: string): boolean {
  const slug = normalizeSlug(label);
  return (
    slug === "xianxia" ||
    slug === "wuxia" ||
    slug === "cultivation" ||
    slug === "murim"
  );
}

/**
 * Progression on low-trust rows is supported when catalogue structure matches
 * curated web-novel patterns — not when OL literary subjects pair with sprayed
 * progression or random origin tags alone.
 */
function progressionGenreSupportedOnLowTrust(
  genres: string[],
  tags: string[] = []
): boolean {
  const progression = genres.filter((genre) => isProgressionFantasyLabel(genre));
  if (progression.length === 0) return false;

  const companions = genres.filter((genre) => !isProgressionFantasyLabel(genre));

  if (companions.length === 0) {
    return hasCuratedWebNovelOriginEvidence(tags);
  }

  const webNovelLanePair =
    progression.some((genre) => isPrimaryProgressionLane(genre)) &&
    companions.every(
      (genre) =>
        isWebNovelCompanionGenre(genre) && !isOpenLibrarySubjectGenre(genre)
    );

  if (webNovelLanePair) return true;

  if (hasCuratedWebNovelOriginEvidence(tags)) {
    const onlyLiteraryPairing = companions.some((genre) =>
      isOpenLibrarySubjectGenre(genre)
    );
    return !onlyLiteraryPairing;
  }

  return false;
}

/**
 * On low-trust rows, progression genres are kept only with curated catalogue origin
 * evidence (e.g. translated-cn novels on Wuxiaworld). Literary Open Library imports
 * with sprayed cultivation/xianxia lose unsupported progression lanes.
 */
export function constraintEligibleGenreLabels(
  metadataSource: string | null | undefined,
  genres: string[],
  tags: string[] = []
): string[] {
  if (!isLowTrustCatalogueMetadata(metadataSource)) return genres;

  return genres.filter((genre) => {
    if (!isProgressionFantasyLabel(genre)) return true;
    return progressionGenreSupportedOnLowTrust(genres, tags);
  });
}

export function constraintEligibleTagLabels(
  metadataSource: string | null | undefined,
  genres: string[],
  tags: string[] = []
): string[] {
  if (!isLowTrustCatalogueMetadata(metadataSource)) return tags;

  const eligibleGenres = constraintEligibleGenreLabels(
    metadataSource,
    genres,
    tags
  );

  return tags.filter((tag) => {
    if (!isProgressionFantasyLabel(tag)) return true;
    if (eligibleGenres.some((genre) => labelsMatch(genre, tag))) return true;
    if (
      eligibleGenres.some((genre) => isProgressionFantasyLabel(genre)) &&
      isProgressionFantasyLabel(tag)
    ) {
      return true;
    }
    return false;
  });
}

/** Catalogue rows with missing or explicitly unknown status are not hard-matchable. */
export function isPublicationStatusKnown(
  publicationStatus?: string | null
): boolean {
  if (!publicationStatus?.trim()) return false;
  return publicationStatus.trim().toLowerCase() !== "unknown";
}

/** Prisma filter aligned with {@link constraintEligiblePublicationStatus}. */
export function prismaConstraintEligibleCompletedStatus(): Prisma.NovelWhereInput {
  return {
    publicationStatus: {
      contains: "complet",
      mode: "insensitive",
    },
  };
}

/** Prisma filter aligned with {@link constraintEligiblePublicationStatus}. */
export function prismaConstraintEligibleOngoingStatus(): Prisma.NovelWhereInput {
  return {
    OR: [
      { publicationStatus: { contains: "ongoing", mode: "insensitive" } },
      { publicationStatus: { contains: "hiatus", mode: "insensitive" } },
    ],
  };
}

export function novelMatchesSearchGenreFacet(
  metadataSource: string | null | undefined,
  genres: Array<{ slug: string; name: string }>,
  genreSlug: string
): boolean {
  const genreNames = genres.map((genre) => genre.name);
  const tagNames: string[] = [];
  const eligibleGenres = constraintEligibleGenreLabels(
    metadataSource,
    genreNames,
    tagNames
  );
  if (PROGRESSION_FANTASY_GENRE_SLUGS.has(genreSlug)) {
    return genres.some(
      (genre) =>
        genre.slug === genreSlug &&
        eligibleGenres.some((label) => labelsMatch(label, genre.name))
    );
  }
  return genres.some((genre) => genre.slug === genreSlug);
}

/**
 * Explicit catalogue publication status is usable for hard constraints when defined.
 * Synthetic/demo provenance does not downgrade a fixture's stated status; only
 * missing or UNKNOWN values stay unknown.
 */
export function constraintEligiblePublicationStatus(
  metadataSource: string | null | undefined,
  publicationStatus?: string | null,
  genres: string[] = [],
  tags: string[] = []
): string | null {
  void metadataSource;
  void genres;
  void tags;
  if (!isPublicationStatusKnown(publicationStatus)) return null;
  return publicationStatus!.trim();
}

export function novelForHardConstraintCheck(
  novel: MetadataEligibilityNovel
): {
  genres: string[];
  tags?: string[];
  publicationStatus?: string | null;
  originalLanguage?: string | null;
  lengthBand?: string | null;
  chapterCount?: number | null;
} {
  const genres = constraintEligibleGenreLabels(
    novel.metadataSource,
    novel.genres,
    novel.tags ?? []
  );
  const tags = constraintEligibleTagLabels(
    novel.metadataSource,
    novel.genres,
    novel.tags ?? []
  );
  return {
    genres,
    tags,
    publicationStatus: constraintEligiblePublicationStatus(
      novel.metadataSource,
      novel.publicationStatus,
      novel.genres,
      novel.tags ?? []
    ),
    originalLanguage: novel.originalLanguage ?? null,
    lengthBand: novel.lengthBand ?? null,
    chapterCount: novel.chapterCount ?? null,
  };
}

/** Simulate post-repair eligibility (genres/tags disconnected per plan). */
export function constraintEligibleAfterFieldRemoval(
  metadataSource: string | null | undefined,
  genres: string[],
  tags: string[],
  publicationStatus: string | null | undefined
): {
  genres: string[];
  tags: string[];
  publicationStatus: string | null;
} {
  return {
    genres: constraintEligibleGenreLabels(metadataSource, genres, tags),
    tags: constraintEligibleTagLabels(metadataSource, genres, tags),
    publicationStatus: constraintEligiblePublicationStatus(
      metadataSource,
      publicationStatus,
      genres,
      tags
    ),
  };
}
