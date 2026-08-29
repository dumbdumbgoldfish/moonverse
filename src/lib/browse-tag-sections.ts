import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CloudRain,
  Ghost,
  Globe,
  Heart,
  MapPin,
  Smile,
  Sparkles,
  Swords,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { TAG_CATEGORIES } from "@/components/discovery/TagRefinePanel";
import { GENRE_TAG_SLUGS } from "@/lib/tags";

export interface BrowseTagSection {
  id: string;
  label: string;
  slugs: string[];
  icon?: LucideIcon;
}

const SECTION_ICONS: Record<string, LucideIcon> = {
  relationship: Heart,
  tone: CloudRain,
  representation: Users,
  setting: MapPin,
  world: Globe,
  progression: TrendingUp,
  power: Zap,
  creatures: Ghost,
  "tone-craft": Smile,
};

/** Genre-specific tag groupings for the browse refine panel. */
const GENRE_BROWSE_SECTIONS: Record<string, BrowseTagSection[]> = {
  romance: [
    {
      id: "relationship",
      label: "Relationship",
      icon: Heart,
      slugs: [
        "slow-burn",
        "enemies-to-lovers",
        "found-family",
        "reverse-harem",
        "harem",
        "strong-fl",
        "strong-ml",
      ],
    },
    {
      id: "tone",
      label: "Tone",
      icon: CloudRain,
      slugs: ["fluff", "angst", "tragedy", "dark", "satire", "comedy-tag"],
    },
    {
      id: "representation",
      label: "Representation",
      icon: Users,
      slugs: ["bl-tag", "gl-tag", "lgbtq"],
    },
    {
      id: "setting",
      label: "Setting",
      icon: MapPin,
      slugs: ["school-life", "slice-of-life", "urban-fantasy", "villainess", "magic-academy"],
    },
  ],
  fantasy: [
    {
      id: "world",
      label: "World & magic",
      icon: Globe,
      slugs: ["magic-academy", "kingdom-building", "mythology", "angels", "demons", "urban-fantasy"],
    },
    {
      id: "progression",
      label: "Progression",
      icon: TrendingUp,
      slugs: ["earned-power", "weak-to-strong", "cultivation", "dungeon-crawl"],
    },
    {
      id: "tone",
      label: "Tone & craft",
      icon: Sparkles,
      slugs: ["character-driven", "beginner-friendly", "dark", "fluff"],
    },
  ],
  action: [
    {
      id: "power",
      label: "Power & combat",
      icon: Swords,
      slugs: ["op-mc", "earned-power", "weak-to-strong", "martial-arts-tag", "anti-hero"],
    },
    {
      id: "tone",
      label: "Tone",
      icon: CloudRain,
      slugs: ["character-driven", "dark", "beginner-friendly"],
    },
  ],
  horror: [
    {
      id: "creatures",
      label: "Creatures & dread",
      icon: Ghost,
      slugs: ["cosmic-horror", "monsters", "vampire", "werewolf", "demons"],
    },
    {
      id: "tone",
      label: "Tone",
      icon: CloudRain,
      slugs: ["dark", "psychological", "tragedy"],
    },
  ],
};

function sectionsFromCategories(categoryIds: string[]): BrowseTagSection[] {
  return TAG_CATEGORIES.filter((c) => categoryIds.includes(c.id)).map((c) => ({
    id: c.id,
    label: c.label,
    slugs: c.slugs,
    icon: SECTION_ICONS[c.id] ?? BookOpen,
  }));
}

const DEFAULT_SECTION_IDS = ["romance", "power", "premise", "setting", "tone"];

export function getBrowseTagSections(genreSlug: string): BrowseTagSection[] {
  const custom = GENRE_BROWSE_SECTIONS[genreSlug];
  if (custom) return custom;

  const curated = GENRE_TAG_SLUGS[genreSlug];
  if (curated?.length) {
    return sectionsFromCategories(DEFAULT_SECTION_IDS);
  }

  return TAG_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    slugs: c.slugs,
    icon: SECTION_ICONS[c.id] ?? BookOpen,
  }));
}

export function getCuratedTagSlugs(genreSlug: string): string[] {
  return GENRE_TAG_SLUGS[genreSlug] ?? [];
}

/** True when every curated tag already appears in browse sections (skip duplicate "Popular" row). */
export function curatedTagsCoveredBySections(genreSlug: string): boolean {
  const curated = getCuratedTagSlugs(genreSlug);
  if (curated.length === 0) return true;

  const sectionSlugs = new Set(
    getBrowseTagSections(genreSlug).flatMap((section) => section.slugs)
  );

  return curated.every((slug) => sectionSlugs.has(slug));
}
