import {
  BookmarkCheck,
  Compass,
  Flame,
  MoonStar,
  Orbit,
  Sparkles,
  Stars,
  Wand2,
  type LucideIcon,
} from "lucide-react";

export interface ShelfTheme {
  icon: LucideIcon;
  accent: string;
}

const DEFAULT_THEME: ShelfTheme = {
  icon: Orbit,
  accent: "text-[#6246ea]",
};

/** Accent icons only: keep shelf surfaces neutral so rows don’t look muddy. */
export const SHELF_THEMES: Record<string, ShelfTheme> = {
  trending: { icon: Flame, accent: "text-[#6246ea]" },
  "top-picks": { icon: Stars, accent: "text-[#6246ea]" },
  recommended: { icon: Sparkles, accent: "text-[#6246ea]" },
  completed: { icon: BookmarkCheck, accent: "text-[#6246ea]" },
  "next-read": { icon: Compass, accent: "text-[#6246ea]" },
  enjoy: { icon: MoonStar, accent: "text-[#6246ea]" },
  escape: { icon: Wand2, accent: "text-[#6246ea]" },
  "try-new": { icon: Orbit, accent: "text-[#6246ea]" },
};

export function getShelfTheme(shelfId: string): ShelfTheme {
  return SHELF_THEMES[shelfId] ?? DEFAULT_THEME;
}
