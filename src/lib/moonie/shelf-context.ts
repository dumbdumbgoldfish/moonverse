import { parseShelfNearbyTitles } from "@/lib/discover";

export interface ShelfRecommendationAnchors {
  novelIds: string[];
  unresolvedTitles: string[];
}

export async function resolveShelfRecommendationAnchors(
  message: string,
  resolveTitleIds: (title: string) => Promise<string[]>
): Promise<ShelfRecommendationAnchors | null> {
  const titles = parseShelfNearbyTitles(message);
  if (titles.length === 0) return null;

  const novelIds: string[] = [];
  const unresolvedTitles: string[] = [];

  for (const title of titles) {
    const ids = await resolveTitleIds(title);
    if (ids[0]) {
      novelIds.push(ids[0]);
    } else {
      unresolvedTitles.push(title);
    }
  }

  return { novelIds, unresolvedTitles };
}
