import { appBaseUrl } from "@/lib/email/app-url";
import {
  renderEmailTemplate,
  strong,
  text,
} from "@/lib/email/templates/layout";

type NotificationEmailKind = "follow" | "comment" | "reply";

interface NotificationEmailInput {
  recipientName: string;
  actorName: string;
  actorUsername?: string;
  reviewTitle?: string;
  novelTitle?: string;
  snippet?: string;
  path: string;
}

function buildEmailLink(origin: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${normalizedPath}`;
}

async function buildNotificationEmail(
  kind: NotificationEmailKind,
  input: NotificationEmailInput
): Promise<{ subject: string; html: string; text: string }> {
  const origin = await appBaseUrl();
  const link = buildEmailLink(origin, input.path);
  const actor = input.actorUsername
    ? `${input.actorName} (@${input.actorUsername})`
    : input.actorName;

  const titles: Record<NotificationEmailKind, string> = {
    follow: "You have a new follower",
    comment: "New comment on your review",
    reply: "New reply to your comment",
  };

  const subjects: Record<NotificationEmailKind, string> = {
    follow: `${input.actorName} started following you on MoonVerse`,
    comment: `${input.actorName} commented on your review`,
    reply: `${input.actorName} replied to your comment`,
  };

  const introParts =
    kind === "follow"
      ? [strong(actor), text(" started following you.")]
      : kind === "comment"
        ? [
            strong(actor),
            text(
              ` commented on your review${input.reviewTitle ? ` "${input.reviewTitle}"` : ""}.`
            ),
          ]
        : [
            strong(actor),
            text(
              ` replied to your comment${input.reviewTitle ? ` on "${input.reviewTitle}"` : ""}.`
            ),
          ];

  const bodyBlocks = [
    { kind: "paragraph" as const, parts: introParts },
    ...(input.novelTitle
      ? [
          {
            kind: "paragraph" as const,
            parts: [text("Novel: "), strong(input.novelTitle)],
          },
        ]
      : []),
    ...(input.snippet ? [{ kind: "quote" as const, text: input.snippet }] : []),
  ];

  const { html, text: plainText } = renderEmailTemplate({
    preheader: subjects[kind],
    title: titles[kind],
    greeting: `Hi ${input.recipientName},`,
    bodyBlocks,
    ctaLabel: kind === "follow" ? "View profile" : "View conversation",
    ctaUrl: link,
    footerNote:
      "You can turn off email notifications in your MoonVerse notification preferences.",
  });

  return { subject: subjects[kind], html, text: plainText };
}

export async function buildFollowEmailTemplate(
  input: NotificationEmailInput
): Promise<{ subject: string; html: string; text: string }> {
  return buildNotificationEmail("follow", input);
}

export async function buildCommentEmailTemplate(
  input: NotificationEmailInput
): Promise<{ subject: string; html: string; text: string }> {
  return buildNotificationEmail("comment", input);
}

export async function buildReplyEmailTemplate(
  input: NotificationEmailInput
): Promise<{ subject: string; html: string; text: string }> {
  return buildNotificationEmail("reply", input);
}
