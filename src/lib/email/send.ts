import { Resend } from "resend";
import {
  canDeliverToRecipient,
  getEmailFrom,
  isEmailConfigured,
  logDevEmailBlocked,
} from "@/lib/email/config";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

/** True when Resend accepted the message (not dev-skipped or config-missing). */
export function wasEmailDelivered(result: SendEmailResult): boolean {
  return result.ok && !result.skipped;
}

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const from = getEmailFrom();

  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[email:dev] RESEND_API_KEY is missing. Email was not sent:",
        { to: input.to, subject: input.subject, text: input.text ?? input.html }
      );
      return { ok: true, skipped: true };
    }
    return { ok: false, error: "Email is not configured." };
  }

  if (!canDeliverToRecipient(input.to)) {
    logDevEmailBlocked(input.to, input.subject);
    console.info("[email:dev-preview]", {
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return { ok: true, skipped: true };
  }

  try {
    const resend = getResendClient();
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      console.error("[email:resend]", error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Resend failed";
    console.error("[email:resend]", message);
    return { ok: false, error: message };
  }
}
