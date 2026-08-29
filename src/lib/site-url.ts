/**
 * Canonical origin for metadata, OG images, and absolute URLs.
 * Uses AUTH_URL in production; falls back to Vercel / localhost.
 */
export function getSiteOrigin(): string {
  const configured =
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (configured) return configured;

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export function getMetadataBase(): URL {
  try {
    return new URL(getSiteOrigin());
  } catch {
    return new URL("http://localhost:3000");
  }
}
