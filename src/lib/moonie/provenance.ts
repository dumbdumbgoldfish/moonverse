import type {
  MoonieFieldProvenance,
  MoonieProvenanceSource,
} from "@/types/moonie";

export const PROVENANCE_LABELS: Record<MoonieProvenanceSource, string> = {
  moonverse_catalogue: "MoonVerse catalogue",
  moonverse_reviews: "MoonVerse community reviews",
  verified_reading_link: "Verified reading link",
  official_publisher: "Official publisher/platform",
  approved_external: "Approved external source",
  moonie_reasoning: "Moonie recommendation reasoning",
};

export function provenanceLabel(source: MoonieProvenanceSource): string {
  return PROVENANCE_LABELS[source];
}

export function buildCatalogueFieldProvenance(options: {
  hasCommunity?: boolean;
  readingLinkBadge?: "official" | "verified" | "community" | "unverified";
  metadataSource?: string | null;
}): MoonieFieldProvenance[] {
  const fields: MoonieFieldProvenance[] = [
    {
      field: "title",
      source: "moonverse_catalogue",
      label: PROVENANCE_LABELS.moonverse_catalogue,
    },
    {
      field: "author",
      source: "moonverse_catalogue",
      label: PROVENANCE_LABELS.moonverse_catalogue,
    },
    {
      field: "status",
      source: "moonverse_catalogue",
      label: PROVENANCE_LABELS.moonverse_catalogue,
    },
  ];

  if (options.hasCommunity) {
    fields.push(
      {
        field: "ratings",
        source: "moonverse_reviews",
        label: PROVENANCE_LABELS.moonverse_reviews,
      },
      {
        field: "reviews",
        source: "moonverse_reviews",
        label: PROVENANCE_LABELS.moonverse_reviews,
      },
      {
        field: "community",
        source: "moonverse_reviews",
        label: PROVENANCE_LABELS.moonverse_reviews,
      }
    );
  }

  if (options.readingLinkBadge === "official") {
    fields.push({
      field: "readingLinks",
      source: "official_publisher",
      label: PROVENANCE_LABELS.official_publisher,
    });
  } else if (options.readingLinkBadge === "verified") {
    fields.push({
      field: "readingLinks",
      source: "verified_reading_link",
      label: PROVENANCE_LABELS.verified_reading_link,
    });
  } else if (options.metadataSource) {
    fields.push({
      field: "readingLinks",
      source: "approved_external",
      label: PROVENANCE_LABELS.approved_external,
    });
  }

  return fields;
}

export function confidenceLabel(confidence: "high" | "medium" | "low"): string {
  if (confidence === "high") return "High confidence";
  if (confidence === "medium") return "Medium confidence";
  return "Low confidence";
}
