/**
 * Verifies email verification tokens behave securely end-to-end.
 *
 * Simulates forwarding a verification email: the API receives only the token
 * (no recipient email), and must verify the issuing account without changing
 * its email or creating a session.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/verify-email-token.ts
 */
import bcrypt from "bcryptjs";
import { AuthTokenType, PrismaClient } from "@prisma/client";
import { POST } from "../src/app/api/auth/verify-email/route";
import { hashToken, inspectAuthToken, issueAuthToken } from "../src/lib/auth-tokens";

const db = new PrismaClient();

const TEST_PASSWORD = "VerifyEmailTest123!";

async function verifyEmailViaApi(
  token: string,
  extraBody: Record<string, unknown> = {}
): Promise<{
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
  setCookie: string | null;
}> {
  const res = await POST(
    new Request("http://localhost/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...extraBody }),
    })
  );
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return {
    ok: res.ok,
    status: res.status,
    body,
    setCookie: res.headers.get("set-cookie"),
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

  const suffix = Date.now().toString(36);
  const emailA = `verify-a-${suffix}@example.com`;
  const emailB = `verify-b-${suffix}@example.com`;
  const username = `verify_${suffix}`;

  const user = await db.user.create({
    data: {
      username,
      displayName: "Verify Test User",
      email: emailA,
      passwordHash: await bcrypt.hash(TEST_PASSWORD, 12),
      emailVerified: null,
      notificationPreference: { create: {} },
    },
    select: { id: true, email: true },
  });
  pass("created Account A with emailA (unverified)");

  const rawToken = await issueAuthToken(user.id, AuthTokenType.EMAIL_VERIFY, 48);
  const tokenHash = hashToken(rawToken);
  pass("issued EMAIL_VERIFY token tied to Account A userId");

  const before = await db.authToken.findUnique({
    where: { tokenHash },
    select: { userId: true, usedAt: true, expiresAt: true },
  });
  if (!before || before.usedAt || before.userId !== user.id) {
    fail("issued token", "expected unused verify token for Account A");
  }
  pass("token row references Account A and is unused");

  // Simulate opening the forwarded link from Email B: only the bearer token is sent.
  const firstVerify = await verifyEmailViaApi(rawToken);
  if (!firstVerify.ok) {
    fail(
      "forwarded-link verify",
      `status ${firstVerify.status} body=${JSON.stringify(firstVerify.body)}`
    );
  }
  if (firstVerify.setCookie) {
    fail("forwarded-link verify", `unexpected Set-Cookie header: ${firstVerify.setCookie}`);
  }
  pass("forwarded verification link succeeds without creating a session");

  const afterVerify = await db.user.findUnique({
    where: { id: user.id },
    select: { email: true, emailVerified: true },
  });
  if (!afterVerify?.emailVerified) {
    fail("Account A verified", "expected emailVerified to be set");
  }
  if (afterVerify.email !== emailA) {
    fail(
      "Account A email unchanged",
      `expected ${emailA}, got ${afterVerify.email}`
    );
  }
  pass("Account A is verified and still uses emailA (not emailB)");

  const emailBUser = await db.user.findUnique({ where: { email: emailB } });
  if (emailBUser) {
    fail("emailB account", "emailB must not exist unless separately registered");
  }
  pass("no account exists for emailB");

  const loginAsB = await db.user.findFirst({
    where: { OR: [{ email: emailB }, { username: emailB }] },
  });
  if (loginAsB) {
    fail("credentials lookup for emailB", "emailB must not resolve to any account");
  }
  pass("credentials lookup for emailB finds no user");

  const maliciousBodyVerify = await verifyEmailViaApi(rawToken, { email: emailB });
  if (maliciousBodyVerify.ok) {
    fail("reused token with emailB in body", "expected reuse to be rejected");
  }
  const stillEmailA = await db.user.findUnique({
    where: { id: user.id },
    select: { email: true },
  });
  if (stillEmailA?.email !== emailA) {
    fail("email after malicious body", `email must remain ${emailA}`);
  }
  pass("reused token rejected; spurious email field in body does not change Account A");

  const afterUse = await db.authToken.findUnique({
    where: { tokenHash },
    select: { usedAt: true },
  });
  if (!afterUse?.usedAt) {
    fail("token invalidation", "expected usedAt after successful verify");
  }
  pass("token record marked used after successful verify");

  const inspectStatus = await inspectAuthToken(rawToken, AuthTokenType.EMAIL_VERIFY);
  if (inspectStatus !== "used") {
    fail("inspectAuthToken", `expected used, got ${inspectStatus}`);
  }
  pass("inspectAuthToken reports used status");

  const expiredToken = await issueAuthToken(user.id, AuthTokenType.EMAIL_VERIFY, 48);
  const expiredHash = hashToken(expiredToken);
  await db.authToken.update({
    where: { tokenHash: expiredHash },
    data: { expiresAt: new Date(Date.now() - 60_000) },
  });
  const expiredVerify = await verifyEmailViaApi(expiredToken);
  if (expiredVerify.ok) {
    fail("expired token verify", "expected expired token to be rejected");
  }
  if (
    typeof expiredVerify.body.error !== "string" ||
    !expiredVerify.body.error.includes("invalid or has expired")
  ) {
    fail(
      "expired token verify",
      `expected expired message, got ${JSON.stringify(expiredVerify.body)}`
    );
  }
  pass("expired token rejected by API");

  const invalidVerify = await verifyEmailViaApi("not-a-real-token");
  if (invalidVerify.ok) {
    fail("invalid token verify", "expected invalid token to be rejected");
  }
  pass("invalid token rejected by API");

  await db.authToken.deleteMany({ where: { userId: user.id } });
  await db.notificationPreference.deleteMany({ where: { userId: user.id } });
  await db.user.delete({ where: { id: user.id } });
  pass("cleaned up test user and tokens");

  console.log(
    `\n${passed} checks passed. Forwarded verification links verify the issuing account only; email is not reassigned and no session is created.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
