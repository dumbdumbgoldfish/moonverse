import { labelsMatch } from "@/lib/moonie/label-match";
import {
  constraintEligibleGenreLabels,
  constraintEligiblePublicationStatus,
  constraintEligibleTagLabels,
  hasCuratedWebNovelOriginEvidence,
  isLowTrustCatalogueMetadata,
  isProgressionFantasyLabel,
  PROGRESSION_FANTASY_GENRE_SLUGS,
} from "@/lib/moonie/metadata-eligibility";

export interface RepairGenreRow {
  id: string;
  slug: string;
  name: string;
}

export interface RepairTagRow {
  id: string;
  slug: string;
  name: string;
}

export interface RepairRecordInput {
  novelId: string;
  title: string;
  author: string | null;
  metadataSource: string | null;
  publicationStatus: string | null;
  genres: RepairGenreRow[];
  tags: RepairTagRow[];
}

export interface RepairPlanRecord {
  novelId: string;
  title: string;
  author: string | null;
  metadataSource: string | null;
  before: {
    genres: RepairGenreRow[];
    tags: RepairTagRow[];
    publicationStatus: string | null;
  };
  after: {
    genres: RepairGenreRow[];
    tags: RepairTagRow[];
    publicationStatus: string | null;
  };
  changes: {
    removeGenreIds: string[];
    removeGenreNames: string[];
    removeTagIds: string[];
    removeTagNames: string[];
    clearPublicationStatus: boolean;
  };
  rollback: {
    reconnectGenreIds: string[];
    reconnectGenreNames: string[];
    reconnectTagIds: string[];
    reconnectTagNames: string[];
    restorePublicationStatus: string | null;
  };
  evidence: string;
  eligibilityNotes: {
    lowTrustSource: boolean;
    eligibleGenreNames: string[];
    eligibleTagNames: string[];
    eligiblePublicationStatus: string | null;
    hasCuratedWebNovelOriginEvidence: boolean;
  };
}

export interface RepairPlan {
  generatedAt: string;
  mode: "dry-run" | "apply";
  candidateCount: number;
  statusClearCount: number;
  records: RepairPlanRecord[];
}

function genreRowsToNames(genres: RepairGenreRow[]): string[] {
  return genres.map((genre) => genre.name);
}

function tagRowsToNames(tags: RepairTagRow[]): string[] {
  return tags.map((tag) => tag.name);
}

export function buildMetadataRepairPlan(
  novels: RepairRecordInput[],
  mode: RepairPlan["mode"] = "dry-run"
): RepairPlan {
  const records: RepairPlanRecord[] = [];

  for (const novel of novels) {
    const genreNames = genreRowsToNames(novel.genres);
    const tagNames = tagRowsToNames(novel.tags);
    const eligibleGenres = constraintEligibleGenreLabels(
      novel.metadataSource,
      genreNames,
      tagNames
    );
    const eligibleTags = constraintEligibleTagLabels(
      novel.metadataSource,
      genreNames,
      tagNames
    );
    const eligibleStatus = constraintEligiblePublicationStatus(
      novel.metadataSource,
      novel.publicationStatus,
      genreNames,
      tagNames
    );

    const removeGenres = novel.genres.filter(
      (genre) =>
        PROGRESSION_FANTASY_GENRE_SLUGS.has(genre.slug) &&
        !eligibleGenres.some((label) => labelsMatch(label, genre.name))
    );

    const removeTags = novel.tags.filter(
      (tag) =>
        isProgressionFantasyLabel(tag.name) &&
        !eligibleTags.some((label) => labelsMatch(label, tag.name))
    );

    if (removeGenres.length === 0 && removeTags.length === 0) {
      continue;
    }

    const afterGenres = novel.genres.filter(
      (genre) => !removeGenres.some((removed) => removed.id === genre.id)
    );
    const afterTags = novel.tags.filter(
      (tag) => !removeTags.some((removed) => removed.id === tag.id)
    );

    records.push({
      novelId: novel.novelId,
      title: novel.title,
      author: novel.author,
      metadataSource: novel.metadataSource,
      before: {
        genres: novel.genres,
        tags: novel.tags,
        publicationStatus: novel.publicationStatus,
      },
      after: {
        genres: afterGenres,
        tags: afterTags,
        publicationStatus: novel.publicationStatus,
      },
      changes: {
        removeGenreIds: removeGenres.map((genre) => genre.id),
        removeGenreNames: removeGenres.map((genre) => genre.name),
        removeTagIds: removeTags.map((tag) => tag.id),
        removeTagNames: removeTags.map((tag) => tag.name),
        clearPublicationStatus: false,
      },
      rollback: {
        reconnectGenreIds: removeGenres.map((genre) => genre.id),
        reconnectGenreNames: removeGenres.map((genre) => genre.name),
        reconnectTagIds: removeTags.map((tag) => tag.id),
        reconnectTagNames: removeTags.map((tag) => tag.name),
        restorePublicationStatus: null,
      },
      evidence: isLowTrustCatalogueMetadata(novel.metadataSource)
        ? "low-trust seed/Open Library row with unsupported progression genre/tag"
        : "metadata eligibility mismatch",
      eligibilityNotes: {
        lowTrustSource: isLowTrustCatalogueMetadata(novel.metadataSource),
        eligibleGenreNames: eligibleGenres,
        eligibleTagNames: eligibleTags,
        eligiblePublicationStatus: eligibleStatus,
        hasCuratedWebNovelOriginEvidence: hasCuratedWebNovelOriginEvidence(tagNames),
      },
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    mode,
    candidateCount: records.length,
    statusClearCount: records.filter((record) => record.changes.clearPublicationStatus)
      .length,
    records,
  };
}

export function validateRepairPlanAgainstCurrent(
  plan: RepairPlan,
  current: RepairRecordInput[]
): string[] {
  const errors: string[] = [];
  const byId = new Map(current.map((novel) => [novel.novelId, novel]));

  for (const record of plan.records) {
    const novel = byId.get(record.novelId);
    if (!novel) {
      errors.push(`Missing novel ${record.novelId} (${record.title})`);
      continue;
    }

    const genreIds = novel.genres.map((genre) => genre.id).sort();
    const planGenreIds = record.before.genres.map((genre) => genre.id).sort();
    if (genreIds.join(",") !== planGenreIds.join(",")) {
      errors.push(
        `Genre drift on ${record.novelId} (${record.title}): expected ${planGenreIds.join(",")}, found ${genreIds.join(",")}`
      );
    }

    const tagIds = novel.tags.map((tag) => tag.id).sort();
    const planTagIds = record.before.tags.map((tag) => tag.id).sort();
    if (tagIds.join(",") !== planTagIds.join(",")) {
      errors.push(
        `Tag drift on ${record.novelId} (${record.title}): expected ${planTagIds.join(",")}, found ${tagIds.join(",")}`
      );
    }

    if (novel.publicationStatus !== record.before.publicationStatus) {
      errors.push(
        `Status drift on ${record.novelId} (${record.title}): expected ${record.before.publicationStatus}, found ${novel.publicationStatus}`
      );
    }
  }

  return errors;
}
