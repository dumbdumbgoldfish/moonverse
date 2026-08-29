import type { LucideIcon } from "lucide-react";
import { Heart, Moon, Sparkles, Swords, Users, Wand2 } from "lucide-react";
import { WEB_NOVEL_GENRES } from "@/lib/genres";
import type { SearchSort } from "@/types/search";

export interface SearchMoodCard {
  label: string;
  query: string;
  hint: string;
  icon: LucideIcon;
}

export interface SearchGenreShortcut {
  slug: string;
  name: string;
  icon: LucideIcon;
  gradient: string;
}

const MOOD_ICON_CYCLE = [Heart, Sparkles, Users, Swords, Moon, Wand2] as const;

/** Mood/trope entry points for the empty search landing. */
export function searchLandingMoods(): SearchMoodCard[] {
  const starters: Array<{ label: string; query: string; hint: string }> = [
    { label: "Slow burn", query: "slow burn", hint: "Romance that takes its time" },
    { label: "Found family", query: "found family", hint: "Warm bonds and belonging" },
    {
      label: "Enemies to lovers",
      query: "enemies to lovers",
      hint: "Tension that turns tender",
    },
    { label: "Cultivation", query: "cultivation", hint: "Power arcs and progression" },
    { label: "Villainess", query: "villainess", hint: "Second chances and schemes" },
    { label: "Isekai", query: "isekai", hint: "New worlds, new stakes" },
  ];

  return starters.map((item, index) => ({
    ...item,
    icon: MOOD_ICON_CYCLE[index % MOOD_ICON_CYCLE.length],
  }));
}

/** Top genre tiles linking to browse hubs. */
export function searchLandingGenres(limit = 6): SearchGenreShortcut[] {
  return WEB_NOVEL_GENRES.slice(0, limit).map((genre) => ({
    slug: genre.slug,
    name: genre.name,
    icon: genre.icon,
    gradient: genre.gradient,
  }));
}

export function searchLandingShelfMeta(sort: SearchSort): {
  title: string;
  subtitle: string;
} {
  switch (sort) {
    case "recent":
      return {
        title: "Recently reviewed",
        subtitle: "Works with fresh community write-ups.",
      };
    case "highest-rated":
      return {
        title: "Top rated",
        subtitle: "Highest community scores in the catalogue.",
      };
    case "most-reviewed":
      return {
        title: "Most discussed",
        subtitle: "Titles readers talk about most.",
      };
    default:
      return {
        title: "Trending now",
        subtitle: "What readers are opening across MoonVerse.",
      };
  }
}

export function searchLandingPulse(stats: {
  works: number;
  reviews: number;
  lists: number;
}): string[] {
  const lines: string[] = [];
  if (stats.works > 0) {
    lines.push(
      `${stats.works.toLocaleString()} ${stats.works === 1 ? "work" : "works"} indexed`
    );
  }
  if (stats.reviews > 0) {
    lines.push(
      `${stats.reviews.toLocaleString()} community ${stats.reviews === 1 ? "review" : "reviews"}`
    );
  }
  if (stats.lists > 0) {
    lines.push(
      `${stats.lists.toLocaleString()} curated ${stats.lists === 1 ? "list" : "lists"}`
    );
  }
  return lines;
}

export function searchTagHref(slug: string): string {
  return `/search?tags=${encodeURIComponent(slug)}`;
}
