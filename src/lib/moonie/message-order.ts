export type MoonieOrderedMessage = {
  id: string;
  role: string;
  createdAt: Date | string;
};

function roleSortRank(role: string): number {
  if (role === "user") return 0;
  if (role === "assistant") return 1;
  return 2;
}

/**
 * Stable chronological order for Moonie turns.
 * When user + assistant share a transaction timestamp, user always precedes assistant.
 */
export function sortMoonieMessagesChronologically<T extends MoonieOrderedMessage>(
  messages: T[]
): T[] {
  return [...messages].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    if (ta !== tb) return ta - tb;

    const roleDelta = roleSortRank(a.role) - roleSortRank(b.role);
    if (roleDelta !== 0) return roleDelta;

    return a.id.localeCompare(b.id);
  });
}
