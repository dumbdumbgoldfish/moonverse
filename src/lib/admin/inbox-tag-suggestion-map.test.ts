import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMapTagSuggestionPayload,
  canSubmitTagSuggestionMap,
  filterCanonicalTagsForMap,
  inboxItemShowsTagSuggestionMap,
  INBOX_TAG_MAP_ACTION_ID,
} from "@/lib/admin/inbox-tag-suggestion-map";

const TAGS = [
  { id: "tag-slow-burn", name: "Slow Burn", slug: "slow-burn", kind: "TROPE" },
  { id: "tag-enemies", name: "Enemies to Lovers", slug: "enemies-to-lovers", kind: "TROPE" },
];

describe("inboxItemShowsTagSuggestionMap", () => {
  it("exposes map-to-existing only for tag suggestions", () => {
    assert.equal(inboxItemShowsTagSuggestionMap("tag_suggestion"), true);
    assert.equal(inboxItemShowsTagSuggestionMap("report"), false);
    assert.equal(inboxItemShowsTagSuggestionMap("reading_link"), false);
  });
});

describe("filterCanonicalTagsForMap", () => {
  it("filters canonical tags by name or slug", () => {
    const filtered = filterCanonicalTagsForMap(TAGS, "slow");
    assert.deepEqual(filtered.map((tag) => tag.id), ["tag-slow-burn"]);
  });
});

describe("canSubmitTagSuggestionMap", () => {
  it("requires a selected existing tag id", () => {
    assert.equal(canSubmitTagSuggestionMap(null, false), false);
    assert.equal(canSubmitTagSuggestionMap("tag-slow-burn", false), true);
  });

  it("blocks duplicate submission while the row is busy", () => {
    assert.equal(canSubmitTagSuggestionMap("tag-slow-burn", true), false);
  });
});

describe("buildMapTagSuggestionPayload", () => {
  it("submits the selected canonical tag id to the map action", () => {
    assert.deepEqual(
      buildMapTagSuggestionPayload("suggestion-1", "tag-slow-burn"),
      { suggestionId: "suggestion-1", tagId: "tag-slow-burn" }
    );
    assert.equal(INBOX_TAG_MAP_ACTION_ID, "map_tag");
  });
});
