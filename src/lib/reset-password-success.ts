export function normalizeResetEmail(email?: string): string {
  return typeof email === "string" ? email.toLowerCase().trim() : "";
}

export function buildResetPasswordLoginRedirect(email?: string): string {
  const normalized = normalizeResetEmail(email);
  return normalized
    ? `/login?reset=1&email=${encodeURIComponent(normalized)}`
    : "/login?reset=1";
}

export type ResetPasswordSuccessActions = {
  rememberEmail: (email: string) => void;
  closePanel: () => void;
  navigate: (path: string) => void;
};

/** Post-reset client flow: remember email, close Moonie, redirect to login (no session). */
export function applyResetPasswordSuccess(
  email: string | undefined,
  actions: ResetPasswordSuccessActions
): void {
  const normalized = normalizeResetEmail(email);
  if (normalized) {
    actions.rememberEmail(normalized);
  }
  actions.closePanel();
  actions.navigate(buildResetPasswordLoginRedirect(email));
}
