import type { Rng } from "./rng";
import type { ReviewStyle } from "./review-composer";

const FIRST = [
  "Aria", "Kai", "Mira", "Jonah", "Sable", "Ren", "Elise", "Theo", "Nova", "Cass",
  "Lina", "Owen", "Priya", "Felix", "Yuna", "Marcus", "Ivy", "Dante", "Sora", "Helena",
  "Quinn", "Amir", "Tessa", "Luca", "Nia", "Haruto", "Vera", "Cole", "Anika", "Rafael",
  "Jade", "Silas", "Mei", "Orion", "Freya", "Nolan", "Zara", "Ezra", "Clara", "Kenji",
  "Nora", "Ibrahim", "Suki", "Mateo", "Aisha", "Leo", "Hana", "Rowan", "Ines", "Dev",
] as const;

const LAST = [
  "Hart", "Voss", "Nguyen", "Okada", "Reyes", "Brooks", "Singh", "Adler", "Chen", "Morales",
  "Patel", "Kline", "Sato", "Walsh", "Ibrahim", "Park", "Diaz", "Keller", "Yamamoto", "Frost",
  "Brennan", "Cho", "Moreau", "Griffin", "Ali", "Tanaka", "Shaw", "Costa", "Lindgren", "Bauer",
  "Okafor", "Duarte", "Kim", "Novak", "Hassan", "Berg", "Rossi", "West", "Fischer", "Nakamura",
] as const;

const HANDLE_SUFFIX = [
  "reads", "pages", "ink", "chapter", "shelf", "moon", "tome", "quill", "lore", "verse",
  "archive", "scroll", "lantern", "night", "story", "stack", "folio", "spine", "binge", "arc",
] as const;

export type ReaderPersona =
  | "beginner-reader"
  | "casual-reader"
  | "binge-reader"
  | "veteran-reviewer"
  | "analytical-reviewer"
  | "emotional-reviewer"
  | "romance-lover"
  | "horror-fan"
  | "xianxia-addict"
  | "bl-fan"
  | "gl-fan"
  | "sci-fi-reader";

const PERSONAS: Array<{
  id: ReaderPersona;
  style: ReviewStyle;
  genres: string[];
  tags: string[];
  bio: string;
  preferences: string;
}> = [
  {
    id: "beginner-reader",
    style: "beginner",
    genres: ["fantasy", "romance", "comedy", "school-life"],
    tags: ["beginner-friendly", "fluff", "slow-burn"],
    bio: "New to web novels and still learning the tropes. Honest first impressions only.",
    preferences: "Complete arcs, clear prose, gentle learning curves.",
  },
  {
    id: "casual-reader",
    style: "casual",
    genres: ["romance", "comedy", "slice-of-life", "drama"],
    tags: ["fluff", "slow-burn", "found-family"],
    bio: "Weeknight reader. I finish what hooks me and drop what stalls.",
    preferences: "Snackable chapters, warm casts, low homework vibes.",
  },
  {
    id: "binge-reader",
    style: "casual",
    genres: ["system", "action", "apocalypse", "gaming"],
    tags: ["op-mc", "system", "weak-to-strong", "dungeon-crawl"],
    bio: "If it updates, I am already three arcs ahead. Sleep is optional.",
    preferences: "High chapter count, momentum, cliffhangers that pay off.",
  },
  {
    id: "veteran-reviewer",
    style: "veteran",
    genres: ["fantasy", "xianxia", "cultivation", "wuxia"],
    tags: ["character-driven", "earned-power", "cultivation"],
    bio: "I have DNFed louder books than most people finish. Craft notes welcome.",
    preferences: "Consequence stacking, coherent power rules, edited middles.",
  },
  {
    id: "analytical-reviewer",
    style: "analytical",
    genres: ["mystery", "psychological", "sci-fi", "thriller"],
    tags: ["psychological", "hard-sci-fi", "character-driven", "political-intrigue"],
    bio: "Structure-first reviewer. I track promises, payoffs and motive sheets.",
    preferences: "Tight plotting, fair mysteries, institutional pressure.",
  },
  {
    id: "emotional-reviewer",
    style: "emotional",
    genres: ["drama", "romance", "family", "tragedy"],
    tags: ["angst", "found-family", "family-drama", "tragedy"],
    bio: "I rate with my chest first and my spreadsheet second.",
    preferences: "Earned tears, soft landings, relationships with friction.",
  },
  {
    id: "romance-lover",
    style: "emotional",
    genres: ["romance", "villainess", "drama", "historical"],
    tags: ["slow-burn", "enemies-to-lovers", "strong-fl", "fluff"],
    bio: "Romance shelf permanently overflowing. Chemistry over convenience.",
    preferences: "Consent-aware tension, payoff after patience, sharp banter.",
  },
  {
    id: "horror-fan",
    style: "analytical",
    genres: ["horror", "supernatural", "psychological", "thriller"],
    tags: ["cosmic-horror", "dark", "vampire", "psychological"],
    bio: "Atmosphere over jump scares. I want dread that lingers after sleep.",
    preferences: "Uneasy worlds, unreliable safety, monsters with rules.",
  },
  {
    id: "xianxia-addict",
    style: "veteran",
    genres: ["xianxia", "cultivation", "wuxia", "murim"],
    tags: ["cultivation", "martial-arts-tag", "translated-cn", "weak-to-strong"],
    bio: "Sect politics and sword arcs are my comfort food. Filler mountains tested me.",
    preferences: "Clear realms, political sects, training that changes people.",
  },
  {
    id: "bl-fan",
    style: "emotional",
    genres: ["bl", "lgbtq", "romance", "drama"],
    tags: ["bl-tag", "lgbtq", "angst", "slow-burn"],
    bio: "BL reader hunting chemistry, communication and earned softness.",
    preferences: "Character agency, slow trust, zero bait-and-switch harm.",
  },
  {
    id: "gl-fan",
    style: "emotional",
    genres: ["gl", "lgbtq", "romance", "school-life"],
    tags: ["gl-tag", "lgbtq", "fluff", "slow-burn"],
    bio: "GL shelf curator. Soft hours and sharp dialogue both welcome.",
    preferences: "Mutual yearning, strong FL leads, community warmth.",
  },
  {
    id: "sci-fi-reader",
    style: "analytical",
    genres: ["sci-fi", "virtual-reality", "gaming", "cyberpunk"],
    tags: ["hard-sci-fi", "virtual-reality", "system", "cyberpunk-tag"],
    bio: "Systems, simulations and near-future messes. Soft magic needs hard rules.",
    preferences: "Coherent tech, ethical dilemmas, world logic under stress.",
  },
];

export interface DemoUserSpec {
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  favouriteGenreSlugs: string[];
  favouriteTagSlugs: string[];
  readingPreferences: string;
  persona: ReaderPersona;
  writingStyle: ReviewStyle;
  joinOffsetDays: number;
  activity: "low" | "medium" | "high";
  role?: "USER" | "ADMIN";
}

function avatarFor(username: string): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(username)}`;
}

export function generateDemoUsers(rng: Rng, count: number): DemoUserSpec[] {
  const usedUsernames = new Set<string>();
  const usedEmails = new Set<string>();
  const users: DemoUserSpec[] = [];

  for (let i = 0; i < count; i++) {
    const persona = PERSONAS[i % PERSONAS.length];
    let username = "";
    let displayName = "";
    let guard = 0;
    while (guard++ < 80) {
      const first = rng.pick(FIRST);
      const last = rng.pick(LAST);
      displayName = `${first} ${last}`;
      const base = `${first}${rng.pick(HANDLE_SUFFIX)}${rng.int(2, 99)}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      username = `${base}`.slice(0, 24);
      if (!usedUsernames.has(username)) break;
      username = `${base}${i}`.slice(0, 24);
      if (!usedUsernames.has(username)) break;
    }
    usedUsernames.add(username);

    let email = `${username}@moonverse.demo`;
    let e = 1;
    while (usedEmails.has(email)) {
      email = `${username}${e}@moonverse.demo`;
      e += 1;
    }
    usedEmails.add(email);

    const favouriteGenreSlugs = rng
      .shuffle([...persona.genres, ...rng.shuffle(["fantasy", "action", "mystery"]).slice(0, 1)])
      .slice(0, rng.int(3, 5));
    const favouriteTagSlugs = rng.shuffle([...persona.tags]).slice(0, rng.int(2, 4));
    const activityRoll = rng.next();
    const activity: DemoUserSpec["activity"] =
      persona.id === "binge-reader"
        ? "high"
        : activityRoll < 0.22
          ? "low"
          : activityRoll < 0.65
            ? "medium"
            : "high";

    users.push({
      email,
      username,
      displayName,
      bio: `${persona.bio} Favourites: ${favouriteGenreSlugs.join(", ")}. Tags: ${favouriteTagSlugs.join(", ")}.`,
      avatarUrl: avatarFor(username),
      favouriteGenreSlugs,
      favouriteTagSlugs,
      readingPreferences: persona.preferences,
      persona: persona.id,
      writingStyle: persona.style,
      joinOffsetDays: rng.int(14, 520),
      activity,
      role: i === 0 ? "ADMIN" : "USER",
    });
  }

  return users;
}
