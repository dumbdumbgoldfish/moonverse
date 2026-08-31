/**
 * Desk assistant mount key: bumps only on explicit fresh desk, never when the
 * first reply assigns a persisted conversation id to the URL.
 */
export const MOONIE_DESK_MOUNT_KEY_PREFIX = "desk";

export function formatMoonieDeskMountKey(epoch: number): string {
  return `${MOONIE_DESK_MOUNT_KEY_PREFIX}-${epoch}`;
}

export function bumpMoonieDeskMountEpoch(epoch: number): number {
  return epoch + 1;
}

export function shouldBumpMoonieDeskMountOnRouteChange(options: {
  previousConversationId: string | undefined;
  routeNewChat: boolean;
  routeConversationId: string | undefined;
}): boolean {
  return (
    options.routeNewChat &&
    options.routeConversationId == null &&
    options.previousConversationId != null
  );
}
