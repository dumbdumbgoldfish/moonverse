export function findStoredMoonieTurnResponse(
  messages: Array<{ role: string; meta: unknown }>,
  clientTurnId: string | undefined
): Record<string, unknown> | null {
  if (!clientTurnId) return null;
  for (const message of messages) {
    if (
      message.role !== "assistant" ||
      !message.meta ||
      typeof message.meta !== "object"
    ) {
      continue;
    }
    const meta = message.meta as {
      clientTurnId?: unknown;
      response?: unknown;
    };
    if (
      meta.clientTurnId === clientTurnId &&
      meta.response &&
      typeof meta.response === "object" &&
      !Array.isArray(meta.response)
    ) {
      return meta.response as Record<string, unknown>;
    }
  }
  return null;
}
