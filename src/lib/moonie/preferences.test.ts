import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractPreferencesFromMessage,
  mergeConversationPreferences,
} from "./preferences";

describe("Moonie preference extraction", () => {
  it("matches short genre aliases only as whole phrases", () => {
    const unrelated = extractPreferencesFromMessage(
      "I have a problem choosing a novel"
    );
    assert.equal(unrelated.genres.includes("bl"), false);

    const boysLove = extractPreferencesFromMessage("Recommend a BL mystery");
    assert.equal(boysLove.genres.includes("bl"), true);
    assert.equal(boysLove.genres.includes("mystery"), true);
  });

  it("keeps independent positive and negative tag intent separate", () => {
    const prefs = extractPreferencesFromMessage(
      "I want a tragic cultivation novel with no harem"
    );
    assert.equal(prefs.tags.includes("tragedy"), true);
    assert.equal(prefs.excludedTags.includes("harem"), true);
    assert.equal(prefs.excludedTags.includes("tragedy"), false);
  });

  it("lets a later negative preference override an earlier positive one", () => {
    const prefs = mergeConversationPreferences([
      { role: "user", content: "A harem romance please" },
      { role: "assistant", content: "Here are some choices" },
      { role: "user", content: "Actually, no harem and no romance" },
    ]);

    assert.equal(prefs.tags.includes("harem"), false);
    assert.equal(prefs.genres.includes("romance"), false);
    assert.equal(prefs.excludedTags.includes("harem"), true);
    assert.equal(prefs.excludedTags.includes("romance"), true);
  });

  it("removes romance when the user asks to remove it mid-conversation", () => {
    const prefs = mergeConversationPreferences([
      { role: "user", content: "Recommend fantasy and romance" },
      { role: "assistant", content: "Picks" },
      { role: "user", content: "remove romance" },
    ]);
    assert.equal(prefs.genres.includes("romance"), false);
    assert.equal(prefs.excludedTags.includes("romance"), true);
    assert.equal(prefs.genres.includes("fantasy"), true);
  });
});
