import { HOME_PATH, isDefaultHomePath } from "@/lib/home-view";

const DEFAULT_AFTER_LOGIN = HOME_PATH;
const ASSET_PATH = /\.[a-z0-9]{1,8}$/i;

/**
 * Keep post-login redirects on-site and away from static files
 * (e.g. leftover /moonie/waving.png callback URLs).
 */
export function safeAuthCallbackPath(
  raw: string | null | undefined,
  fallback = DEFAULT_AFTER_LOGIN
): string {
  if (!raw) return fallback;

  let path = raw.trim();
  try {
    if (/^https?:\/\//i.test(path)) {
      path = `${new URL(path).pathname}${new URL(path).search}`;
    }
  } catch {
    return fallback;
  }

  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (path.startsWith("/api/") || path.startsWith("/_next/")) return fallback;

  const pathname = path.split("?")[0] ?? path;
  if (ASSET_PATH.test(pathname)) return fallback;
  if (isDefaultHomePath(path)) return HOME_PATH;

  return path;
}
