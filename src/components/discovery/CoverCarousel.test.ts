import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function source(): string {
  return readFileSync(new URL("./CoverCarousel.tsx", import.meta.url), "utf8");
}

describe("CoverCarousel first paint", () => {
  it("does not branch the first render on window or matchMedia", () => {
    const file = source();
    assert.doesNotMatch(file, /typeof window/);
    assert.doesNotMatch(file, /matchMedia/);
    assert.doesNotMatch(file, /suppressHydrationWarning/);
    assert.doesNotMatch(file, /ssr:\s*false/);
    assert.match(file, /useState\(false\)/);
  });

  it("keeps arrow class names identical on server and client", () => {
    const file = source();
    assert.doesNotMatch(file, /canPrev && "md:inline-flex"/);
    assert.doesNotMatch(file, /canNext && "md:inline-flex"/);
    assert.doesNotMatch(file, /content-visibility:auto/);
    assert.match(file, /md:inline-flex disabled:opacity-40/);
  });
});
