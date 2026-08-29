export type LanguageCode =
  | "en"
  | "es"
  | "pt"
  | "fr"
  | "de"
  | "id"
  | "fil"
  | "th"
  | "vi"
  | "zh"
  | "ja"
  | "ko"
  | "pl"
  | "tr"
  | "it";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

export const MOONVERSE_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "id", label: "Indonesian", nativeLabel: "Bahasa Indonesia" },
  { code: "fil", label: "Filipino", nativeLabel: "Filipino" },
  { code: "th", label: "Thai", nativeLabel: "ไทย" },
  { code: "vi", label: "Vietnamese", nativeLabel: "Tiếng Việt" },
  { code: "zh", label: "Chinese (Simplified)", nativeLabel: "简体中文" },
  { code: "ja", label: "Japanese", nativeLabel: "日本語" },
  { code: "ko", label: "Korean", nativeLabel: "한국어" },
  { code: "pl", label: "Polish", nativeLabel: "Polski" },
  { code: "tr", label: "Turkish", nativeLabel: "Türkçe" },
  { code: "it", label: "Italian", nativeLabel: "Italiano" },
];

export interface LanguagePreferences {
  displayLanguage: LanguageCode;
  storyLanguage: LanguageCode;
}

export const LANGUAGE_PREFERENCES_EVENT = "mv-language-preferences";
export const LANGUAGE_STORAGE_KEY = "mv-language-preferences";
export const DISPLAY_LANG_COOKIE = "mv-display-lang";
export const STORY_LANG_COOKIE = "mv-story-lang";

export const DEFAULT_PREFS: LanguagePreferences = {
  displayLanguage: "en",
  storyLanguage: "en",
};

/** Values commonly stored on Novel.originalLanguage for each code. */
const STORY_LANGUAGE_ALIASES: Record<LanguageCode, string[]> = {
  en: ["en", "english", "eng"],
  es: ["es", "spanish", "español", "espanol"],
  pt: ["pt", "portuguese", "português", "portugues"],
  fr: ["fr", "french", "français", "francais"],
  de: ["de", "german", "deutsch"],
  id: ["id", "indonesian", "bahasa indonesia", "bahasa"],
  fil: ["fil", "filipino", "tagalog", "tl"],
  th: ["th", "thai"],
  vi: ["vi", "vietnamese", "tiếng việt", "tieng viet"],
  zh: ["zh", "zh-cn", "zh-hans", "chinese", "mandarin", "简体中文", "中文"],
  ja: ["ja", "japanese", "日本語", "jp"],
  ko: ["ko", "korean", "한국어", "kr"],
  pl: ["pl", "polish", "polski"],
  tr: ["tr", "turkish", "türkçe", "turkce"],
  it: ["it", "italian", "italiano"],
};

function isLanguageCode(value: unknown): value is LanguageCode {
  return (
    typeof value === "string" &&
    MOONVERSE_LANGUAGES.some((lang) => lang.code === value)
  );
}

export function getLanguageLabel(code: LanguageCode): string {
  return (
    MOONVERSE_LANGUAGES.find((lang) => lang.code === code)?.label ?? "English"
  );
}

export function getLanguageNativeLabel(code: LanguageCode): string {
  return (
    MOONVERSE_LANGUAGES.find((lang) => lang.code === code)?.nativeLabel ??
    "English"
  );
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; SameSite=Lax`;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return null;
  }
}

export function readLanguagePreferences(): LanguagePreferences {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LanguagePreferences>;
      return {
        displayLanguage: isLanguageCode(parsed.displayLanguage)
          ? parsed.displayLanguage
          : DEFAULT_PREFS.displayLanguage,
        storyLanguage: isLanguageCode(parsed.storyLanguage)
          ? parsed.storyLanguage
          : DEFAULT_PREFS.storyLanguage,
      };
    }
  } catch {
    // fall through to cookies
  }

  const display = readCookie(DISPLAY_LANG_COOKIE);
  const story = readCookie(STORY_LANG_COOKIE);
  return {
    displayLanguage: isLanguageCode(display)
      ? display
      : DEFAULT_PREFS.displayLanguage,
    storyLanguage: isLanguageCode(story) ? story : DEFAULT_PREFS.storyLanguage,
  };
}

/** Updates the document language attribute for accessibility / i18n. */
export function applyDisplayLanguage(code: LanguageCode) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = code;
}

export function saveLanguagePreferences(
  prefs: LanguagePreferences
): LanguagePreferences {
  if (typeof window !== "undefined") {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify(prefs));
    writeCookie(DISPLAY_LANG_COOKIE, prefs.displayLanguage);
    writeCookie(STORY_LANG_COOKIE, prefs.storyLanguage);
    applyDisplayLanguage(prefs.displayLanguage);
    window.dispatchEvent(
      new CustomEvent(LANGUAGE_PREFERENCES_EVENT, { detail: prefs })
    );
  }
  return prefs;
}

export function getStoryLanguageAliases(code: LanguageCode): string[] {
  return STORY_LANGUAGE_ALIASES[code] ?? [code];
}

export function novelMatchesStoryLanguage(
  originalLanguage: string | null | undefined,
  code: LanguageCode
): boolean {
  if (!originalLanguage?.trim()) return false;
  const normalized = originalLanguage.trim().toLowerCase();
  return getStoryLanguageAliases(code).some(
    (alias) => alias.toLowerCase() === normalized
  );
}

/** Parse story language from a Cookie header (API routes / RSC). */
export function parseStoryLanguageFromCookieHeader(
  cookieHeader: string | null
): LanguageCode | undefined {
  if (!cookieHeader) return undefined;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${STORY_LANG_COOKIE}=`));
  if (!match) return undefined;
  try {
    const value = decodeURIComponent(match.slice(STORY_LANG_COOKIE.length + 1));
    return isLanguageCode(value) ? value : undefined;
  } catch {
    return undefined;
  }
}
