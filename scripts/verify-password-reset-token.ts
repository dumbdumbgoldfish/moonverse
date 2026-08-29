/**
 * Verifies password reset tokens are single-use end-to-end.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/verify-password-reset-token.ts
 */
import bcrypt from "bcryptjs";
import { AuthTokenType, PrismaClient } from "@prisma/client";
import { GET, POST } from "../src/app/api/auth/reset-password/route";
import {
  claimAuthTokenInTransaction,
  hashToken,
  inspectAuthToken,
  issueAuthToken,
} from "../src/lib/auth-tokens";

const db = new PrismaClient();

const OLD_PASSWORD = "OldPassword123!";
const NEW_PASSWORD = "NewPassword456!";

async function resetPasswordViaApi(
  token: string,
  password: string
): Promise<{ ok: boolean; status: number; body: Record<string, unknown> }> {
  const res = await POST(
    new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    })
  );
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, body };
}

async function inspectTokenViaApi(
  token: string
): Promise<{ status: string; message: string | null }> {
  const res = await GET(
    new Request(
      `http://localhost/api/auth/reset-password?token=${encodeURIComponent(token)}`
    )
  );
  const body = (await res.json().catch(() => ({}))) as {
    status?: string;
    message?: string | null;
  };
  return {
    status: body.status ?? "invalid",
    message: body.message ?? null,
  };
}

async function main() {
  let passed = 0;

  function pass(label: string) {
    passed += 1;
    console.log(`✓ ${label}`);
  }

  function fail(label: string, detail: string): never {
    console.error(`✗ ${label}: ${detail}`);
    process.exit(1);
  }

  const user = await db.user.findFirst({
    where: { passwordHash: { not: null }, isSuspended: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true, passwordHash: true },
  });

  if (!user?.passwordHash) {
    fail("seed user", "need at least one credentials user with a password hash");
  }

  const oldHash = user.passwordHash;
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(OLD_PASSWORD, 12) },
  });

  const rawToken = await issueAuthToken(user.id, AuthTokenType.PASSWORD_RESET, 1);
  const tokenHash = hashToken(rawToken);

  const before = await db.authToken.findUnique({
    where: { tokenHash },
    select: { usedAt: true, expiresAt: true },
  });
  if (!before || before.usedAt) {
    fail("issued token", "expected unused reset token row");
  }
  pass("issued fresh reset token");

  const firstReset = await resetPasswordViaApi(rawToken, NEW_PASSWORD);
  if (!firstReset.ok) {
    fail("first reset via API", `status ${firstReset.status} body=${JSON.stringify(firstReset.body)}`);
  }
  pass("first reset via API succeeds");

  const afterUse = await db.authToken.findUnique({
    where: { tokenHash },
    select: { usedAt: true },
  });
  if (!afterUse?.usedAt) {
    fail("token invalidation", "expected usedAt to be set after successful reset");
  }
  pass("token record marked used after successful reset");

  const secondReset = await resetPasswordViaApi(rawToken, "AnotherPassword789!");
  if (secondReset.ok) {
    fail("second reset via API", "expected reuse to be rejected");
  }
  if (
    typeof secondReset.body.error !== "string" ||
    !secondReset.body.error.includes("already been used")
  ) {
    fail(
      "second reset via API",
      `expected already-used message, got ${JSON.stringify(secondReset.body)}`
    );
  }
  pass("second reset via API rejected with already-used message");

  const reopened = await inspectTokenViaApi(rawToken);
  if (reopened.status !== "used") {
    fail("reopened reset link", `expected status=used, got ${reopened.status}`);
  }
  if (!reopened.message?.includes("already been used")) {
    fail("reopened reset link", `expected used message, got ${reopened.message}`);
  }
  pass("reopened reset link rejected by GET validation");

  const directReuse = await db.$transaction(async (tx) => {
    return claimAuthTokenInTransaction(tx, rawToken, AuthTokenType.PASSWORD_RESET);
  });
  if (directReuse) {
    fail("direct token claim", "expected atomic claim to fail for used token");
  }
  pass("direct atomic claim rejected for used token");

  const updatedUser = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!updatedUser?.passwordHash) {
    fail("password hash", "missing updated password hash");
  }

  const oldWorks = await bcrypt.compare(OLD_PASSWORD, updatedUser.passwordHash);
  const newWorks = await bcrypt.compare(NEW_PASSWORD, updatedUser.passwordHash);
  if (oldWorks) {
    fail("old password", "old password should no longer work");
  }
  if (!newWorks) {
    fail("new password", "new password should work");
  }
  pass("old password rejected and new password accepted");

  const inspectStatus = await inspectAuthToken(rawToken, AuthTokenType.PASSWORD_RESET);
  if (inspectStatus !== "used") {
    fail("inspectAuthToken", `expected used, got ${inspectStatus}`);
  }
  pass("inspectAuthToken reports used status");

  const expiredToken = await issueAuthToken(user.id, AuthTokenType.PASSWORD_RESET, 1);
  const expiredHash = hashToken(expiredToken);
  await db.authToken.update({
    where: { tokenHash: expiredHash },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  });
  const expiredReset = await resetPasswordViaApi(expiredToken, "ExpiredPassword123!");
  if (expiredReset.ok) {
    fail("expired token reset", "expected expired token to be rejected");
  }
  if (
    typeof expiredReset.body.error !== "string" ||
    !expiredReset.body.error.includes("invalid or has expired")
  ) {
    fail(
      "expired token reset",
      `expected expired message, got ${JSON.stringify(expiredReset.body)}`
    );
  }
  pass("expired token rejected by API");

  const invalidReset = await resetPasswordViaApi("not-a-real-token", "InvalidPassword123!");
  if (invalidReset.ok) {
    fail("invalid token reset", "expected invalid token to be rejected");
  }
  pass("invalid token rejected by API");

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: oldHash },
  });
  await db.authToken.deleteMany({
    where: { userId: user.id, type: AuthTokenType.PASSWORD_RESET },
  });
  pass("restored test user password and cleaned up tokens");

  console.log(`\n${passed} checks passed. Password reset tokens are single-use.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
