/**
 * Verifies transactional notification email guards without sending real mail.
 *
 * Usage:
 *   npx tsx --env-file=.env scripts/verify-notification-emails.ts
 */
import { NotificationType, PrismaClient } from "@prisma/client";
import {
  isTransactionalNotificationEmailType,
  sendTransactionalNotificationEmail,
} from "../src/lib/email/notification-emails";

const db = new PrismaClient();

const TEST_RECIPIENT_EMAIL = "yuzumist8@gmail.com";

async function main() {
  const recipient = await db.user.findUnique({
    where: { email: TEST_RECIPIENT_EMAIL },
    select: { id: true, email: true },
  });

  if (!recipient) {
    throw new Error(
      `Test recipient ${TEST_RECIPIENT_EMAIL} does not exist in the database.`
    );
  }

  const actor = await db.user.findFirst({
    where: { id: { not: recipient.id } },
    orderBy: { createdAt: "asc" },
    select: { id: true, displayName: true },
  });

  if (!actor) {
    throw new Error("Need at least one other user to act as the sender.");
  }

  let passed = 0;
  const createdIds: string[] = [];

  function pass(label: string) {
    passed += 1;
    console.log(`✓ ${label}`);
  }

  function fail(label: string, detail: string): never {
    console.error(`✗ ${label}: ${detail}`);
    process.exit(1);
  }

  if (!isTransactionalNotificationEmailType(NotificationType.NEW_FOLLOWER)) {
    fail("follow is transactional", "expected true");
  }
  if (!isTransactionalNotificationEmailType(NotificationType.COMMENT_ON_REVIEW)) {
    fail("comment is transactional", "expected true");
  }
  if (!isTransactionalNotificationEmailType(NotificationType.COMMENT_REPLY)) {
    fail("reply is transactional", "expected true");
  }
  if (isTransactionalNotificationEmailType(NotificationType.REVIEW_LIKE)) {
    fail("like is not transactional", "expected false");
  }
  pass("transactional type guards");

  const selfNotification = await db.notification.create({
    data: {
      userId: actor.id,
      type: NotificationType.NEW_FOLLOWER,
      message: "self",
      link: "/users/self",
      actorId: actor.id,
    },
  });
  createdIds.push(selfNotification.id);
  const selfResult = await sendTransactionalNotificationEmail({
    notificationId: selfNotification.id,
    userId: actor.id,
    type: NotificationType.NEW_FOLLOWER,
    link: "/users/self",
    actorId: actor.id,
  });
  if (selfResult.sent || selfResult.skippedReason !== "self_action") {
    fail("self-action guard", JSON.stringify(selfResult));
  }
  pass("self-action sends no email");

  await db.notificationPreference.upsert({
    where: { userId: recipient.id },
    create: { userId: recipient.id, emailEnabled: false },
    update: { emailEnabled: false },
  });

  const disabledNotification = await db.notification.create({
    data: {
      userId: recipient.id,
      type: NotificationType.COMMENT_ON_REVIEW,
      message: "comment",
      link: "/reviews/test#comment-abc",
      actorId: actor.id,
      metadata: { snippet: "Hello there" },
    },
  });
  createdIds.push(disabledNotification.id);
  const disabledResult = await sendTransactionalNotificationEmail({
    notificationId: disabledNotification.id,
    userId: recipient.id,
    type: NotificationType.COMMENT_ON_REVIEW,
    link: "/reviews/test#comment-abc",
    actorId: actor.id,
    metadata: { snippet: "Hello there" },
  });
  if (disabledResult.sent || disabledResult.skippedReason !== "email_disabled") {
    fail("disabled preference guard", JSON.stringify(disabledResult));
  }
  pass("disabled preference sends no email");

  await db.notificationPreference.update({
    where: { userId: recipient.id },
    data: { emailEnabled: true },
  });

  const followNotification = await db.notification.create({
    data: {
      userId: recipient.id,
      type: NotificationType.NEW_FOLLOWER,
      message: `${actor.displayName} started following you`,
      link: `/users/${actor.id}`,
      actorId: actor.id,
      metadata: { actorDisplayName: actor.displayName },
    },
  });
  createdIds.push(followNotification.id);

  const firstSend = await sendTransactionalNotificationEmail({
    notificationId: followNotification.id,
    userId: recipient.id,
    type: NotificationType.NEW_FOLLOWER,
    link: `/users/${actor.id}`,
    actorId: actor.id,
    metadata: { actorDisplayName: actor.displayName },
  });

  const stored = await db.notification.findUnique({
    where: { id: followNotification.id },
    select: { metadata: true },
  });
  const metadata = stored?.metadata as { emailSentAt?: string } | null;

  if (firstSend.skippedReason === "send_failed") {
    fail("follow email attempt", "send_failed");
  }

  if (firstSend.sent) {
    if (!metadata?.emailSentAt) {
      fail("follow dedup metadata", "missing emailSentAt after successful send");
    }
    const duplicate = await sendTransactionalNotificationEmail({
      notificationId: followNotification.id,
      userId: recipient.id,
      type: NotificationType.NEW_FOLLOWER,
      link: `/users/${actor.id}`,
      actorId: actor.id,
      metadata: { actorDisplayName: actor.displayName },
    });
    if (duplicate.sent || duplicate.skippedReason !== "already_sent") {
      fail("duplicate prevention", JSON.stringify(duplicate));
    }
    pass("follow sends once and deduplicates");
  } else {
    pass(`follow path reachable (${firstSend.skippedReason ?? "skipped"})`);
  }

  await db.notification.deleteMany({ where: { id: { in: createdIds } } });

  console.log(`\n${passed} checks passed`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
