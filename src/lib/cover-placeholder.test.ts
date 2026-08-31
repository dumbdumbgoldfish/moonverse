import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  MOONVERSE_MISSING_COVER_SRC,
  isMoonversePlaceholderCover,
  moonversePlaceholderAriaLabel,
} from "@/lib/cover-placeholder";
import { isMissingCoverUrl } from "@/lib/review-utils";

describe("cover placeholder asset", () => {
  it("points to the bundled default book-cover image", () => {
    assert.equal(
      MOONVERSE_MISSING_COVER_SRC,
      "/images/default-book-cover.jpg"
    );
    const bytes = readFileSync(
      new URL("../../public/images/default-book-cover.jpg", import.meta.url)
    );
    assert.ok(bytes.length > 100_000);
    assert.equal(bytes[0], 0xff);
    assert.equal(bytes[1], 0xd8);
  });

  it("labels placeholders without implying official artwork", () => {
    const label = moonversePlaceholderAriaLabel("Necropolis", "Skyclad-Observer");
    assert.match(label, /Placeholder cover artwork/);
    assert.match(label, /Official cover not available/);
    assert.match(label, /Necropolis/);
  });

  it("does not treat the bundled asset as a catalogue cover URL", () => {
    assert.equal(isMoonversePlaceholderCover(MOONVERSE_MISSING_COVER_SRC), true);
    assert.equal(isMissingCoverUrl(MOONVERSE_MISSING_COVER_SRC), false);
  });
});
