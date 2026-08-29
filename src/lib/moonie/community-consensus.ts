export type MoonieCommunitySignalLevel = "early" | "moderate" | "strong";

export type MoonieThemeSentiment =
  | "praised"
  | "criticised"
  | "mixed"
  | "divisive";

export interface MoonieCommunityTheme {
  label: string;
  sentiment: MoonieThemeSentiment;
  mentionCount: number;
}

export interface MoonieCommunityConsensus {
  signalLevel: MoonieCommunitySignalLevel;
  signalLabel: string;
  disclaimer: string | null;
  praised: MoonieCommunityTheme[];
  criticised: MoonieCommunityTheme[];
  mixed: MoonieCommunityTheme[];
  divisive: MoonieCommunityTheme[];
}

export const COMMUNITY_ASPECTS: Array<{
  label: string;
  keywords: string[];
}> = [
  {
    label: "World-building",
    keywords: [
      "world",
      "worldbuilding",
      "world-building",
      "lore",
      "setting",
      "universe",
      "magic system",
    ],
  },
  {
    label: "Pacing",
    keywords: ["pacing", "pace", "slow", "fast", "drag", "rushed", "boring"],
  },
  {
    label: "Characters",
    keywords: [
      "character",
      "characters",
      "mc",
      "protagonist",
      "fl",
      "ml",
      "cast",
      "development",
    ],
  },
  {
    label: "Romance",
    keywords: ["romance", "romantic", "ship", "couple", "love interest"],
  },
  {
    label: "Plot",
    keywords: ["plot", "story", "storyline", "twist", "narrative"],
  },
  {
    label: "Writing",
    keywords: ["writing", "prose", "translation", "grammar", "style"],
  },
  {
    label: "Action",
    keywords: ["action", "fight", "battles", "combat"],
  },
];

export function communitySignalLevel(
  reviewCount: number
): MoonieCommunitySignalLevel {
  if (reviewCount >= 15) return "strong";
  if (reviewCount >= 5) return "moderate";
  return "early";
}

export function communitySignalLabel(level: MoonieCommunitySignalLevel): string {
  if (level === "strong") return "Strong signal";
  if (level === "moderate") return "Moderate signal";
  return "Early signal";
}

export function communityDisclaimer(
  reviewCount: number,
  level: MoonieCommunitySignalLevel
): string | null {
  if (reviewCount === 0) return null;
  if (level === "early") {
    return `Only ${reviewCount} MoonVerse review${reviewCount === 1 ? "" : "s"} available — treat this as an early signal rather than a strong consensus.`;
  }
  if (level === "moderate") {
    return `${reviewCount} MoonVerse reviews — a moderate community signal.`;
  }
  return null;
}

interface ReviewSnippet {
  rating: number;
  text: string;
}

function aspectMentioned(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
}

function reviewLean(rating: number): "positive" | "negative" | "neutral" {
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}

export function buildCommunityConsensusFromReviews(
  reviews: ReviewSnippet[]
): MoonieCommunityConsensus | null {
  if (reviews.length === 0) return null;

  const level = communitySignalLevel(reviews.length);
  const themes: MoonieCommunityTheme[] = [];

  for (const aspect of COMMUNITY_ASPECTS) {
    const mentions = reviews.filter((review) =>
      aspectMentioned(review.text, aspect.keywords)
    );
    if (mentions.length === 0) continue;

    const positive = mentions.filter(
      (review) => reviewLean(review.rating) === "positive"
    ).length;
    const negative = mentions.filter(
      (review) => reviewLean(review.rating) === "negative"
    ).length;
    const neutral = mentions.length - positive - negative;
    const positiveShare = positive / mentions.length;
    const negativeShare = negative / mentions.length;

    let sentiment: MoonieThemeSentiment;
    if (positiveShare >= 0.7) sentiment = "praised";
    else if (negativeShare >= 0.7) sentiment = "criticised";
    else if (positive > 0 && negative > 0) sentiment = "divisive";
    else if (neutral >= mentions.length * 0.5) sentiment = "mixed";
    else sentiment = "mixed";

    themes.push({
      label: aspect.label,
      sentiment,
      mentionCount: mentions.length,
    });
  }

  if (themes.length === 0) return null;

  return {
    signalLevel: level,
    signalLabel: communitySignalLabel(level),
    disclaimer: communityDisclaimer(reviews.length, level),
    praised: themes.filter((t) => t.sentiment === "praised"),
    criticised: themes.filter((t) => t.sentiment === "criticised"),
    mixed: themes.filter((t) => t.sentiment === "mixed"),
    divisive: themes.filter((t) => t.sentiment === "divisive"),
  };
}
