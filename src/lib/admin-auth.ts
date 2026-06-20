import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";

export async function requireAdminUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }
  if (session?.user?.role !== UserRole.ADMIN) {
    throw new Error("Admin access required.");
  }
  return session.user.id;
}

export async function getAdminSession() {
  const session = await auth();
  if (!session?.user?.id || session?.user?.role !== UserRole.ADMIN) {
    return null;
  }
  return session;
}

export function isAdminRole(role: UserRole | undefined): boolean {
  return role === UserRole.ADMIN;
}
