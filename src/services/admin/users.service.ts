import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import type { AdminUserSummary } from "@/types/admin";

export async function countAdmins(): Promise<number> {
  return db.user.count({ where: { role: UserRole.ADMIN, isSuspended: false } });
}

export async function getAdminUsers(query?: string): Promise<AdminUserSummary[]> {
  const q = query?.trim();

  const users = await db.user.findMany({
    where: q
      ? {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { reviews: true, followers: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    isSuspended: user.isSuspended,
    reviewCount: user._count.reviews,
    followerCount: user._count.followers,
    createdAt: user.createdAt.toISOString(),
  }));
}

export async function getAdminUserById(
  userId: string
): Promise<AdminUserSummary | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      _count: { select: { reviews: true, followers: true } },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    isSuspended: user.isSuspended,
    reviewCount: user._count.reviews,
    followerCount: user._count.followers,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function promoteUserToAdmin(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: { role: UserRole.ADMIN },
  });
}

export async function demoteAdminToUser(userId: string): Promise<void> {
  const adminCount = await countAdmins();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) throw new Error("User not found.");
  if (user.role !== UserRole.ADMIN) return;

  if (adminCount <= 1) {
    throw new Error("Cannot demote the last active admin.");
  }

  await db.user.update({
    where: { id: userId },
    data: { role: UserRole.USER },
  });
}

export async function setUserSuspended(
  userId: string,
  suspended: boolean
): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) throw new Error("User not found.");

  if (suspended && user.role === UserRole.ADMIN) {
    const adminCount = await countAdmins();
    if (adminCount <= 1) {
      throw new Error("Cannot suspend the last active admin.");
    }
  }

  await db.user.update({
    where: { id: userId },
    data: { isSuspended: suspended },
  });
}

export async function deleteUserSafely(
  userId: string,
  actingAdminId: string
): Promise<void> {
  if (userId === actingAdminId) {
    throw new Error("You cannot delete your own account.");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { reviews: true } } },
  });

  if (!user) throw new Error("User not found.");

  if (user.role === UserRole.ADMIN) {
    const adminCount = await countAdmins();
    if (adminCount <= 1) {
      throw new Error("Cannot delete the last active admin.");
    }
  }

  if (user._count.reviews > 0) {
    throw new Error(
      "Cannot delete a user with reviews. Suspend the account instead."
    );
  }

  await db.user.delete({ where: { id: userId } });
}
