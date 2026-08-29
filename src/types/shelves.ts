import type { ReviewListItem } from "@/types/review";

export interface DiscoveryShelfData {
  id: string;
  title: string;
  subtitle?: string;
  seeAllHref?: string;
  reviews: ReviewListItem[];
}
