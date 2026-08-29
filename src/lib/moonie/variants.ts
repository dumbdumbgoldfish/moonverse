/** Canonical Moonie expression. maps to `public/moonie/{name}.png` */
export type MoonieExpression =
  | "happy"
  | "excited"
  | "thinking"
  | "recommending"
  | "sleeping"
  | "reading"
  | "waving"
  | "love"
  | "confused"
  | "celebrating";

export interface MoonieVariantMeta {
  id: MoonieExpression;
  file: string;
  label: string;
  mood: string;
  /** True when file is a temporary alias of another canonical pose */
  isAlias?: boolean;
  aliasOf?: MoonieExpression;
}

/**
 * MoonVerse mascot expression registry.
 * Canonical art: happy, excited, thinking, sleeping.
 * recommending and reading alias happy/thinking until dedicated art ships.
 */
export const MOONIE_VARIANTS: Record<MoonieExpression, MoonieVariantMeta> = {
  happy: {
    id: "happy",
    file: "/moonie/happy.png",
    label: "Happy Moonie",
    mood: "Welcoming · default homepage mascot",
  },
  excited: {
    id: "excited",
    file: "/moonie/excited.png",
    label: "Excited Moonie",
    mood: "Celebration · paws raised · sparkling stars",
  },
  thinking: {
    id: "thinking",
    file: "/moonie/thinking.png",
    label: "Thinking Moonie",
    mood: "Curious · recommendation mode",
  },
  recommending: {
    id: "recommending",
    file: "/moonie/happy.png",
    label: "Recommending Moonie",
    mood: "Friendly guide · AI discovery",
    isAlias: true,
    aliasOf: "happy",
  },
  sleeping: {
    id: "sleeping",
    file: "/moonie/sleeping.png",
    label: "Sleeping Moonie",
    mood: "Resting · quiet empty states",
  },
  reading: {
    id: "reading",
    file: "/moonie/thinking.png",
    label: "Reading Moonie",
    mood: "Curious · immersed in a story",
    isAlias: true,
    aliasOf: "thinking",
  },
  waving: {
    id: "waving",
    file: "/moonie/waving.png",
    label: "Waving Moonie",
    mood: "Greeting · hello",
    isAlias: true,
    aliasOf: "happy",
  },
  love: {
    id: "love",
    file: "/moonie/love.png",
    label: "Love Moonie",
    mood: "Recommendation success · delight",
    isAlias: true,
    aliasOf: "excited",
  },
  confused: {
    id: "confused",
    file: "/moonie/confused.png",
    label: "Confused Moonie",
    mood: "Puzzled · not found",
    isAlias: true,
    aliasOf: "thinking",
  },
  celebrating: {
    id: "celebrating",
    file: "/moonie/celebrating.png",
    label: "Celebrating Moonie",
    mood: "Magical confetti · milestones",
    isAlias: true,
    aliasOf: "excited",
  },
};

/** UI context → best expression */
export const MOONIE_CONTEXT_VARIANT = {
  hero: "waving",
  homepageGreeting: "waving",
  askMoonie: "thinking",
  discover: "thinking",
  dailyPick: "recommending",
  moodPicker: "thinking",
  chat: "happy",
  chatEmpty: "waving",
  chatLoading: "thinking",
  chatListening: "thinking",
  chatRecommending: "recommending",
  chatError: "confused",
  notification: "excited",
  notificationEmpty: "sleeping",
  librarySaved: "happy",
  librarySuggest: "reading",
  library: "reading",
  profileInsights: "happy",
  opinionPanel: "recommending",
  writeBanner: "excited",
  emptyState: "thinking",
  notFound: "confused",
  loading: "reading",
  finalCta: "celebrating",
  community: "happy",
  about: "waving",
  fab: "happy",
} as const satisfies Record<string, MoonieExpression>;

export function moonieVariantFor(
  context: keyof typeof MOONIE_CONTEXT_VARIANT
): MoonieExpression {
  return MOONIE_CONTEXT_VARIANT[context];
}

export function moonieImagePath(variant: MoonieExpression): string {
  return MOONIE_VARIANTS[variant].file;
}

/** Trimmed PNG width ÷ height. keeps Moonie proportional, no square letterboxing. */
export const MOONIE_ASPECT: Record<MoonieExpression, number> = {
  happy: 695 / 906,
  excited: 831 / 927,
  thinking: 675 / 927,
  recommending: 695 / 906,
  sleeping: 803 / 833,
  reading: 675 / 927,
  waving: 695 / 906,
  love: 831 / 927,
  confused: 675 / 927,
  celebrating: 831 / 927,
};

/** `size` is display height in px; width follows the character silhouette. */
export function moonieLayoutSize(
  variant: MoonieExpression,
  height: number
): { width: number; height: number } {
  const aspect = MOONIE_ASPECT[variant] ?? 0.82;
  return {
    height,
    width: Math.round(height * aspect),
  };
}
