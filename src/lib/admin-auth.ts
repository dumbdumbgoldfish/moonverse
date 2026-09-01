import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export class AdminAccessDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAccessDeniedError";
  }
}

type ActiveAdminUser = {
  id: string;
  role: UserRole;
  isSuspended: boolean;
};

/**
 * Validates live database admin state. Session/JWT role alone is not sufficient —
 * a suspended or demoted admin may retain ADMIN in an old token until expiry.
 */
export function assertActiveAdminUser(
  user: Pick<ActiveAdminUser, "role" | "isSuspended"> | null | undefined
): void {
  if (!user) {
    throw new AdminAccessDeniedError("Your account is no longer available.");
  }
  if (user.isSuspended) {
    throw new AdminAccessDeniedError("Your account is suspended.");
  }
  if (user.role !== UserRole.ADMIN) {
    throw new AdminAccessDeniedError("Admin access required.");
  }
}

export async function getActiveAdminUserIdFromDb(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isSuspended: true },
  });
  assertActiveAdminUser(user);
  return user!.id;
}

export async function isActiveAdminUser(userId: string): Promise<boolean> {
  try {
    await getActiveAdminUserIdFromDb(userId);
    return true;
  } catch {
    return false;
  }
}

export async function requireAdminUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }
  return getActiveAdminUserIdFromDb(session.user.id);
}

export async function getAdminSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  try {
    await getActiveAdminUserIdFromDb(session.user.id);
    return session;
  } catch {
    return null;
  }
}

export function isAdminRole(role: UserRole | undefined): boolean {
  return role === UserRole.ADMIN;
}
