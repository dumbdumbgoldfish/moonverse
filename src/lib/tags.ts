export interface WebNovelTag {
  name: string;
  slug: string;
}

/** Tags used across MoonVerse for review refinement */
export const WEB_NOVEL_TAGS: WebNovelTag[] = [
  { name: "OP MC", slug: "op-mc" },
  { name: "slow-burn", slug: "slow-burn" },
  { name: "cultivation", slug: "cultivation" },
  { name: "dungeon-crawl", slug: "dungeon-crawl" },
  { name: "character-driven", slug: "character-driven" },
  { name: "beginner-friendly", slug: "beginner-friendly" },
  { name: "cosmic-horror", slug: "cosmic-horror" },
  { name: "earned-power", slug: "earned-power" },
  { name: "magic-academy", slug: "magic-academy" },
  { name: "hard-sci-fi", slug: "hard-sci-fi" },
  { name: "translated-cn", slug: "translated-cn" },
  { name: "chinese-original", slug: "chinese-original" },
  { name: "english-original", slug: "english-original" },
  { name: "royal-road", slug: "royal-road" },
  { name: "enemies-to-lovers", slug: "enemies-to-lovers" },
  { name: "found family", slug: "found-family" },
  { name: "reverse harem", slug: "reverse-harem" },
  { name: "harem", slug: "harem" },
  { name: "anti-hero", slug: "anti-hero" },
  { name: "strong FL", slug: "strong-fl" },
  { name: "strong ML", slug: "strong-ml" },
  { name: "weak-to-strong", slug: "weak-to-strong" },
  { name: "translated-jp", slug: "translated-jp" },
  { name: "translated-kr", slug: "translated-kr" },
  { name: "japanese-original", slug: "japanese-original" },
  { name: "korean-original", slug: "korean-original" },
  { name: "slice-of-life", slug: "slice-of-life" },
  { name: "political intrigue", slug: "political-intrigue" },
  { name: "kingdom building", slug: "kingdom-building" },
  { name: "system", slug: "system" },
  { name: "reincarnation", slug: "reincarnation" },
  { name: "transmigration", slug: "transmigration" },
  { name: "regression", slug: "regression" },
  { name: "villainess", slug: "villainess" },
  { name: "isekai", slug: "isekai-tag" },
  { name: "time travel", slug: "time-travel" },
  { name: "apocalypse", slug: "apocalypse" },
  { name: "survival", slug: "survival" },
  { name: "school life", slug: "school-life" },
  { name: "urban fantasy", slug: "urban-fantasy" },
  { name: "military", slug: "military" },
  { name: "psychological", slug: "psychological" },
  { name: "family drama", slug: "family-drama" },
  { name: "sports", slug: "sports" },
  { name: "gaming", slug: "gaming" },
  { name: "virtual reality", slug: "virtual-reality" },
  { name: "steampunk", slug: "steampunk" },
  { name: "cyberpunk", slug: "cyberpunk-tag" },
  { name: "martial arts", slug: "martial-arts-tag" },
  { name: "mecha", slug: "mecha" },
  { name: "monsters", slug: "monsters" },
  { name: "vampire", slug: "vampire" },
  { name: "werewolf", slug: "werewolf" },
  { name: "demons", slug: "demons" },
  { name: "angels", slug: "angels" },
  { name: "mythology", slug: "mythology" },
  { name: "BL", slug: "bl-tag" },
  { name: "GL", slug: "gl-tag" },
  { name: "LGBTQ+", slug: "lgbtq" },
  { name: "comedy", slug: "comedy-tag" },
  { name: "tragedy", slug: "tragedy" },
  { name: "satire", slug: "satire" },
  { name: "dark", slug: "dark" },
  { name: "fluff", slug: "fluff" },
  { name: "angst", slug: "angst" },
  { name: "spoilers", slug: "spoilers" },
];

/** Suggested tags per genre for search refinement */
export const GENRE_TAG_SLUGS: Record<string, string[]> = {
  romance: ["slow-burn", "enemies-to-lovers", "found-family", "strong-fl", "fluff", "angst", "bl-tag", "gl-tag", "lgbtq"],
  fantasy: ["character-driven", "magic-academy", "earned-power", "kingdom-building", "mythology", "angels", "demons"],
  action: ["op-mc", "earned-power", "martial-arts-tag", "weak-to-strong", "anti-hero"],
  adventure: ["earned-power", "survival", "beginner-friendly", "character-driven"],
  mystery: ["psychological", "character-driven", "dark"],
  thriller: ["psychological", "dark", "character-driven"],
  horror: ["cosmic-horror", "monsters", "vampire", "werewolf", "dark"],
  comedy: ["beginner-friendly", "satire", "fluff", "comedy-tag"],
  "slice-of-life": ["slice-of-life", "fluff", "found-family", "school-life"],
  historical: ["political-intrigue", "family-drama", "character-driven"],
  "sci-fi": ["hard-sci-fi", "virtual-reality", "mecha", "cyberpunk-tag"],
  xianxia: ["cultivation", "earned-power", "translated-cn", "martial-arts-tag", "weak-to-strong"],
  wuxia: ["martial-arts-tag", "cultivation", "earned-power", "translated-cn"],
  murim: ["martial-arts-tag", "earned-power", "character-driven", "political-intrigue"],
  cultivation: ["cultivation", "earned-power", "translated-cn", "weak-to-strong"],
  apocalypse: ["survival", "apocalypse", "dark", "earned-power"],
  system: ["system", "op-mc", "earned-power", "gaming"],
  reincarnation: ["reincarnation", "isekai-tag", "regression", "villainess", "transmigration"],
  transmigration: ["transmigration", "isekai-tag", "reincarnation", "villainess"],
  regression: ["regression", "reincarnation", "earned-power"],
  villainess: ["villainess", "slow-burn", "fluff", "character-driven"],
  bl: ["bl-tag", "slow-burn", "angst", "fluff", "lgbtq"],
  gl: ["gl-tag", "slow-burn", "fluff", "lgbtq"],
  lgbtq: ["lgbtq", "bl-tag", "gl-tag", "slow-burn"],
  "school-life": ["school-life", "slice-of-life", "magic-academy", "fluff"],
  supernatural: ["urban-fantasy", "vampire", "werewolf", "demons", "angels"],
  urban: ["urban-fantasy", "slice-of-life", "character-driven"],
  military: ["military", "political-intrigue", "earned-power"],
  crime: ["psychological", "dark", "character-driven"],
  psychological: ["psychological", "dark", "character-driven"],
  drama: ["family-drama", "angst", "tragedy", "character-driven"],
  family: ["family-drama", "found-family", "slice-of-life"],
  sports: ["sports", "character-driven", "beginner-friendly"],
  gaming: ["gaming", "virtual-reality", "system", "dungeon-crawl"],
  "virtual-reality": ["virtual-reality", "gaming", "system", "dungeon-crawl"],
  "time-travel": ["time-travel", "reincarnation", "character-driven"],
  isekai: ["isekai-tag", "reincarnation", "system", "beginner-friendly"],
  steampunk: ["steampunk", "political-intrigue", "character-driven"],
  cyberpunk: ["cyberpunk-tag", "hard-sci-fi", "dark"],
  survival: ["survival", "apocalypse", "earned-power"],
  "kingdom-building": ["kingdom-building", "political-intrigue", "earned-power"],
  politics: ["political-intrigue", "kingdom-building", "character-driven"],
  magic: ["magic-academy", "earned-power", "character-driven"],
  "martial-arts": ["martial-arts-tag", "earned-power", "weak-to-strong"],
  mecha: ["mecha", "hard-sci-fi", "military"],
  monsters: ["monsters", "dungeon-crawl", "dark"],
  vampire: ["vampire", "urban-fantasy", "dark", "slow-burn"],
  werewolf: ["werewolf", "urban-fantasy", "slow-burn"],
  demons: ["demons", "dark", "anti-hero"],
  angels: ["angels", "mythology", "character-driven"],
  mythology: ["mythology", "character-driven", "earned-power"],
  litrpg: ["dungeon-crawl", "op-mc", "system", "gaming", "royal-road"],
  paranormal: ["vampire", "werewolf", "urban-fantasy", "dark"],
  dystopian: ["dark", "survival", "political-intrigue"],
  ya: ["school-life", "beginner-friendly", "magic-academy"],
};

export function getTagsForGenre(genreSlug?: string): WebNovelTag[] {
  if (!genreSlug) return WEB_NOVEL_TAGS;

  const slugs = GENRE_TAG_SLUGS[genreSlug];
  if (!slugs?.length) return WEB_NOVEL_TAGS;

  const tagMap = new Map(WEB_NOVEL_TAGS.map((t) => [t.slug, t]));
  const genreTags = slugs
    .map((slug) => tagMap.get(slug))
    .filter((t): t is WebNovelTag => Boolean(t));

  const extra = WEB_NOVEL_TAGS.filter((t) => !slugs.includes(t.slug)).slice(0, 12);
  return [...genreTags, ...extra];
}

export const TAG_SEED_DATA = WEB_NOVEL_TAGS.map(({ name, slug }) => ({ name, slug }));

const MOOD_SLUGS = new Set([
  "fluff",
  "angst",
  "dark",
  "slice-of-life",
  "tragedy",
  "comedy-tag",
  "beginner-friendly",
  "character-driven",
  "cosmic-horror",
]);

const STYLE_SLUGS = new Set(["hard-sci-fi", "satire", "psychological"]);

export function tagKindForSlug(slug: string): "TROPE" | "MOOD" | "STYLE" {
  if (MOOD_SLUGS.has(slug)) return "MOOD";
  if (STYLE_SLUGS.has(slug)) return "STYLE";
  return "TROPE";
}

export const CONTENT_WARNING_SEED = [
  {
    name: "Graphic violence",
    slug: "graphic-violence",
    description: "Depictions of graphic or prolonged violence.",
    tagSlugs: ["dark", "military", "apocalypse"],
  },
  {
    name: "Dark themes",
    slug: "dark-themes",
    description: "Bleak, tragic, or psychologically heavy subject matter.",
    tagSlugs: ["dark", "tragedy", "cosmic-horror", "psychological"],
  },
  {
    name: "Sexual content",
    slug: "sexual-content",
    description: "Sexual situations or explicit romance.",
    tagSlugs: ["harem", "reverse-harem"],
  },
] as const;
