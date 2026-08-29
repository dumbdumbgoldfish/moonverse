export type HomeView = "home" | "community";
export type ReaderSection = "for-you" | "community";

export const HOME_PATH = "/home";
export const DISCOVER_PATH = "/discover";
export const COMMUNITY_PATH = "/community";

/**
 * `/home` is Home. Community is its own route.
 * Legacy `view=discover` / `view=for-you` still resolve to Home.
 */
export function parseHomeView(value: string | undefined | null): HomeView {
  if (value === "community") return "community";
  return "home";
}

export function parseReaderSection(
  _pathname: string,
  view: HomeView
): ReaderSection {
  return view === "community" ? "community" : "for-you";
}

export function homeHref(view: HomeView, feed?: string): string {
  if (view === "community") {
    const tab = feed ?? "for-you";
    return `${COMMUNITY_PATH}?feed=${encodeURIComponent(tab)}`;
  }
  return HOME_PATH;
}

/** True for `/home` and leftover Home aliases that should not look like Discover. */
export function isDefaultHomePath(path: string | null | undefined): boolean {
  if (!path) return true;

  const [pathname, query = ""] = path.split("?");
  if (pathname !== "/home") return false;

  const view = new URLSearchParams(query).get("view");
  return !view || view === "home" || view === "discover" || view === "for-you";
}
