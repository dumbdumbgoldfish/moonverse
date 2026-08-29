import type { MoonieEmotion } from "@/lib/moonie/emotions";
import { MOONIE_EMOTION_META } from "@/lib/moonie/emotions";

/** Behavioral animation layer. motion + particles on top of static PNG art. */
export const MOONIE_ANIMATION_STATES = [
  "idle",
  "greeting",
  "thinking",
  "reading",
  "recommendation",
  "excited",
  "celebration",
  "sleeping",
  "typing",
  "loading",
  "error",
  "empty",
] as const;

export type MoonieAnimationState = (typeof MOONIE_ANIMATION_STATES)[number];

export type MoonieParticlePreset =
  | "none"
  | "sparkles"
  | "stars"
  | "books"
  | "questions"
  | "confetti"
  | "sleep"
  | "magic"
  | "hearts";

export interface MoonieAnimationStateMeta {
  id: MoonieAnimationState;
  label: string;
  description: string;
  defaultEmotion: MoonieEmotion;
  particles: MoonieParticlePreset;
}

export const MOONIE_ANIMATION_STATE_META: Record<
  MoonieAnimationState,
  MoonieAnimationStateMeta
> = {
  idle: {
    id: "idle",
    label: "Idle",
    description: "Gentle breathing · blinking · tail sway",
    defaultEmotion: "happy",
    particles: "sparkles",
  },
  greeting: {
    id: "greeting",
    label: "Greeting",
    description: "Small wave · smile · head tilt",
    defaultEmotion: "happy",
    particles: "sparkles",
  },
  thinking: {
    id: "thinking",
    label: "Thinking",
    description: "Paw on chin · question marks · looking around",
    defaultEmotion: "thinking",
    particles: "questions",
  },
  reading: {
    id: "reading",
    label: "Reading",
    description: "Glowing book · eyes moving · page flip",
    defaultEmotion: "reading",
    particles: "books",
  },
  recommendation: {
    id: "recommendation",
    label: "Recommendation",
    description: "Book opens · magic particles · floating covers",
    defaultEmotion: "magic",
    particles: "magic",
  },
  excited: {
    id: "excited",
    label: "Excited",
    description: "Jumping · stars · rapid tail wag",
    defaultEmotion: "excited",
    particles: "stars",
  },
  celebration: {
    id: "celebration",
    label: "Celebration",
    description: "Confetti · sparkles · spin",
    defaultEmotion: "celebrating",
    particles: "confetti",
  },
  sleeping: {
    id: "sleeping",
    label: "Sleeping",
    description: "Curled up · soft Z particles · slow breath",
    defaultEmotion: "sleeping",
    particles: "sleep",
  },
  typing: {
    id: "typing",
    label: "Typing",
    description: "Watching magical floating keyboard",
    defaultEmotion: "thinking",
    particles: "sparkles",
  },
  loading: {
    id: "loading",
    label: "Loading",
    description: "Reading a book while waiting",
    defaultEmotion: "reading",
    particles: "books",
  },
  error: {
    id: "error",
    label: "Error",
    description: "Confused expression",
    defaultEmotion: "confused",
    particles: "questions",
  },
  empty: {
    id: "empty",
    label: "Empty",
    description: "Looking around for stories",
    defaultEmotion: "thinking",
    particles: "sparkles",
  },
};

/** UI placement → default animation state */
export const MOONIE_CONTEXT_ANIMATION = {
  hero: "idle",
  homepageGreeting: "greeting",
  askMoonie: "thinking",
  discover: "thinking",
  dailyPick: "recommendation",
  moodPicker: "thinking",
  chat: "idle",
  chatEmpty: "greeting",
  chatListening: "typing",
  chatLoading: "loading",
  chatRecommending: "recommendation",
  chatError: "error",
  notification: "excited",
  notificationEmpty: "sleeping",
  librarySaved: "reading",
  librarySuggest: "reading",
  library: "reading",
  profileInsights: "idle",
  opinionPanel: "recommendation",
  writeBanner: "excited",
  emptyState: "empty",
  notFound: "error",
  loading: "loading",
  finalCta: "celebration",
  community: "idle",
  about: "greeting",
  fab: "idle",
} as const satisfies Record<string, MoonieAnimationState>;

export type MoonieAnimationContext = keyof typeof MOONIE_CONTEXT_ANIMATION;

export function moonieAnimationFor(
  context: MoonieAnimationContext
): MoonieAnimationState {
  return MOONIE_CONTEXT_ANIMATION[context];
}

export function moonieEmotionForState(
  state: MoonieAnimationState,
  override?: MoonieEmotion
): MoonieEmotion {
  if (override) return override;
  return MOONIE_ANIMATION_STATE_META[state].defaultEmotion;
}

export function moonieParticlesForState(
  state: MoonieAnimationState
): MoonieParticlePreset {
  return MOONIE_ANIMATION_STATE_META[state].particles;
}

export function moonieEmotionMeta(emotion: MoonieEmotion) {
  return MOONIE_EMOTION_META[emotion];
}
