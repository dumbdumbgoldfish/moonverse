export function getEmailFrom(): string {
  return process.env.EMAIL_FROM ?? "MoonVerse <no-reply@moonverse.online>";
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function devAllowlist(): Set<string> {
  const raw = process.env.EMAIL_DEV_ALLOWLIST ?? "";
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
}

/**
 * In development, real sends are blocked unless EMAIL_SEND_IN_DEV=true
 * or the recipient is listed in EMAIL_DEV_ALLOWLIST.
 */
export function canDeliverToRecipient(email: string): boolean {
  if (!isEmailConfigured()) return false;

  if (process.env.NODE_ENV === "production") {
    return true;
  }

  if (process.env.EMAIL_SEND_IN_DEV === "true") {
    return true;
  }

  const allowlist = devAllowlist();
  if (allowlist.size === 0) {
    return false;
  }

  return allowlist.has(email.trim().toLowerCase());
}

export function logDevEmailBlocked(to: string, subject: string): void {
  console.warn(
    `[email:dev-blocked] Skipped real send to ${to} (${subject}). ` +
      "Set EMAIL_SEND_IN_DEV=true or add the address to EMAIL_DEV_ALLOWLIST to deliver in development."
  );
}
