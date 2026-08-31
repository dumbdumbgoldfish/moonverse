import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMoonieReviewerFolderReply } from "@/lib/moonie/reviewer-folder-reply";

const PRIVATE_REVIEWER = {
  id: "reviewer-fixture-private-only",
  username: "privateonly",
  displayName: "Private Only",
};

const PUBLIC_REVIEWER = {
  id: "reviewer-fixture-public-mix",
  username: "publicmix",
  displayName: "Public Mix",
};

describe("reviewer folder privacy (isolated fixtures)", () => {
  it("does not disclose private-only folder names, ids, or counts", () => {
    const response = buildMoonieReviewerFolderReply({
      folders: [
        {
          id: "folder-private-fixture",
          name: "Read Later",
          isPublic: false,
          reviewCount: 3,
        },
      ],
      overview: PRIVATE_REVIEWER,
      viewerId: "viewer-fixture",
    });

    assert.match(
      response.reply,
      /private|public folders that reviewers choose to share/i
    );
    assert.doesNotMatch(response.reply, /Read Later/i);
    assert.doesNotMatch(response.reply, /\/folders\//i);
    assert.doesNotMatch(JSON.stringify(response), /folder-private-fixture/);
    assert.doesNotMatch(response.reply, /\b3 reviews\b/i);
  });

  it("lists public folders without leaking private-only metadata", () => {
    const response = buildMoonieReviewerFolderReply({
      folders: [
        {
          id: "folder-public-fixture",
          name: "Sci-Fi Picks",
          isPublic: true,
          reviewCount: 2,
        },
      ],
      overview: PUBLIC_REVIEWER,
      viewerId: "viewer-fixture",
    });

    assert.match(response.reply, /Sci-Fi Picks/i);
    assert.match(response.reply, /\/folders\/folder-public-fixture/i);
    assert.doesNotMatch(
      response.reply,
      /private folders on MoonVerse are private/i
    );
  });
});
