import type { ReviewListItem } from "@/types/review";
import type { SearchWorkHit } from "@/types/search";

export function workMatchReason(input: {
  titleScore: number;
  authorHit: boolean;
  genreHit: boolean;
  tagHit: boolean;
  aliasHit?: boolean;
  genreName?: string | null;
}): string {
  if (input.aliasHit) return "Also known as";
  if (input.titleScore >= 100) return "Exact title";
  if (input.titleScore >= 80) return "Title starts with";
  if (input.titleScore >= 50) return "Title match";
  if (input.authorHit) return "Author match";
  if (input.genreHit && input.genreName) return `In ${input.genreName}`;
  if (input.tagHit) return "Trope match";
  if (input.titleScore > 20) return "Close title match";
  return "Catalog match";
}

export function reviewMatchReason(
  review: ReviewListItem,
  query: string
): string {
  const q = query.trim().toLowerCase();
  if (!q) return "Community review";
  if (review.novelTitle.toLowerCase().includes(q)) return "Work title match";
  if (review.novelAuthor.toLowerCase().includes(q)) return "Author match";
  if (review.title.toLowerCase().includes(q)) return "Review title match";
  if (review.reviewerName.toLowerCase().includes(q)) return "Reviewer match";
  if (review.genres.some((genre) => genre.toLowerCase().includes(q))) {
    return "Genre match";
  }
  return "Review match";
}

export function listMatchReason(name: string, query: string): string {
  const q = query.trim().toLowerCase();
  if (q && name.toLowerCase().includes(q)) return "List name match";
  if (q) return "Contains a matching work";
  return "Public list";
}

export function popularWorkReason(work: SearchWorkHit): string {
  if (work.genres[0]) return `Popular in ${work.genres[0]}`;
  return "Popular on MoonVerse";
}
