import type { MoonieSpoilerMode } from "@/types/moonie";

export const MOONIE_SPOILER_STORAGE_KEY = "mv-moonie-spoiler-mode";
export const DEFAULT_SPOILER_MODE: MoonieSpoilerMode = "none";

export const SPOILER_MODE_LABELS: Record<MoonieSpoilerMode, string> = {
  none: "No spoilers",
  light: "Light spoilers",
  full: "Full discussion",
};

export function normalizeSpoilerMode(
  value: string | null | undefined
): MoonieSpoilerMode {
  if (value === "light" || value === "full") return value;
  return "none";
}

export function readStoredSpoilerMode(): MoonieSpoilerMode {
  if (typeof window === "undefined") return DEFAULT_SPOILER_MODE;
  try {
    return normalizeSpoilerMode(
      localStorage.getItem(MOONIE_SPOILER_STORAGE_KEY)
    );
  } catch {
    return DEFAULT_SPOILER_MODE;
  }
}

export function writeStoredSpoilerMode(mode: MoonieSpoilerMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MOONIE_SPOILER_STORAGE_KEY, mode);
  } catch {
    // ignore quota errors
  }
}

export function cycleSpoilerMode(current: MoonieSpoilerMode): MoonieSpoilerMode {
  if (current === "none") return "light";
  if (current === "light") return "full";
  return "none";
}

export function sanitizeReviewExcerpt(options: {
  title: string;
  body: string;
  containsSpoilers: boolean;
  mode: MoonieSpoilerMode;
  maxLength?: number;
}): string | null {
  const max = options.maxLength ?? 180;
  const { mode, containsSpoilers, title, body } = options;

  if (mode === "none") {
    if (containsSpoilers) return null;
    const trimmed = body.trim();
    if (!trimmed) return title;
    return (
      trimmed.slice(0, max) + (trimmed.length > max ? "…" : "")
    );
  }

  if (mode === "light") {
    if (containsSpoilers) {
      return `${title} (spoiler review — open the novel page for details)`;
    }
    const trimmed = body.trim();
    return trimmed.slice(0, max) + (trimmed.length > max ? "…" : "");
  }

  const trimmed = body.trim();
  return trimmed.slice(0, max * 1.5) + (trimmed.length > max * 1.5 ? "…" : "");
}

export function spoilerConstraintForOpenAI(mode: MoonieSpoilerMode): string {
  if (mode === "none") {
    return "Do not reveal plot spoilers, twists, deaths, or major story outcomes. Keep discussion to premise, tone, tags, and community ratings only.";
  }
  if (mode === "light") {
    return "Avoid major plot spoilers. You may mention broad themes and early-setup details only.";
  }
  return "The user opted into full discussion. You may discuss plot details when grounded in catalogue or review data.";
}

export function shouldOfferSpoilerModeSwitch(message: string): boolean {
  return /\b(spoiler|plot twist|ending|who dies|what happens)\b/i.test(message);
}
