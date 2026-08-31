import type { EnrichedNotificationItem } from "@/types/notification";

export type BellPreviewResult =
  | {
      success: true;
      unreadCount: number;
      notifications: EnrichedNotificationItem[];
    }
  | { success: false; error: string };

export function resolveBellOpenToggle(currentlyOpen: boolean): {
  nextOpen: boolean;
  shouldLoadPreview: boolean;
} {
  const nextOpen = !currentlyOpen;
  return {
    nextOpen,
    shouldLoadPreview: !currentlyOpen && nextOpen,
  };
}

export function createBellPreviewLoader(deps: {
  fetchPreview: () => Promise<BellPreviewResult>;
  onSuccess: (
    result: Extract<BellPreviewResult, { success: true }>,
    ownerId: string
  ) => void;
}) {
  let inFlight: Promise<void> | null = null;
  let requestId = 0;

  function invalidate() {
    requestId += 1;
    inFlight = null;
  }

  function requestPreview(userId: string | undefined): Promise<void> | undefined {
    if (!userId) return;
    if (inFlight) return inFlight;

    const id = ++requestId;
    const startedFor = userId;

    inFlight = deps
      .fetchPreview()
      .then((result) => {
        if (id !== requestId) return;
        if (!result.success) return;
        deps.onSuccess(result, startedFor);
      })
      .catch(() => {
        // Leave the next explicit open free to retry.
      })
      .finally(() => {
        if (id === requestId) {
          inFlight = null;
        }
      });

    return inFlight;
  }

  return {
    requestPreview,
    invalidate,
    isInFlight: () => inFlight !== null,
  };
}
