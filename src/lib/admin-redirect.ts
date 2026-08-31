import { UserRole } from "@prisma/client";

export const ADMIN_HOME_PATH = "/admin";
export const ADMIN_PUBLIC_SITE_PATH = "/?public=1";

export function isAdminRole(role: string | undefined | null): boolean {
  return role === UserRole.ADMIN;
}

/** Where an administrator should land after auth when no explicit callback is set. */
export function defaultPathForRole(role: string | undefined | null): string {
  return isAdminRole(role) ? ADMIN_HOME_PATH : "/home";
}

export function shouldRenderPublicLanding(searchParams: {
  public?: string | string[];
}): boolean {
  return searchParams.public === "1";
}
