let adminServerActionTail: Promise<unknown> = Promise.resolve();

const ADMIN_ACTION_FOLLOW_UP_DELAY_MS = 250;

/**
 * Serialize client-side server-action calls so concurrent admin row actions
 * do not leave hung promises when combined with router.refresh().
 */
export function serialAdminServerAction<T>(action: () => Promise<T>): Promise<T> {
  const next = adminServerActionTail.then(action, action);
  adminServerActionTail = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

/** Queue a post-action follow-up after the serialized action chain (e.g. refresh). */
export function serialAdminFollowUp(fn: () => void): Promise<void> {
  const scheduled = adminServerActionTail.then(async () => {
    fn();
    await new Promise((resolve) =>
      setTimeout(resolve, ADMIN_ACTION_FOLLOW_UP_DELAY_MS)
    );
  });
  adminServerActionTail = scheduled.catch(() => undefined);
  return scheduled;
}
