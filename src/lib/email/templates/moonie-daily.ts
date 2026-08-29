import { appBaseUrl } from "@/lib/email/app-url";
import { renderEmailTemplate, strong, text } from "@/lib/email/templates/layout";

export async function buildMoonieDailyPickEmailTemplate(input: {
  displayName: string;
  novelTitle: string;
  reason: string;
  reviewId: string;
}): Promise<{ subject: string; html: string; text: string }> {
  const origin = await appBaseUrl();
  const link = `${origin}/reviews/${input.reviewId}`;

  const { html, text: plainText } = renderEmailTemplate({
    preheader: `Moonie's pick today: ${input.novelTitle}`,
    title: "Moonie's daily pick",
    greeting: `Hi ${input.displayName},`,
    bodyBlocks: [
      {
        kind: "paragraph",
        parts: [text("Today's pick: "), strong(input.novelTitle)],
      },
      { kind: "paragraph", parts: [text(input.reason)] },
    ],
    ctaLabel: "View today's pick",
    ctaUrl: link,
  });

  return {
    subject: `Moonie's daily pick: ${input.novelTitle}`,
    html,
    text: plainText,
  };
}
