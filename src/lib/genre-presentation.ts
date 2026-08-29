import type { LucideIcon } from "lucide-react";
import { WEB_NOVEL_GENRES } from "@/lib/genres";

export interface GenrePresentation {
  slug: string;
  label: string;
  icon: LucideIcon;
  description: string;
  accentClass: string;
  softBackgroundClass: string;
  iconContainerClass: string;
  decorClass: string;
}

const GENRE_COPY: Record<
  string,
  Pick<GenrePresentation, "description" | "accentClass" | "softBackgroundClass" | "iconContainerClass" | "decorClass">
> = {
  romance: {
    description:
      "Slow burns, heart-flutters and love stories worth staying up for. Curated reviews from readers who feel every chapter.",
    accentClass: "text-rose-600",
    softBackgroundClass:
      "bg-gradient-to-br from-rose-50 via-[#faf5ff]/80 to-amber-50/60",
    iconContainerClass:
      "bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600 ring-rose-200/70",
    decorClass: "bg-rose-300/30",
  },
  fantasy: {
    description:
      "Magic systems, epic quests and worlds that pull you in. Discover fantasy reviews from the MoonVerse community.",
    accentClass: "text-violet-700",
    softBackgroundClass:
      "bg-gradient-to-br from-violet-50/90 via-indigo-50/40 to-purple-50/30",
    iconContainerClass: "bg-violet-100/80 text-violet-700 ring-violet-200/60",
    decorClass: "bg-violet-300/25",
  },
  action: {
    description:
      "High stakes, sharp fights and momentum that never lets up. Browse action-packed reviews readers swear by.",
    accentClass: "text-red-700",
    softBackgroundClass:
      "bg-gradient-to-br from-red-50/80 via-orange-50/40 to-amber-50/30",
    iconContainerClass: "bg-red-100/80 text-red-700 ring-red-200/60",
    decorClass: "bg-red-300/20",
  },
  horror: {
    description:
      "Dread, atmosphere and stories that linger. Explore horror reviews for your next late-night read.",
    accentClass: "text-slate-700",
    softBackgroundClass:
      "bg-gradient-to-br from-slate-100/90 via-violet-50/30 to-slate-50/50",
    iconContainerClass: "bg-slate-200/80 text-slate-700 ring-slate-300/60",
    decorClass: "bg-slate-400/15",
  },
  "sci-fi": {
    description:
      "Future worlds, bold ideas and speculative fiction. Find sci-fi reviews that match your taste.",
    accentClass: "text-teal-700",
    softBackgroundClass:
      "bg-gradient-to-br from-teal-50/80 via-cyan-50/40 to-violet-50/30",
    iconContainerClass: "bg-teal-100/80 text-teal-700 ring-teal-200/60",
    decorClass: "bg-teal-300/20",
  },
  comedy: {
    description:
      "Laugh-out-loud moments and feel-good reads. Comedy reviews to brighten your TBR.",
    accentClass: "text-amber-700",
    softBackgroundClass:
      "bg-gradient-to-br from-amber-50/90 via-yellow-50/40 to-orange-50/30",
    iconContainerClass: "bg-amber-100/80 text-amber-700 ring-amber-200/60",
    decorClass: "bg-amber-300/25",
  },
  mystery: {
    description:
      "Clues, twists and puzzles to unravel. Mystery reviews for readers who love a good whodunit.",
    accentClass: "text-cyan-700",
    softBackgroundClass:
      "bg-gradient-to-br from-cyan-50/80 via-sky-50/40 to-violet-50/30",
    iconContainerClass: "bg-cyan-100/80 text-cyan-700 ring-cyan-200/60",
    decorClass: "bg-cyan-300/20",
  },
  xianxia: {
    description:
      "Cultivation paths, immortal realms and dao-defying journeys. Xianxia reviews from dedicated readers.",
    accentClass: "text-amber-800",
    softBackgroundClass:
      "bg-gradient-to-br from-amber-50/90 via-orange-50/30 to-yellow-50/40",
    iconContainerClass: "bg-amber-100/80 text-amber-800 ring-amber-200/60",
    decorClass: "bg-amber-400/20",
  },
};

const DEFAULT_PRESENTATION: Pick<
  GenrePresentation,
  "description" | "accentClass" | "softBackgroundClass" | "iconContainerClass" | "decorClass"
> = {
  description:
    "Community reviews to help you find your next favourite web novel. Filter by tags and sort by what's hot or new.",
  accentClass: "text-primary",
  softBackgroundClass:
    "bg-gradient-to-br from-[#f7f3ff] via-violet-50/40 to-[#fffdf9]",
  iconContainerClass: "bg-moon-purple-soft text-primary ring-violet-200/60",
  decorClass: "bg-primary/10",
};

export function getGenrePresentation(slug: string): GenrePresentation | null {
  const genre = WEB_NOVEL_GENRES.find((g) => g.slug === slug);
  if (!genre) return null;

  const custom = GENRE_COPY[slug] ?? DEFAULT_PRESENTATION;

  return {
    slug: genre.slug,
    label: genre.name,
    icon: genre.icon,
    ...custom,
  };
}

export const GENRE_PRESENTATIONS: GenrePresentation[] = WEB_NOVEL_GENRES.map((genre) => {
  const custom = GENRE_COPY[genre.slug] ?? DEFAULT_PRESENTATION;
  return {
    slug: genre.slug,
    label: genre.name,
    icon: genre.icon,
    ...custom,
  };
});
