import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAuthenticatedWriteReviewHref,
  buildGuestWriteReviewHref,
  buildWriteReviewHref,
} from "@/lib/write-entry";

describe("write review entry hrefs", () => {
  const novelId = "cmtdgrhbu00653d45py9jr8ts";

  it("routes guests to the relative /write gate", () => {
    assert.equal(buildGuestWriteReviewHref(), "/write");
    assert.equal(
      buildGuestWriteReviewHref(novelId),
      `/write?novelId=${novelId}`
    );
    assert.equal(
      buildGuestWriteReviewHref(novelId).startsWith("http://"),
      false
    );
  });

  it("routes authenticated users to the review composer", () => {
    assert.equal(buildAuthenticatedWriteReviewHref(), "/reviews/new");
    assert.equal(
      buildAuthenticatedWriteReviewHref(novelId),
      `/reviews/new?novelId=${novelId}`
    );
  });

  it("selects guest vs auth href based on session", () => {
    assert.equal(
      buildWriteReviewHref({ novelId, isLoggedIn: false }),
      `/write?novelId=${novelId}`
    );
    assert.equal(
      buildWriteReviewHref({ novelId, isLoggedIn: true }),
      `/reviews/new?novelId=${novelId}`
    );
  });
});
