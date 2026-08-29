export { appBaseUrl } from "@/lib/email/app-url";
export {
  canDeliverToRecipient,
  getEmailFrom,
  isEmailConfigured,
} from "@/lib/email/config";
export {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "@/lib/email/auth-emails";
export {
  isTransactionalNotificationEmailType,
  sendTransactionalNotificationEmail,
  TRANSACTIONAL_NOTIFICATION_EMAIL_TYPES,
} from "@/lib/email/notification-emails";
export { sendEmail, wasEmailDelivered, type SendEmailInput, type SendEmailResult } from "@/lib/email/send";
