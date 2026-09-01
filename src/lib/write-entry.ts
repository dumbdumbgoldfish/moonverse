/** Authenticated review composer entry (protected by page auth). */
export function buildAuthenticatedWriteReviewHref(novelId?: string): string {
  if (!novelId) return "/reviews/new";
  return `/reviews/new?novelId=${encodeURIComponent(novelId)}`;
}

/** Guest write gate; `/write` handles sign-up / log-in before composing. */
export function buildGuestWriteReviewHref(novelId?: string): string {
  if (!novelId) return "/write";
  return `/write?novelId=${encodeURIComponent(novelId)}`;
}

export function buildWriteReviewHref(options: {
  novelId?: string;
  isLoggedIn: boolean;
}): string {
  return options.isLoggedIn
    ? buildAuthenticatedWriteReviewHref(options.novelId)
    : buildGuestWriteReviewHref(options.novelId);
}
