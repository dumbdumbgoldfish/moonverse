export interface AdminTableActionOutcome {
  success: boolean;
  error?: string;
}

/**
 * Runs one admin row action: await → apply outcome → clear pending → optional refresh.
 * Pending cleanup always happens before refresh.
 */
export async function runAdminTableAction<T extends AdminTableActionOutcome>(options: {
  run: () => Promise<T>;
  applyOutcome: (result: T) => void;
  clearPending: () => void;
  followUp?: () => void | Promise<void>;
}): Promise<T> {
  let result!: T;
  try {
    result = await options.run();
    options.applyOutcome(result);
  } catch (error) {
    result = {
      success: false,
      error: error instanceof Error ? error.message : "Action failed.",
    } as T;
    options.applyOutcome(result);
  } finally {
    options.clearPending();
  }

  if (result.success && options.followUp) {
    await options.followUp();
  }

  return result;
}
