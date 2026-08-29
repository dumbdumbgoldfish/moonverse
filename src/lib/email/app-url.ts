export async function appBaseUrl(): Promise<string> {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "");

  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV !== "production") {
    try {
      const { headers } = await import("next/headers");
      const requestHeaders = await headers();
      const host =
        requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
      if (host) {
        const proto =
          requestHeaders.get("x-forwarded-proto") ||
          (host.includes("localhost") || host.startsWith("127.")
            ? "http"
            : "https");
        return `${proto}://${host}`.replace(/\/$/, "");
      }
    } catch {
      // headers() is unavailable outside a request (scripts, cron).
    }
  }

  return "http://localhost:3000";
}
