import { MOONIE_VARIANTS, type MoonieExpression } from "@/lib/moonie/variants";

/** Full emotional vocabulary. maps to PNG expressions until Rive/Lottie ships. */
export const MOONIE_EMOTIONS = [
  "happy",
  "excited",
  "thinking",
  "reading",
  "sleeping",
  "confused",
  "surprised",
  "proud",
  "cheering",
  "love",
  "sad",
  "celebrating",
  "worried",
  "magic",
] as const;

export type MoonieEmotion = (typeof MOONIE_EMOTIONS)[number];

export interface MoonieEmotionMeta {
  id: MoonieEmotion;
  label: string;
  personality: string;
  /** PNG expression. appearance unchanged */
  expression: MoonieExpression;
  earPosition: "neutral" | "perked" | "drooped";
  tailEnergy: "still" | "sway" | "wag" | "rapid";
  capeFlow: "still" | "gentle" | "flutter";
}

export const MOONIE_EMOTION_META: Record<MoonieEmotion, MoonieEmotionMeta> = {
  happy: {
    id: "happy",
    label: "Happy",
    personality: "Warm · welcoming",
    expression: "happy",
    earPosition: "perked",
    tailEnergy: "sway",
    capeFlow: "gentle",
  },
  excited: {
    id: "excited",
    label: "Excited",
    personality: "Energetic · delighted",
    expression: "excited",
    earPosition: "perked",
    tailEnergy: "rapid",
    capeFlow: "flutter",
  },
  thinking: {
    id: "thinking",
    label: "Thinking",
    personality: "Curious · analytical",
    expression: "thinking",
    earPosition: "neutral",
    tailEnergy: "still",
    capeFlow: "still",
  },
  reading: {
    id: "reading",
    label: "Reading",
    personality: "Immersed · book obsessed",
    expression: "reading",
    earPosition: "neutral",
    tailEnergy: "still",
    capeFlow: "gentle",
  },
  sleeping: {
    id: "sleeping",
    label: "Sleeping",
    personality: "Peaceful · resting",
    expression: "sleeping",
    earPosition: "drooped",
    tailEnergy: "still",
    capeFlow: "still",
  },
  confused: {
    id: "confused",
    label: "Confused",
    personality: "Puzzled · gentle",
    expression: "confused",
    earPosition: "perked",
    tailEnergy: "still",
    capeFlow: "still",
  },
  surprised: {
    id: "surprised",
    label: "Surprised",
    personality: "Wide-eyed · amazed",
    expression: "excited",
    earPosition: "perked",
    tailEnergy: "wag",
    capeFlow: "flutter",
  },
  proud: {
    id: "proud",
    label: "Proud",
    personality: "Accomplished · supportive",
    expression: "happy",
    earPosition: "perked",
    tailEnergy: "sway",
    capeFlow: "gentle",
  },
  cheering: {
    id: "cheering",
    label: "Cheering",
    personality: "Celebratory · encouraging",
    expression: "celebrating",
    earPosition: "perked",
    tailEnergy: "rapid",
    capeFlow: "flutter",
  },
  love: {
    id: "love",
    label: "Love",
    personality: "Perfect match · adoring",
    expression: "love",
    earPosition: "perked",
    tailEnergy: "wag",
    capeFlow: "gentle",
  },
  sad: {
    id: "sad",
    label: "Sad",
    personality: "Sympathetic · gentle",
    expression: "confused",
    earPosition: "drooped",
    tailEnergy: "still",
    capeFlow: "still",
  },
  celebrating: {
    id: "celebrating",
    label: "Celebrating",
    personality: "Joyful · milestone",
    expression: "celebrating",
    earPosition: "perked",
    tailEnergy: "rapid",
    capeFlow: "flutter",
  },
  worried: {
    id: "worried",
    label: "Worried",
    personality: "Cautious · caring",
    expression: "confused",
    earPosition: "drooped",
    tailEnergy: "still",
    capeFlow: "gentle",
  },
  magic: {
    id: "magic",
    label: "Magic Mode",
    personality: "Wizard · story guide",
    expression: "recommending",
    earPosition: "perked",
    tailEnergy: "sway",
    capeFlow: "flutter",
  },
};

export function moonieEmotionToExpression(
  emotion: MoonieEmotion | string
): MoonieExpression {
  const meta = MOONIE_EMOTION_META[emotion as MoonieEmotion];
  if (meta) return meta.expression;
  if (emotion in MOONIE_VARIANTS) return emotion as MoonieExpression;
  return "happy";
}

export function moonieExpressionToEmotion(
  expression: MoonieExpression
): MoonieEmotion {
  const direct = MOONIE_EMOTIONS.find(
    (e) => MOONIE_EMOTION_META[e].expression === expression && e === expression
  );
  if (direct) return direct;

  const alias = MOONIE_EMOTIONS.find(
    (e) => MOONIE_EMOTION_META[e].expression === expression
  );
  if (alias) return alias;

  const aliasedOf = MOONIE_VARIANTS[expression]?.aliasOf;
  if (aliasedOf) {
    const fromAlias = MOONIE_EMOTIONS.find((emotion) => emotion === aliasedOf);
    if (fromAlias) return fromAlias;
  }

  return "happy";
}
