import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildModerationQueueBreakdown,
  computeModerationQueueTotal,
  type ModerationQueueCountParts,
} from "@/lib/admin/moderation-queue-counts";
import { getAdminDashboardAttention } from "@/services/admin/dashboard.service";
import { getInboxCounts } from "@/services/admin/inbox.service";

const representativeFixture: ModerationQueueCountParts = {
  report: 100,
  review_flagged: 200,
  comment_flagged: 150,
  reading_link: 80,
  reading_link_unhealthy: 46,
  tag_suggestion: 0,
};

describe("computeModerationQueueTotal", () => {
  it("includes unhealthy approved reading links in the inbox total", () => {
    assert.equal(computeModerationQueueTotal(representativeFixture), 576);
  });

  it("preserves prior totals when there are zero unhealthy links", () => {
    const withoutUnhealthy: ModerationQueueCountParts = {
      ...representativeFixture,
      reading_link_unhealthy: 0,
    };
    assert.equal(computeModerationQueueTotal(withoutUnhealthy), 530);
    assert.equal(
      computeModerationQueueTotal(withoutUnhealthy),
      computeModerationQueueTotal(representativeFixture) - 46
    );
  });

  it("does not double-count pending and unhealthy links (separate categories)", () => {
    const parts: ModerationQueueCountParts = {
      report: 0,
      review_flagged: 0,
      comment_flagged: 0,
      reading_link: 12,
      reading_link_unhealthy: 46,
      tag_suggestion: 0,
    };
    assert.equal(computeModerationQueueTotal(parts), 58);
    assert.equal(parts.reading_link + parts.reading_link_unhealthy, 58);
  });
});

describe("buildModerationQueueBreakdown", () => {
  it("lists unhealthy reading links as their own category", () => {
    const breakdown = buildModerationQueueBreakdown({
      ...representativeFixture,
      total: computeModerationQueueTotal(representativeFixture),
    });
    const unhealthy = breakdown.find((item) => item.key === "links_unhealthy");
    assert.ok(unhealthy);
    assert.equal(unhealthy.count, 46);
    assert.equal(
      breakdown.reduce((sum, item) => sum + item.count, 0),
      computeModerationQueueTotal(representativeFixture)
    );
  });

  it("omits zero-count categories from the breakdown", () => {
    const breakdown = buildModerationQueueBreakdown({
      report: 1,
      review_flagged: 0,
      comment_flagged: 0,
      reading_link: 2,
      reading_link_unhealthy: 0,
      tag_suggestion: 3,
      total: 6,
    });
    assert.deepEqual(
      breakdown.map((item) => item.key),
      ["reports", "links", "tags"]
    );
  });
});

describe("live moderation queue parity", () => {
  it("inbox total equals sum of inbox category counts", async () => {
    const counts = await getInboxCounts();
    assert.equal(counts.total, computeModerationQueueTotal(counts));
  });

  it("dashboard attention queue total matches inbox counts", async () => {
    const [inboxCounts, attention] = await Promise.all([
      getInboxCounts(),
      getAdminDashboardAttention(),
    ]);
    assert.equal(attention.queueTotal, inboxCounts.total);
  });
});
