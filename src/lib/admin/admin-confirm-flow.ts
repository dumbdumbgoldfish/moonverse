export interface AdminConfirmOutcome {
  success: boolean;
  error?: string;
}

/**
 * Single async confirm handler for AdminConfirmDialog — no transitions, no refresh.
 * Parent owns row pending and router.refresh().
 */
export async function runAdminConfirmFlow(
  onConfirm: () => Promise<AdminConfirmOutcome>,
  hooks: {
    setConfirming: (value: boolean) => void;
    setError: (message: string | null) => void;
    close: () => void;
  }
): Promise<AdminConfirmOutcome> {
  hooks.setConfirming(true);
  hooks.setError(null);
  try {
    const result = await onConfirm();
    if (!result.success) {
      hooks.setError(result.error ?? "Action failed.");
      return result;
    }
    hooks.close();
    return result;
  } catch (error) {
    const failed = {
      success: false,
      error: error instanceof Error ? error.message : "Action failed.",
    };
    hooks.setError(failed.error);
    return failed;
  } finally {
    hooks.setConfirming(false);
  }
}
