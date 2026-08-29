import { GENRE_SEED_DATA } from "../../../src/lib/genres";
import { TAG_SEED_DATA } from "../../../src/lib/tags";
import type { Rng } from "./rng";
import type { SeedCatalogEntry } from "../novel-catalog";
import { composeEditorialSynopsis } from "./review-composer";

const EPITHETS = [
  "Crimson", "Silent", "Verdant", "Obsidian", "Gilded", "Fractured", "Luminous",
  "Ashen", "Ivory", "Sable", "Hollow", "Radiant", "Wandering", "Fallen",
  "Eternal", "Shattered", "Velvet", "Iron", "Glass", "Midnight",
] as const;

const NOUNS = [
  "Archive", "Covenant", "Garden", "Citadel", "Covenant", "Harbor", "Crown",
  "Spire", "Threshold", "Covenant", "Oath", "Vow", "Heir", "Ember", "Tide",
  "Mirror", "Lantern", "Covenant", "Sigil", "Horizon",
] as const;

const AUTHOR_FIRST = [
  "Lin", "Mara", "Cole", "Yuna", "Jonah", "Priya", "Silas", "Helena", "Ren", "Nova",
] as const;

const AUTHOR_LAST = [
  "Ashford", "Reed", "Vale", "Morris", "Tan", "Brooks", "Ibrahim", "Cho", "Walsh", "Park",
] as const;

export interface NovelSeed {
  title: string;
  author: string;
  genreSlug: string;
  secondaryGenreSlug?: string;
  tagSlugs: string[];
  synopsis: string;
  externalLink: string;
}

export function buildSyntheticNovelSeeds(
  rng: Rng,
  count: number,
  existingTitles: Set<string>
): NovelSeed[] {
  const genres = GENRE_SEED_DATA.map((g) => g.slug);
  const tags = TAG_SEED_DATA.map((t) => t.slug);
  const seeds: NovelSeed[] = [];
  let guard = 0;

  while (seeds.length < count && guard++ < count * 40) {
    const genreSlug = rng.pick(genres);
    const secondaryGenreSlug = rng.chance(0.35) ? rng.pick(genres.filter((g) => g !== genreSlug)) : undefined;
    const tagSlugs = rng.shuffle(tags).slice(0, rng.int(3, 6));
    const title = `${rng.pick(EPITHETS)} ${rng.pick(NOUNS)}${rng.chance(0.4) ? ` of ${rng.pick(EPITHETS)}` : ""}`;
    const key = title.toLowerCase().trim();
    if (existingTitles.has(key)) continue;
    existingTitles.add(key);

    const author = `${rng.pick(AUTHOR_FIRST)} ${rng.pick(AUTHOR_LAST)}`;
    seeds.push({
      title,
      author,
      genreSlug,
      secondaryGenreSlug,
      tagSlugs,
      synopsis: composeEditorialSynopsis(title, author, [genreSlug, ...(secondaryGenreSlug ? [secondaryGenreSlug] : [])], tagSlugs, rng),
      externalLink: "",
    });
  }

  return seeds;
}

export function catalogEntryToSeed(entry: SeedCatalogEntry): NovelSeed {
  return {
    title: entry.title,
    author: entry.author,
    genreSlug: entry.genreSlug,
    secondaryGenreSlug: entry.secondaryGenreSlug,
    tagSlugs: entry.tagSlugs.slice(0, 6),
    synopsis: "",
    externalLink: entry.externalLink ?? "",
  };
}
