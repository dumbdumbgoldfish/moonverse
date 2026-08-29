import { createHash, randomBytes } from "crypto";
import { AuthTokenType, type Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function createRawToken(): string {
  return randomBytes(32).toString("hex");
}

export type AuthTokenStatus = "valid" | "used" | "expired" | "invalid";

export function passwordResetStatusMessage(status: AuthTokenStatus): string {
  if (status === "used") {
    return "This reset link has already been used.";
  }
  return "This reset link is invalid or has expired.";
}

export async function inspectAuthToken(
  raw: string,
  type: AuthTokenType
): Promise<AuthTokenStatus> {
  const trimmed = raw.trim();
  if (!trimmed) return "invalid";

  const row = await db.authToken.findUnique({
    where: { tokenHash: hashToken(trimmed) },
    select: { type: true, usedAt: true, expiresAt: true },
  });

  if (!row || row.type !== type) return "invalid";
  if (row.usedAt) return "used";
  if (row.expiresAt < new Date()) return "expired";
  return "valid";
}

/** Atomically marks a token as used. Returns null if the token is missing, expired, or already used. */
export async function claimAuthTokenInTransaction(
  tx: Prisma.TransactionClient,
  raw: string,
  type: AuthTokenType
): Promise<{ userId: string } | null> {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const tokenHash = hashToken(trimmed);
  const now = new Date();
  const claimed = await tx.authToken.updateMany({
    where: {
      tokenHash,
      type,
      usedAt: null,
      expiresAt: { gt: now },
    },
    data: { usedAt: now },
  });

  if (claimed.count !== 1) return null;

  const row = await tx.authToken.findUnique({
    where: { tokenHash },
    select: { userId: true },
  });

  return row ? { userId: row.userId } : null;
}

export async function issueAuthToken(
  userId: string,
  type: AuthTokenType,
  ttlHours = 24
): Promise<string> {
  const raw = createRawToken();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  await db.authToken.deleteMany({ where: { userId, type, usedAt: null } });
  await db.authToken.create({
    data: { userId, type, tokenHash, expiresAt },
  });

  return raw;
}

export async function consumeAuthToken(
  raw: string,
  type: AuthTokenType
): Promise<{ userId: string } | null> {
  const tokenHash = hashToken(raw);
  const row = await db.authToken.findUnique({ where: { tokenHash } });
  if (!row || row.type !== type || row.usedAt || row.expiresAt < new Date()) {
    return null;
  }
  await db.authToken.update({
    where: { id: row.id },
    data: { usedAt: new Date() },
  });
  return { userId: row.userId };
}

