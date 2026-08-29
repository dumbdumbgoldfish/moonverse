import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatShelfCount,
  isCloseNightShelfCandidate,
  landingGenreBlurb,
  landingGenreHref,
  normalizeNovelTitle,
  scoreLandingDoorFace,
} from "./landing-genres";

describe("landing genre doors", () => {
  it("formats live shelf counts without inventing numbers", () => {
    assert.equal(formatShelfCount(0, 0), "0 titles");
    assert.equal(formatShelfCount(1, 0), "1 title");
    assert.equal(formatShelfCount(12, 4), "12 titles · 4 reviews");
    assert.equal(formatShelfCount(2, 1), "2 titles · 1 review");
  });

  it("keeps slow-burn on search, not a missing browse route", () => {
    assert.equal(
      landingGenreHref("slow-burn"),
      "/search?tags=slow-burn&type=works",
    );
    assert.equal(landingGenreHref("romance"), "/browse/romance");
  });

  it("prefers curated web novels with reading links over seed noise", () => {
    const curated = scoreLandingDoorFace({
      missingCover: false,
      reviewCount: 2,
      readingLinkCount: 1,
      curated: true,
    });
    const noise = scoreLandingDoorFace({
      missingCover: false,
      reviewCount: 2,
      readingLinkCount: 0,
      curated: false,
    });
    assert.ok(curated > noise);
    assert.equal(
      normalizeNovelTitle("I Shall Seal the Heavens"),
      "i shall seal the heavens",
    );
  });

  it("keeps seed Western titles off the close-night shelf", () => {
    assert.equal(
      isCloseNightShelfCandidate({ curated: true, readingLinkCount: 0 }),
      true,
    );
    assert.equal(
      isCloseNightShelfCandidate({ curated: false, readingLinkCount: 2 }),
      true,
    );
    assert.equal(
      isCloseNightShelfCandidate({ curated: false, readingLinkCount: 0 }),
      false,
    );
  });

  it("does not treat uncurated seed titles as door faces without a reading link", () => {
    assert.equal(
      isCloseNightShelfCandidate({
        curated: false,
        readingLinkCount: 0,
      }),
      false,
    );
    assert.ok(
      scoreLandingDoorFace({
        missingCover: true,
        reviewCount: 1,
        readingLinkCount: 1,
        curated: true,
      }) >
        scoreLandingDoorFace({
          missingCover: false,
          reviewCount: 40,
          readingLinkCount: 0,
          curated: false,
        }),
    );
  });

  it("has a blurb for every editorial door", () => {
    for (const slug of [
      "fantasy",
      "xianxia",
      "comedy",
      "action",
      "sci-fi",
      "litrpg",
      "cultivation",
      "slow-burn",
    ]) {
      assert.ok(landingGenreBlurb(slug).length > 10);
      assert.equal(landingGenreBlurb(slug).includes("-"), false);
    }
  });
});
