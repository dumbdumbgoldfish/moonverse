type AppBaseUrlOptions = {
  /** Full request URL from an API route (`request.url`). */
  requestUrl?: string;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, "");
}

function getConfiguredAppUrl(): string | undefined {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  return configured ? trimTrailingSlash(configured) : undefined;
}

function originFromRequestUrl(requestUrl?: string): string | undefined {
  if (!requestUrl) return undefined;
  try {
    return trimTrailingSlash(new URL(requestUrl).origin);
  } catch {
    return undefined;
  }
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local")
  );
}

function isLocalOrigin(origin: string): boolean {
  try {
    return isLocalHostname(new URL(origin).hostname);
  } catch {
    return false;
  }
}

/** True when AUTH_URL / NEXT_PUBLIC_APP_URL points at localhost or 127.x. */
function isLocalConfiguredUrl(url?: string): boolean {
  if (!url) return false;
  try {
    return isLocalHostname(new URL(url).hostname);
  } catch {
    return false;
  }
}

async function originFromHeaders(): Promise<string | undefined> {
  try {
    const { headers } = await import("next/headers");
    const requestHeaders = await headers();
    const host =
      requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
    if (!host) return undefined;
    const proto =
      requestHeaders.get("x-forwarded-proto") ||
      (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
    return trimTrailingSlash(`${proto}://${host}`);
  } catch {
    // headers() is unavailable outside a request (scripts, cron).
    return undefined;
  }
}

/**
 * Canonical origin for absolute links in outbound email.
 *
 * Real production (canonical non-local AUTH_URL): configured URL wins.
 * Local/dev/prod-verify (NODE_ENV production with localhost AUTH_URL, or
 * development): incoming request origin wins over stale localhost:3000 defaults.
 */
export async function appBaseUrl(options?: AppBaseUrlOptions): Promise<string> {
  const configured = getConfiguredAppUrl();
  const fromRequest = originFromRequestUrl(options?.requestUrl);
  const fromHeaders = await originFromHeaders();

  const preferRequestOrigin =
    process.env.NODE_ENV !== "production" ||
    isLocalConfiguredUrl(configured);

  if (preferRequestOrigin) {
    if (fromRequest) return fromRequest;
    if (fromHeaders) return fromHeaders;
    if (configured) return configured;
    return "http://localhost:3000";
  }

  if (configured) return configured;
  if (process.env.VERCEL_URL) {
    return trimTrailingSlash(`https://${process.env.VERCEL_URL}`);
  }
  if (fromHeaders && !isLocalOrigin(fromHeaders)) return fromHeaders;
  return "http://localhost:3000";
}
