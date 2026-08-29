import { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import {
  buildCommentEmailTemplate,
  buildFollowEmailTemplate,
  buildReplyEmailTemplate,
} from "@/lib/email/templates/notification";
import { sendEmail } from "@/lib/email/send";
import { parseNotificationMetadata } from "@/lib/notifications/inbox";
import { getNotificationPreference } from "@/services/notification-preference.service";

export const TRANSACTIONAL_NOTIFICATION_EMAIL_TYPES = new Set<NotificationType>([
  NotificationType.NEW_FOLLOWER,
  NotificationType.COMMENT_ON_REVIEW,
  NotificationType.COMMENT_REPLY,
]);

export function isTransactionalNotificationEmailType(
  type: NotificationType
): boolean {
  return TRANSACTIONAL_NOTIFICATION_EMAIL_TYPES.has(type);
}

export interface SendTransactionalNotificationEmailInput {
  notificationId: string;
  userId: string;
  type: NotificationType;
  link: string;
  actorId?: string;
  metadata?: {
    actorDisplayName?: string;
    actorUsername?: string;
    reviewTitle?: string;
    novelTitle?: string;
    snippet?: string;
    commentId?: string;
    emailSentAt?: string;
  };
}

export async function sendTransactionalNotificationEmail(
  input: SendTransactionalNotificationEmailInput
): Promise<{ sent: boolean; skippedReason?: string }> {
  if (!isTransactionalNotificationEmailType(input.type)) {
    return { sent: false, skippedReason: "unsupported_type" };
  }

  if (input.actorId && input.actorId === input.userId) {
    return { sent: false, skippedReason: "self_action" };
  }

  const existing = await db.notification.findUnique({
    where: { id: input.notificationId },
    select: { metadata: true },
  });
  const existingMetadata = parseNotificationMetadata(existing?.metadata);
  if (existingMetadata?.emailSentAt) {
    return { sent: false, skippedReason: "already_sent" };
  }

  const [recipient, preference] = await Promise.all([
    db.user.findUnique({
      where: { id: input.userId },
      select: { email: true, displayName: true, isSuspended: true },
    }),
    getNotificationPreference(input.userId),
  ]);

  if (!recipient?.email || recipient.isSuspended) {
    return { sent: false, skippedReason: "no_recipient" };
  }

  if (!preference.emailEnabled) {
    return { sent: false, skippedReason: "email_disabled" };
  }

  const actorName = input.metadata?.actorDisplayName ?? "Someone";
  const actorUsername = input.metadata?.actorUsername;
  const templateInput = {
    recipientName: recipient.displayName,
    actorName,
    actorUsername,
    reviewTitle: input.metadata?.reviewTitle,
    novelTitle: input.metadata?.novelTitle,
    snippet: input.metadata?.snippet,
    path: input.link,
  };

  const template =
    input.type === NotificationType.NEW_FOLLOWER
      ? await buildFollowEmailTemplate(templateInput)
      : input.type === NotificationType.COMMENT_ON_REVIEW
        ? await buildCommentEmailTemplate(templateInput)
        : await buildReplyEmailTemplate(templateInput);

  const result = await sendEmail({
    to: recipient.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (!result.ok && !result.skipped) {
    console.error(
      `[email:notification] Failed to send ${input.type} email for notification ${input.notificationId}`
    );
    return { sent: false, skippedReason: "send_failed" };
  }

  if (result.skipped) {
    return { sent: false, skippedReason: "send_skipped" };
  }

  await db.notification.update({
    where: { id: input.notificationId },
    data: {
      metadata: {
        ...(input.metadata ?? {}),
        emailSentAt: new Date().toISOString(),
      },
    },
  });

  return { sent: true };
}
