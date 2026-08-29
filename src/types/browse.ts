import type { GenreBrowseSort } from "@/lib/browse-sort";

/** Browse catalogue work row (Works mode on genre browse). */
export interface BrowseWorkItem {
  novelId: string;
  title: string;
  author: string;
  coverUrl: string;
  genres: string[];
  tags: string[];
  averageRating: number;
  reviewCount: number;
  hasOfficialLink: boolean;
  href: string;
  /** Bayesian weighted rating on a 1–5 scale (0 when no reviews). */
  bayesianRating: number;
  publicationStatus: string | null;
  synopsis: string | null;
  rankExplain: BrowseRankExplain;
}

export interface BrowseRankExplain {
  sort: GenreBrowseSort;
  reasons: string[];
}

export interface BrowseWorkPreview {
  novelId: string;
  title: string;
  author: string;
  coverUrl: string;
  genres: string[];
  tags: string[];
  averageRating: number;
  reviewCount: number;
  bayesianRating: number;
  hasOfficialLink: boolean;
  officialLinkUrl: string | null;
  publicationStatus: string | null;
  synopsis: string | null;
  href: string;
  sampleReview: {
    id: string;
    title: string;
    excerpt: string;
    rating: number;
    username: string;
    href: string;
  } | null;
}

export type BrowseMode = "works" | "reviews";

export function parseBrowseMode(value?: string | null): BrowseMode {
  return value === "reviews" ? "reviews" : "works";
}
