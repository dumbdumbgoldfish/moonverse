/**
 * Telegram-style whimsical display names for demo profile refresh.
 * Generates unique 2–6 word names from combinatorial pools.
 */

import type { Rng } from "./rng";

const OPENERS = [
  "Sweet", "Sleepy", "Chaotic", "Ancient", "Tiny", "Cosmic", "Velvet", "Golden",
  "Midnight", "Sparkling", "Forgotten", "Honest", "Lucky", "Melancholy", "Radiant",
  "Stubborn", "Gentle", "Feral", "Polite", "Unhinged", "Soft", "Dramatic", "Quiet",
  "Eternal", "Wandering", "Secret", "Royal", "Cursed", "Blessed", "Mysterious",
  "I Am the", "Ko Ko", "Senior", "Junior", "Captain", "Professor", "Saint", "Little",
  "Pressure Under the", "Keeper of the", "Heir to the", "Ghost of the", "Duke of",
] as const;

const CORES = [
  "Salted Fish", "Purple Sea", "Book Mountain", "Apple Blossom", "Moon Rabbit",
  "Straw Hat", "Devil Fruit", "Thunder Kitten", "Noble Shadow", "Awakened Potato",
  "Cultivation Cat", "Dungeon Snack", "Romance Goblin", "Plot Armor", "Cliffhanger",
  "Slow Burn", "Angst Cloud", "Fluff Puff", "Sect Politics", "Dragon Noodle",
  "Mana Tea", "Spirit Fox", "Sword Auntie", "Villainess Tea", "System Glitch",
  "Isekai Commute", "Murim Commuter", "Chapter Hoarder", "Review Goblin",
  "Bookmark Gremlin", "Trope Scholar", "Ship Captain", "Fanfic Goblin",
  "Library Ghost", "Scroll Gremlin", "Moonie Disciple", "Salted Caramel Cultivator",
  "Crimson Archive", "Azure Horizon", "Jade Lantern", "Silver Quill",
] as const;

const CLOSERS = [
  "Enjoyer", "Witness", "Apprentice", "Connoisseur", "Collector", "Survivor",
  "Enthusiast", "Scholar", "Custodian", "Apprentice", "Wanderer", "Dreamer",
  "Advocate", "Curator", "Historian", "Romantic", "Pilgrim", "Guardian",
  "Sweet Little Wife", "Eternal Reader", "Night Owl", "Shelf Gremlin",
  "Chapter Goblin", "Plot Witness", "Salt Merchant", "Tea Sommelier",
] as const;

const CONNECTORS = ["of", "from", "in", "beneath", "beyond", "within"] as const;

const PATTERNS: Array<(rng: Rng) => string> = [
  (rng) => `${rng.pick(OPENERS)} ${rng.pick(CORES)}`,
  (rng) => `${rng.pick(OPENERS)} ${rng.pick(CORES)} ${rng.pick(CLOSERS)}`,
  (rng) => `${rng.pick(OPENERS)} ${rng.pick(CORES)}`,
  (rng) => `${rng.pick(OPENERS)} ${rng.pick(CONNECTORS)} ${rng.pick(CORES)}`,
  (rng) => `${rng.pick(CORES)} ${rng.pick(CLOSERS)}`,
  (rng) => `${rng.pick(OPENERS)} ${rng.pick(CORES)}`,
  (rng) => `I Am the ${rng.pick(CORES)}`,
  (rng) => `${rng.pick(OPENERS)} ${rng.pick(CORES)} ${rng.pick(CLOSERS)}`,
];

function normalizeName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, 80);
}

/** Generate a unique whimsical display name not present in `used`. */
export function generateUniqueDisplayName(
  rng: Rng,
  used: Set<string>,
  maxAttempts = 200
): string {
  for (let i = 0; i < maxAttempts; i++) {
    const pattern = rng.pick(PATTERNS);
    const candidate = normalizeName(pattern(rng));
    const key = candidate.toLowerCase();
    if (!used.has(key) && candidate.length >= 3) {
      used.add(key);
      return candidate;
    }
  }
  const fallback = normalizeName(`${rng.pick(OPENERS)} ${rng.pick(CORES)} ${used.size}`);
  used.add(fallback.toLowerCase());
  return fallback;
}

/** Preserved display names for admin/demo login accounts. */
export const PRESERVED_ADMIN_DISPLAY_NAMES = new Set([
  "Ivy Brennan",
  "StarReader",
]);
