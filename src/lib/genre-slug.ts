import { WEB_NOVEL_GENRES } from "@/lib/genres";

const byName = new Map(
  WEB_NOVEL_GENRES.map((genre) => [genre.name.toLowerCase(), genre.slug]),
);

/** Resolve a display genre name to its browse slug when possible. */
export function genreSlugFromName(name: string): string | null {
  const normalized = name.trim().toLowerCase();
  return byName.get(normalized) ?? null;
}
