/**
 * Shared primary-nav route matching for Navbar and MobileBottomNav.
 * Keeps aria-current (active) separate from in-flight navigation (pending).
 */

export function normalizeNavPathname(pathname: string): string {
  const base = pathname.split("?")[0]?.trim() || "/";
  return base.startsWith("/") ? base : `/${base}`;
}

export function isCommunityNavActive(pathname: string): boolean {
  const p = normalizeNavPathname(pathname);
  return p === "/community" || p.startsWith("/community/");
}

export function isDiscoverNavActive(pathname: string): boolean {
  const p = normalizeNavPathname(pathname);
  return (
    p === "/discover" ||
    p === "/reviews" ||
    (p.startsWith("/reviews/") && p !== "/reviews/new")
  );
}

export function isBrowseNavActive(pathname: string): boolean {
  return normalizeNavPathname(pathname).startsWith("/browse");
}

export function isMoonieNavActive(pathname: string): boolean {
  const p = normalizeNavPathname(pathname);
  return (
    p === "/moonie" ||
    p.startsWith("/moonie/") ||
    p === "/ask-moonie" ||
    p.startsWith("/ask-moonie/")
  );
}

export function isWriteNavActive(pathname: string): boolean {
  const p = normalizeNavPathname(pathname);
  return (
    p === "/write" ||
    p.startsWith("/reviews/new") ||
    p.startsWith("/my-reviews") ||
    /^\/reviews\/[^/]+\/edit$/.test(p)
  );
}

export function isSearchNavActive(pathname: string): boolean {
  const p = normalizeNavPathname(pathname);
  return p === "/search" || p.startsWith("/search/");
}

export function isHomeNavActive(pathname: string): boolean {
  const p = normalizeNavPathname(pathname);
  return p === "/" || p.startsWith("/home");
}

/** Settled on a top-level app destination (not a novel/review detail outside nav). */
export function isPrimaryNavDestination(pathname: string): boolean {
  const p = normalizeNavPathname(pathname);
  return (
    isCommunityNavActive(p) ||
    isDiscoverNavActive(p) ||
    isBrowseNavActive(p) ||
    isMoonieNavActive(p) ||
    isWriteNavActive(p) ||
    isSearchNavActive(p) ||
    isHomeNavActive(p)
  );
}

/**
 * Pending navigation feedback — not active page state.
 * Clears when the target route is reached or another primary nav route wins.
 */
export function isNavPending(
  pathname: string,
  pendingHref: string | null,
  targetHref: string
): boolean {
  if (!pendingHref || pendingHref !== targetHref) return false;

  const current = normalizeNavPathname(pathname);
  const target = normalizeNavPathname(targetHref);

  if (current === target || current.startsWith(`${target}/`)) return false;

  // Landed on Moonie (or another non-nav-target route) — do not keep primary-nav pending.
  if (isMoonieNavActive(current) && !isMoonieNavActive(target)) {
    return false;
  }

  return true;
}
