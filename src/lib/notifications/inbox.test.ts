import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  notificationInboxVersion,
  notificationMatchesFilter,
} from "@/lib/notifications/inbox";
import type { EnrichedNotificationItem } from "@/types/notification";

function notification(
  id: string,
  isRead = false
): EnrichedNotificationItem {
  return {
    id,
    type: "DIGEST",
    message: `[Platform] ${id}`,
    link: null,
    actorId: null,
    metadata: null,
    isRead,
    createdAt: "2026-08-30T10:00:00.000Z",
    actorDisplayName: null,
    actorUsername: null,
    actorAvatarUrl: null,
    reviewTitle: null,
    novelTitle: null,
    coverUrl: null,
    headline: id,
    subline: null,
  };
}

describe("notificationInboxVersion", () => {
  it("changes when a mounted inbox receives an announcement", () => {
    const before = notificationInboxVersion([notification("old")], 1);
    const after = notificationInboxVersion(
      [notification("announcement"), notification("old")],
      2
    );
    assert.notEqual(after, before);
  });

  it("changes when read state changes after a mutation refresh", () => {
    assert.notEqual(
      notificationInboxVersion([notification("notice")], 1),
      notificationInboxVersion([notification("notice", true)], 0)
    );
  });
});

describe("platform announcements", () => {
  it("renders DIGEST announcements in both All and System", () => {
    assert.equal(notificationMatchesFilter("DIGEST", "all"), true);
    assert.equal(notificationMatchesFilter("DIGEST", "system"), true);
  });
});
