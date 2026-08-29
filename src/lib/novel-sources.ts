import { inferPlatformFromUrl } from "@/lib/reading-platforms";

const TRANSLATED_CN_TAG = "translated-cn";

export function isTranslatedCnNovel(tags: string[]): boolean {
  return tags.some(
    (tag) => tag.toLowerCase().replace(/\s+/g, "-") === TRANSLATED_CN_TAG
  );
}

export function externalLinkLabel(url: string): string {
  const inferred = inferPlatformFromUrl(url);
  if (inferred) return inferred.label;

  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host;
  } catch {
    return "Read novel";
  }
}
