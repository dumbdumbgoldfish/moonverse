import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import type { NextRequest } from "next/server";

const protectedMatchers = [
  /^\/reviews\/new$/,
  /^\/reviews\/[^/]+\/edit$/,
  /^\/folders(\/.*)?$/,
  /^\/settings(\/.*)?$/,
  /^\/notifications(\/.*)?$/,
  /^\/admin(\/.*)?$/,
];

/** Public files (e.g. /moonie/happy.png) must never hit the auth gate. */
const PUBLIC_ASSET_EXT =
  /\.(?:png|jpe?g|gif|webp|avif|svg|ico|css|js|map|txt|woff2?|ttf|otf)$/i;

function isProtectedPath(pathname: string): boolean {
  if (PUBLIC_ASSET_EXT.test(pathname)) return false;
  return protectedMatchers.some((pattern) => pattern.test(pathname));
}

type AuthRequest = NextRequest & { auth: Session | null };

export default auth((req: AuthRequest) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (isProtectedPath(pathname) && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/reviews/new",
    "/reviews/:id/edit",
    "/folders",
    "/folders/:path*",
    "/settings",
    "/settings/:path*",
    "/notifications",
    "/notifications/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
