/** Locally bundled MoonVerse placeholder when no official cover is available. */
export const MOONVERSE_MISSING_COVER_SRC = "/images/default-book-cover.jpg";

export function isMoonversePlaceholderCover(
  src: string | null | undefined
): boolean {
  if (!src) return false;
  return (
    src === MOONVERSE_MISSING_COVER_SRC ||
    src.endsWith("/images/default-book-cover.jpg")
  );
}

export function moonversePlaceholderAriaLabel(
  title: string,
  author?: string | null
): string {
  const work = author?.trim()
    ? `${title.trim()} by ${author.trim()}`
    : title.trim() || "this title";
  return `Placeholder cover artwork for ${work}. Official cover not available on MoonVerse.`;
}
