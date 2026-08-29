import {
  isGreetingMessage,
  isMoonieNameReference,
  normalizeConversationalInput,
  type MoonieIntent,
} from "@/lib/moonie/intent";

export type ConversationalReplyCategory =
  | "GREETING"
  | "GREETING_REPEAT"
  | "THANKS"
  | "IDENTITY"
  | "IDENTITY_SHORT"
  | "HELP"
  | "HELP_REPEAT"
  | "WELLNESS"
  | "COMPLIMENT"
  | "COMPLIMENT_FOLLOWUP"
  | "MEETING"
  | "TIME_OF_DAY"
  | "AFFIRMATION"
  | "CASUAL"
  | "OFF_TOPIC_REDIRECT";

export interface ConversationalState {
  greetingCount: number;
  lastReplyCategory: ConversationalReplyCategory | null;
  introducedSelf: boolean;
  explainedCapabilities: boolean;
  lastAssistantReply: string | null;
  recentAssistantReplies: string[];
}

interface StoredTurn {
  role: string;
  content: string;
}

export function inferCategoryFromReply(
  reply: string
): ConversationalReplyCategory | null {
  const lower = reply.toLowerCase();

  if (/collecting hellos|hi again|hey again|hello again|still here, still moonie/i.test(lower)) {
    return "GREETING_REPEAT";
  }
  if (/^hi!|^hey!|^hello!|good to see you|moonie here/i.test(lower)) {
    return "GREETING";
  }
  if (/still moonie|reporting for duty|still me/i.test(lower)) {
    return "IDENTITY_SHORT";
  }
  if (/i'm moonie|i am moonie|your moonverse/i.test(lower)) {
    return "IDENTITY";
  }
  if (/recommend catalogue|verified reading links|compare picks/i.test(lower)) {
    return "HELP";
  }
  if (/you know the drill|already said/i.test(lower)) {
    return "HELP_REPEAT";
  }
  if (/doing well|doing great|all good/i.test(lower)) {
    return "WELLNESS";
  }
  if (/you are kind|aw, thank you|that is sweet|that is really kind/i.test(lower)) {
    return "COMPLIMENT";
  }
  if (/sweet of you|that is sweet|means a lot|blushing/i.test(lower)) {
    return lower.includes("blushing") || /appreciate that|mean it/i.test(lower)
      ? "COMPLIMENT_FOLLOWUP"
      : "COMPLIMENT";
  }
  if (/glad to hear|good to know|nice\./i.test(lower)) {
    return "AFFIRMATION";
  }
  if (/nice to meet you too/i.test(lower)) {
    return "MEETING";
  }
  if (/good morning|good afternoon|good evening/i.test(lower)) {
    return "TIME_OF_DAY";
  }
  if (/happy to help|anytime/i.test(lower)) {
    return "THANKS";
  }
  if (/novel discovery on moonverse|only suggest novels/i.test(lower)) {
    return "OFF_TOPIC_REDIRECT";
  }
  if (/whenever you are ready|take your time/i.test(lower)) {
    return "CASUAL";
  }

  return null;
}

export function buildConversationalState(
  messages: StoredTurn[]
): ConversationalState {
  let greetingCount = 0;
  let introducedSelf = false;
  let explainedCapabilities = false;
  let lastReplyCategory: ConversationalReplyCategory | null = null;
  let lastAssistantReply: string | null = null;
  const recentAssistantReplies: string[] = [];

  for (const message of messages) {
    if (message.role === "user" && isGreetingMessage(message.content)) {
      greetingCount += 1;
    }

    if (message.role === "assistant") {
      const category = inferCategoryFromReply(message.content);
      if (category) {
        lastReplyCategory = category;
      }
      if (category === "IDENTITY" || category === "IDENTITY_SHORT") {
        introducedSelf = true;
      }
      if (category === "HELP" || category === "HELP_REPEAT") {
        explainedCapabilities = true;
      }
      lastAssistantReply = message.content;
      recentAssistantReplies.push(message.content);
    }
  }

  return {
    greetingCount,
    lastReplyCategory,
    introducedSelf,
    explainedCapabilities,
    lastAssistantReply,
    recentAssistantReplies: recentAssistantReplies.slice(-6),
  };
}

export function pickConversationalVariant(
  variants: string[],
  state: ConversationalState,
  salt = 0
): string {
  const fresh = variants.filter(
    (line) => !state.recentAssistantReplies.includes(line)
  );
  const pool = fresh.length > 0 ? fresh : variants;
  const index =
    (state.greetingCount + salt + state.recentAssistantReplies.length) %
    pool.length;
  return pool[Math.max(0, index)] ?? variants[0] ?? "";
}

const AFFIRMATION_FOLLOWUP_RE =
  /^(?:good|nice|great|cool|aw+|okay|ok)\b[!?.…\s]*$/i;

const COMPLIMENT_FOLLOWUP_RE =
  /^(?:really|for real|seriously|truly|no way)\b[!?.…\s]*$/i;

export function resolveConversationalFollowUp(
  message: string,
  state: ConversationalState
): MoonieIntent | null {
  const lower = normalizeConversationalInput(message).toLowerCase();

  if (COMPLIMENT_FOLLOWUP_RE.test(lower)) {
    if (
      state.lastReplyCategory === "COMPLIMENT" ||
      state.lastReplyCategory === "COMPLIMENT_FOLLOWUP"
    ) {
      return "SMALL_TALK";
    }
  }

  if (AFFIRMATION_FOLLOWUP_RE.test(lower)) {
    if (
      state.lastReplyCategory === "WELLNESS" ||
      state.lastReplyCategory === "AFFIRMATION"
    ) {
      return "SMALL_TALK";
    }
  }

  if (isMoonieNameReference(message) && state.introducedSelf) {
    return "IDENTITY";
  }

  return null;
}

export function isComplimentFollowUpMessage(message: string): boolean {
  return COMPLIMENT_FOLLOWUP_RE.test(
    normalizeConversationalInput(message).toLowerCase()
  );
}

export function isAffirmationFollowUpMessage(message: string): boolean {
  return AFFIRMATION_FOLLOWUP_RE.test(
    normalizeConversationalInput(message).toLowerCase()
  );
}

export function isUnrelatedFactualQuestion(message: string): boolean {
  const lower = normalizeConversationalInput(message).toLowerCase();
  return /\b(weather|forecast|temperature today|stock price|news headlines)\b/i.test(
    lower
  );
}
