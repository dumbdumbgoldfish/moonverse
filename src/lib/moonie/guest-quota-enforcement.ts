import { recommendationsFromStoredMeta } from "@/lib/moonie/conversation-context";
import {
  classifyMoonieIntents,
  isConversationalOnly,
  type MoonieIntentContext,
} from "@/lib/moonie/intent";
import { latestPendingClarification } from "@/lib/moonie/pending-clarification";

const NON_CONSUMING_INTENTS = new Set([
  "GREETING",
  "CHAT",
  "SMALL_TALK",
  "HELP",
  "IDENTITY",
  "THANKS",
]);

export function buildMoonieIntentContextFromMessages(
  messages: Array<{ role: string; content: string; meta?: unknown }>
): MoonieIntentContext {
  const recentMessages = messages
    .slice(-8)
    .map((entry) => ({ role: entry.role, content: entry.content }));

  let hasPriorRecommendations = false;
  for (const entry of messages) {
    if (entry.role !== "assistant") continue;
    if (recommendationsFromStoredMeta(entry.meta).length > 0) {
      hasPriorRecommendations = true;
      break;
    }
  }

  return {
    recentMessages,
    hasPriorRecommendations,
    pendingClarification: latestPendingClarification(messages),
  };
}

/** Conservative pre-check before running chargeable Moonie work for guests. */
export function moonieRequestLikelyConsumesQuota(
  message: string,
  context: MoonieIntentContext = {}
): boolean {
  const intents = classifyMoonieIntents(message, context);
  if (isConversationalOnly(intents)) return false;
  return intents.some((intent) => !NON_CONSUMING_INTENTS.has(intent));
}
