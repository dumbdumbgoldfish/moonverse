import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createEmptyReviewDraft,
  isDraftReadyToPublish,
  validateDraftReadingUrls,
} from "@/lib/review-draft";
import {
  canUserPublishDraft,
  mapReviewDraftToCreatePayload,
} from "@/lib/review-draft-publish";
import { LIMITS } from "@/lib/validation";

function readyExistingNovelDraft() {
  return createEmptyReviewDraft({
    id: "draft-ready-1",
    novelMode: "existing",
    selectedNovelId: "novel-1",
    novelTitle: "Das Parfum",
    novelAuthor: "Patrick Süskind",
    rating: 5,
    reviewTitle: "Something unforgettably haunting",
    reviewBody:
      "I really enjoyed this novel. The story was engaging from the beginning, and the author did a great job of balancing emotional moments with a compelling mystery throughout the entire arc.",
    containsSpoilers: false,
  });
}

describe("isDraftReadyToPublish", () => {
  it("accepts a complete existing-novel draft", () => {
    assert.equal(isDraftReadyToPublish(readyExistingNovelDraft()), true);
  });

  it("rejects drafts missing review body length", () => {
    const draft = readyExistingNovelDraft();
    draft.reviewBody = "Too short.";
    assert.equal(isDraftReadyToPublish(draft), false);
  });

  it("rejects new-novel drafts without genres", () => {
    const draft = createEmptyReviewDraft({
      novelMode: "new",
      novelTitle: "Fresh Title",
      novelAuthor: "Fresh Author",
      rating: 4,
      reviewTitle: "A solid debut worth reading",
      reviewBody: "x".repeat(LIMITS.reviewBody.min),
    });
    assert.equal(isDraftReadyToPublish(draft), false);
  });
});

describe("mapReviewDraftToCreatePayload", () => {
  it("maps existing-novel drafts without creating a new novel", () => {
    const draft = readyExistingNovelDraft();
    draft.readingLinks = ["https://example.com/read"];

    const payload = mapReviewDraftToCreatePayload(draft);

    assert.equal(payload.novelMode, "existing");
    assert.equal(payload.novelId, "novel-1");
    assert.equal(payload.novelTitle, undefined);
    assert.equal(payload.reviewTitle, draft.reviewTitle);
    assert.equal(payload.reviewBody, draft.reviewBody);
    assert.equal(payload.rating, 5);
    assert.deepEqual(payload.readingUrls, ["https://example.com/read"]);
  });

  it("maps new-novel drafts with taxonomy ids", () => {
    const draft = createEmptyReviewDraft({
      novelMode: "new",
      novelTitle: "Fresh Title",
      novelAuthor: "Fresh Author",
      selectedGenreIds: ["genre-1"],
      selectedTagIds: ["tag-1"],
      rating: 4,
      reviewTitle: "A solid debut worth reading",
      reviewBody: "x".repeat(LIMITS.reviewBody.min),
      acknowledgeDuplicate: true,
    });

    const payload = mapReviewDraftToCreatePayload(draft);

    assert.equal(payload.novelMode, "new");
    assert.equal(payload.novelTitle, "Fresh Title");
    assert.deepEqual(payload.genreIds, ["genre-1"]);
    assert.deepEqual(payload.tagIds, ["tag-1"]);
    assert.equal(payload.acknowledgeDuplicate, true);
  });
});

describe("validateDraftReadingUrls", () => {
  it("accepts valid https reading links", () => {
    const draft = readyExistingNovelDraft();
    draft.readingLinks = ["https://example.com/read"];
    assert.equal(validateDraftReadingUrls(draft), null);
  });

  it("rejects insecure reading links", () => {
    const draft = readyExistingNovelDraft();
    draft.readingLinks = ["http://example.com/read"];
    assert.equal(
      validateDraftReadingUrls(draft),
      "Every reading source must be a valid HTTPS URL."
    );
  });
});

describe("canUserPublishDraft", () => {
  it("allows publishing local-only drafts with no server owner", () => {
    assert.equal(canUserPublishDraft("user-a", null), true);
  });

  it("allows publishing when the server draft belongs to the caller", () => {
    assert.equal(canUserPublishDraft("user-a", "user-a"), true);
  });

  it("blocks publishing another user's server-backed draft", () => {
    assert.equal(canUserPublishDraft("user-a", "user-b"), false);
  });
});
