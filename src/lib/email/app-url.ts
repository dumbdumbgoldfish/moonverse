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
 * Production: configured canonical URL (AUTH_URL / NEXT_PUBLIC_APP_URL) wins.
 * Local/dev: incoming request origin wins over AUTH_URL so QA ports (3001–3003)
 * do not inherit a stale localhost:3000 default.
 */
export async function appBaseUrl(options?: AppBaseUrlOptions): Promise<string> {
  const configured = getConfiguredAppUrl();

  if (process.env.NODE_ENV === "production") {
    if (configured) return configured;
    if (process.env.VERCEL_URL) {
      return trimTrailingSlash(`https://${process.env.VERCEL_URL}`);
    }
    const fromHeaders = await originFromHeaders();
    if (fromHeaders) return fromHeaders;
    return "http://localhost:3000";
  }

  const fromRequest = originFromRequestUrl(options?.requestUrl);
  if (fromRequest) return fromRequest;

  const fromHeaders = await originFromHeaders();
  if (fromHeaders) return fromHeaders;

  if (configured) return configured;
  return "http://localhost:3000";
}
