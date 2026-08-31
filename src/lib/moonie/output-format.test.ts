import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  containsOutputFormatBrevityCue,
  mentionsNovelLengthConstraint,
} from "./output-format";
import { buildCurrentTurnHardConstraints } from "./hard-constraints";
import { buildMoonieShelfPrompt } from "@/lib/discover";

describe("output format vs novel length", () => {
  it("does not infer short length from shelf prompt short why", () => {
    const message = buildMoonieShelfPrompt({
      tagNames: [],
      novelTitles: [
        "Sovereign of the Three Realms",
        "Outlander",
        "The Housemaid Is Watching",
        "Comparative Strangers",
      ],
    });
    assert.equal(containsOutputFormatBrevityCue(message), true);
    assert.equal(mentionsNovelLengthConstraint(message), false);
    const hard = buildCurrentTurnHardConstraints(message);
    assert.equal(hard.length, null);
  });

  it("detects genuine short novel constraints", () => {
    for (const message of [
      "Recommend short novels in the MoonVerse catalog",
      "Find short books under 200 chapters",
      "I want a quick read fantasy",
    ]) {
      assert.equal(mentionsNovelLengthConstraint(message), true, message);
    }
    const hard = buildCurrentTurnHardConstraints(
      "Recommend short novels in the MoonVerse catalog"
    );
    assert.equal(hard.length, "short");
  });

  it("preserves both short novels and brief explanations independently", () => {
    const message =
      "Recommend short novels from the MoonVerse catalog with a short why.";
    assert.equal(mentionsNovelLengthConstraint(message), true);
    assert.equal(containsOutputFormatBrevityCue(message), true);
    const hard = buildCurrentTurnHardConstraints(message);
    assert.equal(hard.length, "short");
  });

  it("treats briefly explain as output format only", () => {
    const message =
      "Recommend a next read from the MoonVerse catalog and briefly explain why.";
    assert.equal(containsOutputFormatBrevityCue(message), true);
    assert.equal(mentionsNovelLengthConstraint(message), false);
    assert.equal(buildCurrentTurnHardConstraints(message).length, null);
  });
});
