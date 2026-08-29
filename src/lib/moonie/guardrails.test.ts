import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isValidUserMessage,
  looksOffTopic,
  normalizeConfidence,
  sanitizeUserMessage,
} from "./guardrails";

describe("moonie guardrails", () => {
  it("sanitizes and truncates long messages", () => {
    const long = "a".repeat(600);
    assert.equal(sanitizeUserMessage(`  ${long}  `).length, 500);
  });

  it("rejects empty messages but allows short in-domain greetings", () => {
    assert.equal(isValidUserMessage(""), false);
    assert.equal(isValidUserMessage("hi"), true);
    assert.equal(isValidUserMessage("romance fantasy please"), true);
  });

  it("allows in-domain recommendation prompts", () => {
    assert.equal(
      looksOffTopic("Recommend a slow-burn romance with a strong female lead"),
      false
    );
    assert.equal(looksOffTopic("fantasy web novel with revenge"), false);
  });

  it("blocks off-topic homework / medical / coding requests", () => {
    assert.equal(
      looksOffTopic("Write my computer science homework essay about databases"),
      true
    );
    assert.equal(
      looksOffTopic("Give me medical advice for a headache"),
      true
    );
    assert.equal(looksOffTopic("Write code for a binary search tree"), true);
  });

  it("normalizes confidence values", () => {
    assert.equal(normalizeConfidence("high"), "high");
    assert.equal(normalizeConfidence(0.9), "high");
    assert.equal(normalizeConfidence(0.5), "medium");
    assert.equal(normalizeConfidence("nope"), "medium");
  });
});
