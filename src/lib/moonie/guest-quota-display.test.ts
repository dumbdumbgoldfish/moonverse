import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MOONIE_QUICK_PROMPTS } from "@/lib/moonie/constants";
import {
  buildMoonieIntentContextFromMessages,
  moonieRequestLikelyConsumesQuota,
} from "@/lib/moonie/guest-quota-enforcement";
import {
  buildGuestRateLimitApiError,
  formatGuestQuotaUsed,
  MOONIE_GUEST_RATE_LIMIT_TITLE,
} from "@/lib/moonie/quota-copy";
import {
  classifyMoonieIntents,
  isBareCatalogueTitleQuery,
  isCataloguePreferenceDescription,
  primaryRetrievalIntent,
} from "@/lib/moonie/intent";

describe("guest quota copy", () => {
  it("uses demo wording without daily reset promises", () => {
    assert.equal(MOONIE_GUEST_RATE_LIMIT_TITLE, "Demo limit reached");
    assert.equal(formatGuestQuotaUsed(3, 3), "3 / 3 free turns used");
    assert.match(buildGuestRateLimitApiError(), /free Moonie demo turns/i);
    assert.doesNotMatch(buildGuestRateLimitApiError(), /tomorrow/i);
  });
});

describe("catalogue preference descriptions", () => {
  it("routes the slow-burn starter to recommendations, not title lookup", () => {
    const message = MOONIE_QUICK_PROMPTS[0];
    assert.equal(isCataloguePreferenceDescription(message), true);
    assert.equal(isBareCatalogueTitleQuery(message), false);
    const intents = classifyMoonieIntents(message, {});
    assert.equal(primaryRetrievalIntent(intents), "RECOMMEND");
    assert.equal(intents.includes("FIND_NOVEL"), false);
  });

  it("keeps genuine bare catalogue titles as lookup", () => {
    assert.equal(isCataloguePreferenceDescription("Cultivation Chat Group"), false);
    assert.equal(isBareCatalogueTitleQuery("Cultivation Chat Group"), true);
    const intents = classifyMoonieIntents("Cultivation Chat Group", {});
    assert.equal(intents.includes("FIND_NOVEL"), true);
  });
});

describe("guest quota enforcement", () => {
  it("treats recommendation starters as chargeable", () => {
    const message = "A completed slow-burn romance with a clever heroine.";
    const context = buildMoonieIntentContextFromMessages([]);
    assert.equal(moonieRequestLikelyConsumesQuota(message, context), true);
  });

  it("treats greetings as non-chargeable", () => {
    assert.equal(
      moonieRequestLikelyConsumesQuota("hi", buildMoonieIntentContextFromMessages([])),
      false
    );
  });
});
