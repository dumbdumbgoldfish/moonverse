import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("DefaultNovelCover", () => {
  it("renders only the bundled placeholder artwork", async () => {
    const source = readFileSync(
      new URL("../novels/DefaultNovelCover.tsx", import.meta.url),
      "utf8"
    );
    assert.match(source, /MOONVERSE_MISSING_COVER_SRC/);
    assert.doesNotMatch(source, /line-clamp-3/);
    assert.doesNotMatch(source, /RatingRow/);
    assert.match(source, /moonversePlaceholderAriaLabel/);
  });
});

describe("CoverImage fallback routing", () => {
  it("routes missing and failed covers through DefaultNovelCover", async () => {
    const source = readFileSync(
      new URL("./CoverImage.tsx", import.meta.url),
      "utf8"
    );
    assert.match(source, /DefaultNovelCover/);
    assert.match(source, /failedSrc === src/);
    assert.match(source, /onError/);
  });
});
