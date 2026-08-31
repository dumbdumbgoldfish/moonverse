export { getInitials } from "@/lib/initials";
export const DEFAULT_COVER_URL = "";

/** True when there is no usable cover image (missing or old picsum placeholder). */
export function isMissingCoverUrl(coverUrl: string | null | undefined): boolean {
  if (!coverUrl) return true;
  return coverUrl.includes("picsum.photos");
}

export function excerpt(text: string, maxLength = 150): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}


/** Guest-visible review text cap — full body requires authentication. */
export function guestReviewPreviewBody(
  body: string,
  excerptText?: string | null,
  maxLength = 420
): string {
  const source = (excerptText?.trim() || body).trim();
  if (source.length <= maxLength) return source;
  return `${source.slice(0, maxLength).trimEnd()}…`;
}

/**
 * Resolve a cover URL for display.
 * Never invents fake picsum images. returns "" when missing so UI can show a brand fallback.
 */
export function resolveCoverUrl(coverUrl: string | null | undefined): string {
  if (isMissingCoverUrl(coverUrl)) return DEFAULT_COVER_URL;
  return coverUrl as string;
}

/** First non-missing cover URL for Moonie cards (catalogue field, lookup candidate, etc.). */
export function moonieDisplayCoverUrl(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const url of candidates) {
    if (!isMissingCoverUrl(url)) {
      return url as string;
    }
  }
  return null;
}
const NATIVE_IMG_COVER_HOSTS = new Set([
  "www.royalroadcdn.com",
  "royalroadcdn.com",
]);

/** Hosts allowed by next.config.ts `images.remotePatterns`. */
const NEXT_IMAGE_COVER_HOSTS = new Set([
  "covers.openlibrary.org",
  "cdn.wuxiaworld.com",
  "upload.wikimedia.org",
  "www.royalroadcdn.com",
  "royalroadcdn.com",
  "api.dicebear.com",
]);

/** True when next/image can load this src without a config error. */
export function canUseNextImageCover(src: string): boolean {
  if (src.startsWith("/")) return true;
  try {
    const url = new URL(src);
    if (url.protocol !== "https:") return false;
    if (NATIVE_IMG_COVER_HOSTS.has(url.hostname)) return false;
    return NEXT_IMAGE_COVER_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

/** Smaller remote cover URLs for shelf thumbnails and cards. */
export function optimizeCoverThumbnailUrl(
  src: string | null | undefined,
  maxWidth = 200
): string | null | undefined {
  if (!src || isMissingCoverUrl(src)) return src;
  try {
    const url = new URL(src);
    if (url.hostname === "covers.openlibrary.org") {
      const size = maxWidth <= 120 ? "S" : maxWidth <= 220 ? "M" : "L";
      url.pathname = url.pathname.replace(/-[SML]\.jpg$/i, `-${size}.jpg`);
      if (!/-[SML]\.jpg$/i.test(url.pathname)) {
        url.pathname = `${url.pathname.replace(/\.jpg$/i, "")}-${size}.jpg`;
      }
      return url.toString();
    }
    if (url.hostname === "upload.wikimedia.org" && maxWidth <= 220) {
      url.searchParams.set("width", String(maxWidth));
      return url.toString();
    }
  } catch {
    /* keep original */
  }
  return src;
}

/** Skip Next's optimizer for hosts that time out (Open Library 504s). */
export function shouldSkipCoverOptimizer(src: string): boolean {
  try {
    const host = new URL(src).hostname;
    return (
      host === "covers.openlibrary.org" ||
      host === "upload.wikimedia.org" ||
      NATIVE_IMG_COVER_HOSTS.has(host)
    );
  } catch {
    return false;
  }
}
