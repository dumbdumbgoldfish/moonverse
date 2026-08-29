/** Keep NextAuth JWT cookies small — never embed base64 image data in session tokens. */

const INLINE_IMAGE_DATA_URL_RE =
  /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/i;

export function isInlineSessionImage(value: string): boolean {
  return INLINE_IMAGE_DATA_URL_RE.test(value.trim());
}

export function userAvatarApiPath(userId: string): string {
  return `/api/users/${userId}/avatar`;
}

/** Root-relative static asset under /public (e.g. /demo/avatars/foo.png). */
export function isLocalPublicAssetPath(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith("/") && !trimmed.startsWith("//");
}

/**
 * Resolve a stored avatar for display or JWT session cookies.
 * Local public assets are returned as-is; remote/inline values use the avatar API.
 */
export function resolveSessionImageUrl(
  image: string | null | undefined,
  userId: string,
): string | null {
  if (!image?.trim() || !userId) return null;
  const trimmed = image.trim();
  if (isLocalPublicAssetPath(trimmed)) {
    return trimmed;
  }
  return userAvatarApiPath(userId);
}

export function parseInlineImageDataUrl(
  dataUrl: string,
): { mime: string; buffer: Buffer } | null {
  const trimmed = dataUrl.trim();
  const match = trimmed.match(
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/i,
  );
  if (!match?.[1] || !match[2]) return null;
  return {
    mime: match[1].toLowerCase(),
    buffer: Buffer.from(match[2], "base64"),
  };
}
