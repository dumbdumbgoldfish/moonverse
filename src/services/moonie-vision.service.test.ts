import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyOpenAiVisionHttpError,
  visionExtractionUserMessage,
} from "./moonie-vision.service";

describe("moonie vision provider errors", () => {
  it("maps insufficient quota 429 responses", () => {
    const body = JSON.stringify({
      error: { code: "insufficient_quota", message: "You exceeded your quota" },
    });
    assert.equal(classifyOpenAiVisionHttpError(429, body), "insufficient_quota");
    assert.match(
      visionExtractionUserMessage("insufficient_quota"),
      /quota has been reached/i
    );
  });

  it("maps generic 429 responses to unavailable", () => {
    const body = JSON.stringify({
      error: { code: "rate_limit_exceeded", message: "Rate limit reached" },
    });
    assert.equal(classifyOpenAiVisionHttpError(429, body), "unavailable");
    assert.match(
      visionExtractionUserMessage("unavailable"),
      /temporarily unavailable/i
    );
  });

  it("maps auth failures to no_api", () => {
    assert.equal(classifyOpenAiVisionHttpError(401, ""), "no_api");
    assert.match(
      visionExtractionUserMessage("no_api"),
      /not configured/i
    );
  });

  it("distinguishes empty visual extraction from quota errors", () => {
    assert.match(
      visionExtractionUserMessage("empty"),
      /could not identify a novel title/i
    );
    assert.doesNotMatch(
      visionExtractionUserMessage("empty"),
      /quota/i
    );
  });

  it("surfaces unsupported image validation reasons", () => {
    assert.equal(
      visionExtractionUserMessage("unsupported_image", {
        validationReason: "Unsupported image type. Use JPEG, PNG, WebP, or GIF.",
      }),
      "Unsupported image type. Use JPEG, PNG, WebP, or GIF."
    );
  });
});
