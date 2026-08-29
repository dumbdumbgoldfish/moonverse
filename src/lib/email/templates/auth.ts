import { appBaseUrl } from "@/lib/email/app-url";
import {
  renderEmailTemplate,
  strong,
  text,
} from "@/lib/email/templates/layout";

export async function buildVerifyEmailTemplate(input: {
  displayName: string;
  token: string;
}): Promise<{ subject: string; html: string; text: string }> {
  const origin = await appBaseUrl();
  const link = `${origin}/verify-email?token=${encodeURIComponent(input.token)}`;
  const { html, text: plainText } = renderEmailTemplate({
    preheader: "Confirm your MoonVerse email address.",
    title: "Verify your email",
    greeting: `Hi ${input.displayName},`,
    bodyBlocks: [
      {
        kind: "paragraph",
        parts: [
          text(
            "Welcome to MoonVerse. Confirm your email to secure your account and keep your reviews, lists, and Moonie picks attached to you."
          ),
        ],
      },
      {
        kind: "paragraph",
        parts: [text("This link expires in "), strong("48 hours"), text(".")],
      },
    ],
    ctaLabel: "Verify email",
    ctaUrl: link,
    footerNote: "If you did not create a MoonVerse account, you can ignore this email.",
  });

  return {
    subject: "Verify your MoonVerse email",
    html,
    text: plainText,
  };
}

export async function buildResetPasswordTemplate(input: {
  displayName: string;
  token: string;
}): Promise<{ subject: string; html: string; text: string }> {
  const origin = await appBaseUrl();
  const link = `${origin}/reset-password?token=${encodeURIComponent(input.token)}`;
  const { html, text: plainText } = renderEmailTemplate({
    preheader: "Reset your MoonVerse password.",
    title: "Reset your password",
    greeting: `Hi ${input.displayName},`,
    bodyBlocks: [
      {
        kind: "paragraph",
        parts: [
          text("We received a request to reset the password for your MoonVerse account."),
        ],
      },
      {
        kind: "paragraph",
        parts: [
          text("This link expires in "),
          strong("1 hour"),
          text(" and can only be used once."),
        ],
      },
    ],
    ctaLabel: "Reset password",
    ctaUrl: link,
    footerNote: "If you did not request a password reset, you can safely ignore this email.",
  });

  return {
    subject: "Reset your MoonVerse password",
    html,
    text: plainText,
  };
}

export async function buildWelcomeEmailTemplate(input: {
  displayName: string;
}): Promise<{ subject: string; html: string; text: string }> {
  const origin = await appBaseUrl();
  const link = `${origin}/home`;
  const { html, text: plainText } = renderEmailTemplate({
    preheader: "Your MoonVerse desk is ready.",
    title: "Welcome to MoonVerse",
    greeting: `Hi ${input.displayName},`,
    bodyBlocks: [
      {
        kind: "paragraph",
        parts: [text("Your email is verified and your desk is open.")],
      },
      {
        kind: "paragraph",
        parts: [text("Here is what you can do next:")],
      },
      {
        kind: "list",
        items: [
          "Discover novels across genres and tags",
          "Read community reviews and write your own",
          "Save novels and reviews to reading lists",
          "Follow reviewers you trust",
          "Ask Moonie for grounded recommendations",
        ],
      },
    ],
    ctaLabel: "Explore MoonVerse",
    ctaUrl: link,
    footerNote: "Happy reading under the moon.",
  });

  return {
    subject: "Welcome to MoonVerse",
    html,
    text: plainText,
  };
}
