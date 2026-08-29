import type { LucideIcon } from "lucide-react";
import { BookOpen } from "lucide-react";
import { WEB_NOVEL_GENRES } from "@/lib/genres";

const bySlug = new Map(WEB_NOVEL_GENRES.map((g) => [g.slug, g.icon]));
const byName = new Map(
  WEB_NOVEL_GENRES.map((g) => [g.name.toLowerCase(), g.icon])
);

/** Resolve a Lucide icon for a genre slug or display name. */
export function getGenreIcon(genre: string): LucideIcon {
  const normalized = genre.trim().toLowerCase();
  return (
    bySlug.get(normalized) ??
    bySlug.get(normalized.replace(/\s+/g, "-")) ??
    byName.get(normalized) ??
    BookOpen
  );
}
