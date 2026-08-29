/**
 * Backward-compatible email entry point.
 * Prefer importing from `@/lib/email/...` in new code.
 */
export {
  appBaseUrl,
  isEmailConfigured,
  sendEmail,
  wasEmailDelivered,
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  type SendEmailInput,
  type SendEmailResult,
} from "@/lib/email/index";
