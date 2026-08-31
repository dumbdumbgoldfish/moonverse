import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyMoonieIntents, isBareCatalogueTitleQuery } from "@/lib/moonie/intent";
import { handleMoonieRequest } from "./moonie-response.service";

const COMPLETED_REQUEST = "Show me completed found family or slice-of-life novels";

describe("constraint-relaxation continuity", () => {
  it("asks which current constraint to drop, then treats romance as a genre answer", async () => {
    const first = await handleMoonieRequest({
      message: COMPLETED_REQUEST,
      messages: [],
      isLoggedIn: false,
    });
    assert.equal(first.state === "no_results" || first.recommendations.length > 0, true);

    const relax = await handleMoonieRequest({
      message: "Same request, but drop the strictest constraint.",
      messages: [
        { role: "user", content: COMPLETED_REQUEST },
        {
          role: "assistant",
          content: first.reply,
          meta: {
            state: first.state,
            emptyReason: first.emptyReason,
            interpretedPreferences: first.interpretedPreferences,
            recommendations: first.recommendations,
          },
        },
      ],
      isLoggedIn: false,
    });

    assert.match(relax.reply, /which criterion|current constraints/i);
    assert.equal(relax.pendingClarification?.kind, "constraint_relaxation");
    assert.doesNotMatch(relax.reply, /couldn't verify/i);
    assert.equal(relax.recommendations.length, 0);

    assert.equal(isBareCatalogueTitleQuery("romance"), true);
    const romanceIntents = classifyMoonieIntents("romance", {
      pendingClarification: relax.pendingClarification,
      hasPriorRecommendations: first.recommendations.length > 0,
      hasConversationPrefs: true,
    });
    assert.equal(romanceIntents.includes("FIND_NOVEL"), false);

    const romance = await handleMoonieRequest({
      message: "romance",
      messages: [
        { role: "user", content: COMPLETED_REQUEST },
        {
          role: "assistant",
          content: first.reply,
          meta: {
            state: first.state,
            emptyReason: first.emptyReason,
            recommendations: first.recommendations,
          },
        },
        { role: "user", content: "Same request, but drop the strictest constraint." },
        {
          role: "assistant",
          content: relax.reply,
          meta: { pendingClarification: relax.pendingClarification },
        },
      ],
      isLoggedIn: false,
    });

    assert.doesNotMatch(romance.reply, /couldn't verify ['‘']romance['’']/i);
    assert.equal(romance.lookupSession, undefined);
    assert.ok(
      romance.pendingClarification?.kind === "constraint_relaxation" ||
        romance.responseKind === "recommendations" ||
        romance.state === "no_results"
    );
    if (romance.pendingClarification?.kind === "constraint_relaxation") {
      assert.equal(romance.pendingClarification.phase, "genre_or_status");
      assert.match(romance.reply, /change the genre to romance|drop the completion/i);
    }
  });
});
