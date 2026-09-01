/**
 * Build a login redirect that preserves the incoming request origin (host + port).
 * Use `request.url` as the base — not `request.nextUrl.origin`, which can reflect
 * AUTH_URL / NEXTAUTH_URL instead of the port the browser is actually using.
 */
export function buildLoginRedirectUrl(
  requestUrl: string,
  callbackPath: string
): URL {
  const loginUrl = new URL("/login", requestUrl);
  loginUrl.search = "";
  loginUrl.searchParams.set("callbackUrl", callbackPath);
  return loginUrl;
}
