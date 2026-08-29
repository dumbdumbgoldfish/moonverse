import { MOONIE_QUICK_PROMPTS } from "@/lib/moonie/constants";
import {
  buildConversationalState,
  isAffirmationFollowUpMessage,
  isComplimentFollowUpMessage,
  isUnrelatedFactualQuestion,
  pickConversationalVariant,
  type ConversationalState,
} from "@/lib/moonie/conversational-state";
import {
  isMoonieNameReference,
  normalizeConversationalInput,
  type MoonieIntent,
} from "@/lib/moonie/intent";

function wellnessReply(state: ConversationalState): string {
  return pickConversationalVariant(
    [
      "I'm doing well, thanks for asking.",
      "Doing great on the MoonVerse side.",
      "All good here, thanks.",
    ],
    state,
    1
  );
}

function complimentReply(state: ConversationalState): string {
  return pickConversationalVariant(
    [
      "That is sweet of you.",
      "Aw, thank you.",
      "You are kind.",
    ],
    state,
    2
  );
}

function complimentFollowUpReply(state: ConversationalState): string {
  return pickConversationalVariant(
    [
      "I appreciate that.",
      "I mean it, I try to keep things warm around here.",
      "Honestly, that made my day a little brighter.",
    ],
    state,
    3
  );
}

function affirmationFollowUpReply(state: ConversationalState): string {
  return pickConversationalVariant(
    [
      "Glad to hear it.",
      "Good to know.",
      "Nice.",
    ],
    state,
    4
  );
}

export function buildGreetingReply(
  isLoggedIn: boolean,
  state: ConversationalState
): string {
  const repeatIndex = state.greetingCount;

  if (repeatIndex >= 2) {
    return pickConversationalVariant(
      [
        "We're collecting hellos today.",
        "Hi again. I like the energy.",
        "Still here, still Moonie.",
      ],
      state,
      5
    );
  }

  if (repeatIndex === 1) {
    return pickConversationalVariant(
      [
        "Hi again!",
        "Hey again, good to see you back.",
        "Hello again.",
      ],
      state,
      6
    );
  }

  if (isLoggedIn) {
    return pickConversationalVariant(
      [
        "Hi! I'm Moonie. Good to see you here.",
        "Hey! Moonie here.",
        "Hello! Nice to drop by.",
      ],
      state,
      7
    );
  }

  return pickConversationalVariant(
    [
      "Hey! Moonie here on MoonVerse.",
      "Hello! I help people find novels on MoonVerse.",
      "Hi there, I'm Moonie.",
    ],
    state,
    8
  );
}

export function buildThanksReply(state: ConversationalState): string {
  return pickConversationalVariant(
    [
      "Happy to help.",
      "Anytime.",
      "Glad that helped.",
    ],
    state,
    9
  );
}

export function buildHelpReply(state: ConversationalState): string {
  if (state.explainedCapabilities) {
    return pickConversationalVariant(
      [
        "Same as before: recommendations, title lookups, reading links, and compare, all from the MoonVerse catalogue.",
        "You know the drill: mood picks, title search, verified links, and compare.",
        "Still the same toolkit: discover, look up, link, or compare catalogue titles.",
      ],
      state,
      10
    );
  }

  return pickConversationalVariant(
    [
      "I can recommend catalogue novels, look up a title, find verified reading links, compare picks, and summarise what MoonVerse readers think.",
      "Think of me as your MoonVerse reading desk: recommendations, lookups, reading links, comparisons, and reader opinions.",
      "I search the verified MoonVerse catalogue for recommendations, title matches, reading links, and compare views.",
    ],
    state,
    11
  );
}

export function buildIdentityReply(
  message: string,
  state: ConversationalState
): string {
  const lower = normalizeConversationalInput(message).toLowerCase();

  if (isMoonieNameReference(message)) {
    if (state.introducedSelf) {
      return pickConversationalVariant(
        [
          "Yep, still Moonie.",
          "Still me.",
          "Moonie, reporting for duty.",
        ],
        state,
        12
      );
    }
    return pickConversationalVariant(
      [
        "Yep, I'm Moonie.",
        "That's me, Moonie.",
        "Moonie here.",
      ],
      state,
      13
    );
  }

  if (
    /\b(what(?:'s| is) your name|what can i call you|your name)\b/i.test(lower)
  ) {
    if (state.introducedSelf) {
      return pickConversationalVariant(
        [
          "Still Moonie, your MoonVerse novel discovery assistant.",
          "Same as before, I'm Moonie.",
          "Moonie, same as I said earlier.",
        ],
        state,
        14
      );
    }
    return pickConversationalVariant(
      [
        "I'm Moonie, your MoonVerse novel discovery assistant.",
        "Moonie, I help you discover novels on MoonVerse.",
        "Name's Moonie. I search the MoonVerse catalogue for you.",
      ],
      state,
      15
    );
  }

  if (/\bare you moonie\b/i.test(lower)) {
    return pickConversationalVariant(
      [
        "Yes, I'm Moonie, the MoonVerse reading companion.",
        "That's me, Moonie's my name.",
        "Yep, Moonie at your service.",
      ],
      state,
      16
    );
  }

  if (/\b(who are you|what are you)\b/i.test(lower)) {
    return pickConversationalVariant(
      [
        "I'm Moonie, MoonVerse's novel discovery assistant.",
        "I'm Moonie, I help you find catalogue titles, reading links, and reader opinions.",
        "Moonie here. I work from real MoonVerse catalogue data.",
      ],
      state,
      17
    );
  }

  if (/\btell me about yourself\b/i.test(lower)) {
    return pickConversationalVariant(
      [
        "I'm Moonie. I search the MoonVerse catalogue to recommend novels, look up titles, find verified reading links, and surface what readers think.",
        "I'm Moonie, recommendations, lookups, reading links, and reader opinions, all grounded in MoonVerse data.",
        "Moonie, MoonVerse's reading companion. I never invent titles or reviews.",
      ],
      state,
      18
    );
  }

  return "I'm Moonie, your MoonVerse novel discovery assistant.";
}

export function buildSmallTalkReply(
  message: string,
  state: ConversationalState
): string {
  const lower = normalizeConversationalInput(message).toLowerCase();

  if (isComplimentFollowUpMessage(message)) {
    return complimentFollowUpReply(state);
  }

  if (isAffirmationFollowUpMessage(message)) {
    return affirmationFollowUpReply(state);
  }

  if (/^how(?:'s| is) it going/.test(lower) || /^how are (?:you|u)/.test(lower)) {
    return wellnessReply(state);
  }

  if (/^(?:you(?:'re| are) okay|are you okay)/.test(lower)) {
    return pickConversationalVariant(
      [
        "I'm all good, thanks.",
        "Doing fine over here.",
        "All good on my end.",
      ],
      state,
      19
    );
  }

  if (/^good morning/.test(lower)) {
    return pickConversationalVariant(
      [
        "Good morning!",
        "Morning!",
        "Good morning to you too.",
      ],
      state,
      20
    );
  }

  if (/^good afternoon/.test(lower)) {
    return pickConversationalVariant(
      ["Good afternoon!", "Afternoon!", "Hope your afternoon is going well."],
      state,
      21
    );
  }

  if (/^good evening/.test(lower)) {
    return pickConversationalVariant(
      ["Good evening!", "Evening!", "Good evening to you."],
      state,
      22
    );
  }

  if (/^(?:nice|great|pleased|good)\s+to\s+meet\s+you/.test(lower)) {
    return pickConversationalVariant(
      [
        "Nice to meet you too!",
        "Great to meet you as well.",
        "Likewise, good to meet you.",
      ],
      state,
      23
    );
  }

  if (/^you(?:'re| are) (?:so )?(?:cute|sweet|adorable|lovely)/.test(lower)) {
    return complimentReply(state);
  }

  if (/^i (?:like|love) (?:you|moonie)/.test(lower)) {
    return pickConversationalVariant(
      [
        "Thank you, that means a lot.",
        "That is really kind of you.",
        "I appreciate that.",
      ],
      state,
      24
    );
  }

  return wellnessReply(state);
}

export function buildCasualChatReply(
  message: string,
  state: ConversationalState
): string {
  const lower = normalizeConversationalInput(message).toLowerCase();

  if (isUnrelatedFactualQuestion(message)) {
    return pickConversationalVariant(
      [
        "I don't have live weather or news. I'm focused on MoonVerse novels. If you want a mood or title, I can help with that.",
        "That's outside my lane. I'm here for MoonVerse novel discovery if you want a pick or lookup.",
        "I stick to novels on MoonVerse. Tell me a genre or title if you'd like help there.",
      ],
      state,
      25
    );
  }

  if (lower === "ok" || lower === "okay" || lower === "cool") {
    return pickConversationalVariant(
      [
        "Sounds good.",
        "Alright.",
        "Take your time.",
      ],
      state,
      26
    );
  }

  return pickConversationalVariant(
    [
      "I'm here for novel discovery on MoonVerse. Tell me a mood, trope, or title when you're ready.",
      "MoonVerse novels are my specialty. Ask for a recommendation or lookup anytime.",
      "I can help when you want a catalogue pick or title search.",
    ],
    state,
    27
  );
}

export function buildConversationalReply(
  intents: MoonieIntent[],
  message: string,
  isLoggedIn: boolean,
  messages: Array<{ role: string; content: string }>
): string {
  const state = buildConversationalState(messages);

  if (intents.includes("GREETING")) {
    return buildGreetingReply(isLoggedIn, state);
  }
  if (intents.includes("THANKS")) {
    return buildThanksReply(state);
  }
  if (intents.includes("IDENTITY")) {
    return buildIdentityReply(message, state);
  }
  if (intents.includes("HELP")) {
    return buildHelpReply(state);
  }
  if (intents.includes("SMALL_TALK")) {
    return buildSmallTalkReply(message, state);
  }
  return buildCasualChatReply(message, state);
}

export function buildColdStartReply(): {
  reply: string;
  quickPrompts: string[];
} {
  return {
    reply:
      "I do not know your taste yet. Tell me a genre, mood, trope, or a novel you already love and I will search the verified catalogue.",
    quickPrompts: [...MOONIE_QUICK_PROMPTS.slice(0, 4)],
  };
}

export function buildImageLookupStubReply(): string {
  return "I can read a cover or screenshot soon. For now, type the title or send a clearer crop and I will look it up in the MoonVerse catalogue.";
}
