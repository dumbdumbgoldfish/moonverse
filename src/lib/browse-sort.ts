/** Sort values supported by `/api/browse` and mapped to `ReviewSort` when fetched. */
export type GenreBrowseSort =
  | "hot"
  | "new"
  | "highest-rated"
  | "most-discussed"
  | "most-saved"
  | "community-strength"
  | "catalogue-confidence"
  | "affinity";

export function genreBrowseSortToApi(sort: GenreBrowseSort): string {
  switch (sort) {
    case "hot":
      return "trending";
    case "new":
      return "latest";
    case "community-strength":
    case "affinity":
      return "highest-rated";
    case "catalogue-confidence":
      return "trending";
    default:
      return sort;
  }
}

export function parseGenreBrowseSort(value?: string | null): GenreBrowseSort {
  if (
    value === "new" ||
    value === "latest" ||
    value === "highest-rated" ||
    value === "most-discussed" ||
    value === "most-saved" ||
    value === "community-strength" ||
    value === "catalogue-confidence" ||
    value === "affinity"
  ) {
    return value === "new" || value === "latest" ? "new" : value;
  }
  return "hot";
}

/** Short prompt for Ask Moonie from the current browse facet state. */
export function browseMooniePrompt(input: {
  genreLabel: string;
  tagNames?: string[];
  officialOnly?: boolean;
}): string {
  const parts = [`Looking for ${input.genreLabel} web novels`];
  if (input.tagNames?.length) {
    parts.push(`with ${input.tagNames.join(", ")}`);
  }
  if (input.officialOnly) {
    parts.push("that have an official reading link");
  }
  parts.push("Recommend a few titles from the MoonVerse catalogue and say why they fit.");
  return parts.join(". ");
}
