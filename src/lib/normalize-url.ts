/**
 * Normalize reading-source URLs for duplicate detection.
 * - lowercase hostname
 * - strip fragments
 * - remove common tracking / affiliate params
 * - remove unnecessary trailing slash
 * - preserve meaningful path and query params (regional storefronts stay distinct)
 */

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "ref",
  "ref_",
  "referrer",
  "affiliate",
  "aff",
  "tag",
  "ascsubtag",
  "source",
  "si",
]);

export function normalizeReadingUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  parsed.hash = "";
  parsed.hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();

  const kept = new URLSearchParams();
  parsed.searchParams.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (TRACKING_PARAMS.has(lower)) return;
    if (lower.startsWith("utm_")) return;
    kept.append(key, value);
  });

  const query = kept.toString();
  let path = parsed.pathname.replace(/\/+$/, "") || "";
  // Keep root as empty path so host-only URLs normalize cleanly
  if (path === "/") path = "";

  return `${parsed.protocol}//${parsed.hostname}${path}${query ? `?${query}` : ""}`;
}
