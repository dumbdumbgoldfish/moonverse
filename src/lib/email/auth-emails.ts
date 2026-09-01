import { AuthTokenType } from "@prisma/client";
import { issueAuthToken } from "@/lib/auth-tokens";
import {
  buildResetPasswordTemplate,
  buildVerifyEmailTemplate,
  buildWelcomeEmailTemplate,
} from "@/lib/email/templates/auth";
import { sendEmail, type SendEmailResult } from "@/lib/email/send";

const VERIFY_TTL_HOURS = 48;
const RESET_TTL_HOURS = 1;

type AuthEmailRequestOptions = {
  requestUrl?: string;
};

export async function sendVerificationEmail(
  user: {
    id: string;
    email: string;
    displayName: string;
  },
  options?: AuthEmailRequestOptions
): Promise<SendEmailResult> {
  const raw = await issueAuthToken(user.id, AuthTokenType.EMAIL_VERIFY, VERIFY_TTL_HOURS);
  const template = await buildVerifyEmailTemplate({
    displayName: user.displayName,
    token: raw,
    requestUrl: options?.requestUrl,
  });

  return sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendPasswordResetEmail(
  user: {
    id: string;
    email: string;
    displayName: string;
  },
  options?: AuthEmailRequestOptions
): Promise<SendEmailResult> {
  const raw = await issueAuthToken(user.id, AuthTokenType.PASSWORD_RESET, RESET_TTL_HOURS);
  const template = await buildResetPasswordTemplate({
    displayName: user.displayName,
    token: raw,
    requestUrl: options?.requestUrl,
  });

  return sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendWelcomeEmail(
  user: {
    email: string;
    displayName: string;
  },
  options?: AuthEmailRequestOptions
): Promise<SendEmailResult> {
  const template = await buildWelcomeEmailTemplate({
    displayName: user.displayName,
    requestUrl: options?.requestUrl,
  });

  return sendEmail({
    to: user.email,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
