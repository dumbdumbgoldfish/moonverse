import { DigestCadence } from "@prisma/client";
import { appBaseUrl } from "@/lib/email/app-url";
import { renderEmailTemplate, text } from "@/lib/email/templates/layout";

export async function buildDigestEmailTemplate(input: {
  displayName: string;
  cadence: DigestCadence;
  unreadCount: number;
}): Promise<{ subject: string; html: string; text: string }> {
  const origin = await appBaseUrl();
  const link = `${origin}/notifications`;
  const period = input.cadence === "DAILY" ? "day" : "week";
  const cadenceLabel = input.cadence === "DAILY" ? "daily" : "weekly";
  const message = `You have ${input.unreadCount} new notification${input.unreadCount === 1 ? "" : "s"} on MoonVerse this ${period}.`;

  const { html, text: plainText } = renderEmailTemplate({
    preheader: message,
    title: `Your ${cadenceLabel} digest`,
    greeting: `Hi ${input.displayName},`,
    bodyBlocks: [{ kind: "paragraph", parts: [text(message)] }],
    ctaLabel: "View notifications",
    ctaUrl: link,
  });

  return {
    subject: `Your MoonVerse ${cadenceLabel} digest`,
    html,
    text: plainText,
  };
}
