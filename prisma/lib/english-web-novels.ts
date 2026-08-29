/**
 * Curated English-language web novels from Royal Road.
 * Metadata references public fiction pages on Royal Road.
 */

export interface EnglishWebNovel {
  title: string;
  author: string;
  genreSlug: string;
  tagSlugs: string[];
  externalLink: string;
  secondaryGenreSlug?: string;
}

const rr = (id: number, slug: string) =>
  `https://www.royalroad.com/fiction/${id}/${slug}`;

/** Popular English web fiction on Royal Road */
export const ENGLISH_WEB_NOVELS: EnglishWebNovel[] = [
  {
    title: "Mother of Learning",
    author: "nobody103",
    genreSlug: "fantasy",
    tagSlugs: ["magic-academy", "earned-power", "character-driven"],
    externalLink: rr(21220, "mother-of-learning"),
  },
  {
    title: "The Wandering Inn",
    author: "pirateaba",
    genreSlug: "fantasy",
    tagSlugs: ["character-driven", "earned-power"],
    externalLink: rr(8503, "the-wandering-inn"),
  },
  {
    title: "Dungeon Crawler Carl",
    author: "Matt Dinniman",
    genreSlug: "litrpg",
    tagSlugs: ["dungeon-crawl", "character-driven"],
    externalLink: rr(4009, "dungeon-crawler-carl"),
  },
  {
    title: "He Who Fights With Monsters",
    author: "Shirtaloon",
    genreSlug: "litrpg",
    tagSlugs: ["earned-power", "character-driven"],
    externalLink: rr(42183, "he-who-fights-with-monsters"),
  },
  {
    title: "Azarinth Healer",
    author: "Rhaegar",
    genreSlug: "litrpg",
    tagSlugs: ["dungeon-crawl", "earned-power"],
    externalLink: rr(26356, "azarinth-healer"),
  },
  {
    title: "Beware of Chicken",
    author: "Casualfarmer",
    genreSlug: "xianxia",
    secondaryGenreSlug: "comedy",
    tagSlugs: ["cultivation", "beginner-friendly", "character-driven"],
    externalLink: rr(50358, "beware-of-chicken"),
  },
  {
    title: "Defiance of the Fall",
    author: "TheFirstDefier",
    genreSlug: "litrpg",
    tagSlugs: ["earned-power", "op-mc"],
    externalLink: rr(39408, "defiance-of-the-fall"),
  },
  {
    title: "The Primal Hunter",
    author: "Zogarth",
    genreSlug: "litrpg",
    tagSlugs: ["dungeon-crawl", "earned-power"],
    externalLink: rr(36019, "the-primal-hunter"),
  },
  {
    title: "Sky Pride",
    author: "BrazenEagle",
    genreSlug: "xianxia",
    tagSlugs: ["cultivation", "earned-power"],
    externalLink: rr(55697, "sky-pride"),
  },
  {
    title: "Ave Xia Rem Y",
    author: "Magical Girl Gunslinger",
    genreSlug: "xianxia",
    secondaryGenreSlug: "comedy",
    tagSlugs: ["cultivation", "character-driven"],
    externalLink: rr(36735, "ave-xia-rem-y"),
  },
  {
    title: "Pale Lights",
    author: "Pale Lights",
    genreSlug: "fantasy",
    tagSlugs: ["character-driven", "earned-power"],
    externalLink: rr(55775, "pale-lights"),
  },
  {
    title: "The Perfect Run",
    author: "Vitaly S Alexius",
    genreSlug: "sci-fi",
    tagSlugs: ["character-driven", "earned-power"],
    externalLink: rr(40482, "the-perfect-run"),
  },
  {
    title: "Delve",
    author: "Senne",
    genreSlug: "litrpg",
    tagSlugs: ["dungeon-crawl", "earned-power"],
    externalLink: rr(20381, "delve"),
  },
  {
    title: "The Legend of Randidly Ghosthound",
    author: "Puddles4263",
    genreSlug: "litrpg",
    tagSlugs: ["earned-power", "character-driven"],
    externalLink: rr(5905, "the-legend-of-randidly-ghosthound"),
  },
  {
    title: "Worth the Candle",
    author: "Alexander Wales",
    genreSlug: "fantasy",
    tagSlugs: ["character-driven", "earned-power"],
    externalLink: rr(11483, "worth-the-candle"),
  },
  {
    title: "All Night Laundry",
    author: "Alexander Wales",
    genreSlug: "sci-fi",
    tagSlugs: ["character-driven", "hard-sci-fi"],
    externalLink: rr(1804, "all-night-laundry"),
  },
  {
    title: "The Daily Grind",
    author: "TheVespersBrain",
    genreSlug: "litrpg",
    tagSlugs: ["dungeon-crawl", "character-driven"],
    externalLink: rr(50628, "the-daily-grind"),
  },
  {
    title: "Necropolis",
    author: "Skyclad-Observer",
    genreSlug: "horror",
    tagSlugs: ["dungeon-crawl", "cosmic-horror"],
    externalLink: rr(40597, "necropolis"),
  },
  {
    title: "The Games We Play",
    author: "Ryuugi",
    genreSlug: "litrpg",
    tagSlugs: ["magic-academy", "op-mc"],
    externalLink: rr(2918, "the-games-we-play"),
  },
  {
    title: "Super Minion",
    author: "Lost Demontier",
    genreSlug: "sci-fi",
    tagSlugs: ["character-driven", "earned-power"],
    externalLink: rr(21410, "super-minion"),
  },
  {
    title: "Mark of the Fool",
    author: "J.M. Clarke",
    genreSlug: "fantasy",
    tagSlugs: ["magic-academy", "earned-power"],
    externalLink: rr(48401, "mark-of-the-fool"),
  },
  {
    title: "Beneath the Dragoneye Moons",
    author: "Selkie",
    genreSlug: "fantasy",
    tagSlugs: ["character-driven", "beginner-friendly"],
    externalLink: rr(36299, "beneath-the-dragoneye-moons"),
  },
  {
    title: "The Butcher of Gadobhra",
    author: "Zachariah Dracoulis",
    genreSlug: "fantasy",
    secondaryGenreSlug: "comedy",
    tagSlugs: ["character-driven", "beginner-friendly"],
    externalLink: rr(23357, "the-butcher-of-gadobhra"),
  },
  {
    title: "The Wandering Tower",
    author: "Jason",
    genreSlug: "fantasy",
    tagSlugs: ["dungeon-crawl", "earned-power"],
    externalLink: rr(52758, "the-wandering-tower"),
  },
  {
    title: "Threads of Fate",
    author: "Wandering Turtle",
    genreSlug: "fantasy",
    tagSlugs: ["character-driven", "earned-power"],
    externalLink: rr(67720, "threads-of-fate"),
  },
  {
    title: "Cinnamon Bun",
    author: "RavensDagger",
    genreSlug: "fantasy",
    secondaryGenreSlug: "comedy",
    tagSlugs: ["character-driven", "beginner-friendly"],
    externalLink: rr(41126, "cinnamon-bun"),
  },
  {
    title: "Starter Zone",
    author: "Gazza",
    genreSlug: "litrpg",
    tagSlugs: ["dungeon-crawl", "beginner-friendly"],
    externalLink: rr(69412, "starter-zone"),
  },
  {
    title: "Industrial Strength Magic",
    author: "Brian McClellan",
    genreSlug: "fantasy",
    tagSlugs: ["character-driven", "earned-power"],
    externalLink: rr(65629, "industrial-strength-magic"),
  },
  {
    title: "Kardinally Bound",
    author: "RavensDagger",
    genreSlug: "fantasy",
    tagSlugs: ["character-driven", "earned-power"],
    externalLink: rr(64950, "kardinally-bound"),
  },
  {
    title: "The Magical Girl Maniac",
    author: "RavensDagger",
    genreSlug: "action",
    tagSlugs: ["character-driven", "op-mc"],
    externalLink: rr(61867, "the-magical-girl-maniac"),
  },
];

export function getEnglishWebCatalog(): EnglishWebNovel[] {
  const seen = new Set<string>();
  return ENGLISH_WEB_NOVELS.filter((novel) => {
    const key = novel.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
