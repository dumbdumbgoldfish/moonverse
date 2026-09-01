/** Production daily cap for Moonie discovery requests (recommendations, lookups, links, compare, image discovery). */
export const MOONIE_DAILY_DISCOVERY_LIMIT = 30;

/** Maximum pinned Moonie conversations per user in the sidebar. */
export const MOONIE_MAX_PINNED_CONVERSATIONS = 3;

/** @deprecated Prefer {@link MOONIE_DAILY_DISCOVERY_LIMIT}. */
export const MOONIE_DAILY_LIMIT = MOONIE_DAILY_DISCOVERY_LIMIT;

export const MOONIE_QUICK_PROMPTS = [
  "A completed slow-burn romance with a clever heroine.",
  "Dark cultivation, found family, but no tragic ending.",
  "Something similar to this novel, but with a lighter tone.",
  "Comforting found-family fantasy I can binge.",
] as const;

export const DISCOVERY_MOOD_CHIPS = [
  { label: "Comforting", prompt: "A comforting, low-angst story with a hopeful ending." },
  { label: "Intense", prompt: "An intense, high-stakes story with sharp pacing." },
  { label: "Mysterious", prompt: "A mysterious story with secrets and slow reveals." },
  { label: "Romantic", prompt: "A romantic story with strong chemistry and emotional payoff." },
  { label: "Funny", prompt: "A funny, witty story that still has heart." },
] as const;

export const DISCOVERY_TROPE_COMBOS = [
  {
    label: "Enemies-to-lovers + fantasy",
    prompt: "Fantasy with enemies-to-lovers, but no tragic ending.",
    tags: ["enemies-to-lovers", "fantasy"],
  },
  {
    label: "Found family + adventure",
    prompt: "Adventure with found family and a completed or bingeable status.",
    tags: ["found-family", "adventure"],
  },
] as const;

export const MOONIE_MOOD_OPTIONS = [
  { label: "Romance", prompt: "Recommend romance novels with emotional depth" },
  { label: "Fantasy", prompt: "Recommend fantasy novels with rich worldbuilding" },
  { label: "BL", prompt: "Recommend BL stories with compelling relationships" },
  { label: "GL", prompt: "Recommend GL stories with strong character chemistry" },
  { label: "Xianxia", prompt: "Recommend xianxia and cultivation novels" },
  { label: "Horror", prompt: "Recommend horror and dark thriller novels" },
  { label: "Completed", prompt: "Recommend completed novels I can binge" },
] as const;

export const MOONIE_DISCOVER_PROMPTS = [
  "I want enemies to lovers",
  "Recommend completed fantasy novels",
  "Give me tragic GL stories",
  "Show me fluffy romance",
] as const;

export const MOONIE_OPEN_STORAGE_KEY = "moonie:open";

/** Routes where the floating Moonie chat FAB adds clutter instead of help. */
const FLOATING_MOONIE_EXACT_HIDE = new Set([
  "/login",
  "/register",
  "/write",
  "/about",
  "/contact",
  "/help",
  "/faq",
  "/settings",
  "/privacy",
  "/terms",
  "/cookies",
  "/dmca",
  "/copyright",
  "/accessibility",
  "/code-of-conduct",
  "/code-of-ethics",
  "/community-standards",
  "/content-guidelines",
  "/moderation-guidelines",
  "/reporting-abuse",
  "/safety",
  "/trust-and-safety",
  "/intellectual-property",
  "/age-and-content-policy",
]);

/**
 * Floating Moonie belongs on browse/read/review surfaces only: not auth, legal, help, settings, admin or dedicated Moonie pages.
 */
export function shouldShowFloatingMoonie(pathname: string): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/onboarding")) return false;
  if (pathname.startsWith("/moonie")) return false;
  if (pathname.startsWith("/ask-moonie")) return false;
  if (FLOATING_MOONIE_EXACT_HIDE.has(pathname)) return false;
  return true;
}

export function createMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

