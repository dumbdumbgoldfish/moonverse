import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { buildMoonieReviewerFolderReply } from "@/lib/moonie/reviewer-folder-reply";

const PRIVATE_REVIEWER_ID = "reviewer-fixture-private-only";
const PUBLIC_REVIEWER_ID = "reviewer-fixture-public-mix";

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function folderEnvelope(
  reply: string,
  overview: {
    id: string;
    username: string;
    displayName: string;
  }
) {
  return {
    reply,
    recommendations: [],
    responseKind: "chat" as const,
    consumesQuota: true,
    reviewerOverview: {
      id: overview.id,
      displayName: overview.displayName,
      username: overview.username,
      avatarInitials: "PO",
      avatarUrl: null,
      bio: null,
      reviewCount: 4,
      followerCount: 1,
      followingCount: 0,
      averageRatingGiven: null,
      topGenres: [],
      recentReviews: [],
      isFollowing: false,
    },
  };
}

describe("reviewer folder privacy API serialization", () => {
  it("keeps private folder metadata out of the MoonieRecommendResponse JSON envelope", () => {
    const privateReply = buildMoonieReviewerFolderReply({
      folders: [
        {
          id: "folder-private-fixture",
          name: "Read Later",
          isPublic: false,
          reviewCount: 3,
        },
      ],
      overview: {
        id: PRIVATE_REVIEWER_ID,
        username: "privateonly",
        displayName: "Private Only",
      },
      viewerId: "viewer-fixture",
    });

    const privateEnvelope = folderEnvelope(privateReply.reply, {
      id: PRIVATE_REVIEWER_ID,
      username: "privateonly",
      displayName: "Private Only",
    });
    const privateJson = JSON.stringify(privateEnvelope);

    assert.doesNotMatch(privateJson, /folder-private-fixture/);
    assert.doesNotMatch(privateJson, /Read Later/i);
    assert.doesNotMatch(privateJson, /"reviewCount":\s*3/);

    const publicReply = buildMoonieReviewerFolderReply({
      folders: [
        {
          id: "folder-public-fixture",
          name: "Sci-Fi Picks",
          isPublic: true,
          reviewCount: 2,
        },
      ],
      overview: {
        id: PUBLIC_REVIEWER_ID,
        username: "publicmix",
        displayName: "Public Mix",
      },
      viewerId: "viewer-fixture",
    });

    const publicEnvelope = folderEnvelope(publicReply.reply, {
      id: PUBLIC_REVIEWER_ID,
      username: "publicmix",
      displayName: "Public Mix",
    });
    const publicJson = JSON.stringify(publicEnvelope);

    assert.match(publicJson, /Sci-Fi Picks/);
    assert.match(publicJson, /folder-public-fixture/);
  });

  it("routes folder privacy through the folder reply helper in the service", () => {
    const service = source("../services/moonie-reviewer.service.ts");
    const folderBranch = service.match(
      /isReviewerFolderRequest\(options\.message\)[\s\S]*?return \{[\s\S]*?reply: folderReply\.reply/
    )?.[0];
    assert.ok(folderBranch);
    assert.match(folderBranch!, /buildMoonieReviewerFolderReply/);
    assert.doesNotMatch(folderBranch!, /folder\.name/);
    assert.doesNotMatch(folderBranch!, /folder\.id/);
  });
});
