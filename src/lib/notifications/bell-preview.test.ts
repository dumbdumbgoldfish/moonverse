import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  createBellPreviewLoader,
  resolveBellOpenToggle,
} from "./bell-preview";
import type { EnrichedNotificationItem } from "@/types/notification";

function notification(id: string): EnrichedNotificationItem {
  return {
    id,
    type: "DIGEST",
    message: id,
    link: null,
    actorId: null,
    metadata: null,
    isRead: false,
    createdAt: "2026-08-31T01:00:00.000Z",
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("resolveBellOpenToggle", () => {
  it("loads only when transitioning from closed to open", () => {
    assert.deepEqual(resolveBellOpenToggle(false), {
      nextOpen: true,
      shouldLoadPreview: true,
    });
    assert.deepEqual(resolveBellOpenToggle(true), {
      nextOpen: false,
      shouldLoadPreview: false,
    });
  });

  it("does not invoke onOpen from a state updater under Strict Mode double-apply", () => {
    let onOpenCalls = 0;
    const onOpen = () => {
      onOpenCalls += 1;
    };
    const updater = (current: boolean) => resolveBellOpenToggle(current).nextOpen;
    updater(false);
    updater(false);
    assert.equal(onOpenCalls, 0);
    const planned = resolveBellOpenToggle(false);
    if (planned.shouldLoadPreview) onOpen();
    assert.equal(onOpenCalls, 1);
  });
});

describe("createBellPreviewLoader", () => {
  it("does nothing until an explicit open requests a preview", async () => {
    let fetches = 0;
    const applied: string[] = [];
    createBellPreviewLoader({
      fetchPreview: async () => {
        fetches += 1;
        return { success: true, unreadCount: 1, notifications: [notification("n1")] };
      },
      onSuccess: (result) => applied.push(result.notifications[0]!.id),
    });
    assert.equal(fetches, 0);
    assert.deepEqual(applied, []);
  });

  it("deduplicates in-flight loads including Strict Mode double request", async () => {
    let fetches = 0;
    const pending = deferred<{
      success: true;
      unreadCount: number;
      notifications: EnrichedNotificationItem[];
    }>();
    const applied: number[] = [];
    const loader = createBellPreviewLoader({
      fetchPreview: () => {
        fetches += 1;
        return pending.promise;
      },
      onSuccess: (result) => applied.push(result.unreadCount),
    });

    const first = loader.requestPreview("user-a");
    const second = loader.requestPreview("user-a");
    assert.equal(first, second);
    assert.equal(fetches, 1);
    assert.equal(loader.isInFlight(), true);

    pending.resolve({
      success: true,
      unreadCount: 3,
      notifications: [notification("n1")],
    });
    await first;
    assert.deepEqual(applied, [3]);
    assert.equal(loader.isInFlight(), false);
  });

  it("does not fetch again for a close or a re-render", async () => {
    let fetches = 0;
    const loader = createBellPreviewLoader({
      fetchPreview: async () => {
        fetches += 1;
        return { success: true, unreadCount: 0, notifications: [] };
      },
      onSuccess: () => {},
    });
    await loader.requestPreview("user-a");
    assert.equal(fetches, 1);
    const closed = resolveBellOpenToggle(true);
    if (closed.shouldLoadPreview) await loader.requestPreview("user-a");
    assert.equal(fetches, 1);
  });

  it("retries after a failed load and ignores stale responses after account change", async () => {
    let fetches = 0;
    const first = deferred<
      | { success: true; unreadCount: number; notifications: EnrichedNotificationItem[] }
      | { success: false; error: string }
    >();
    const applied: string[] = [];
    const loader = createBellPreviewLoader({
      fetchPreview: () => {
        fetches += 1;
        if (fetches === 1) return first.promise;
        return Promise.resolve({
          success: true,
          unreadCount: 2,
          notifications: [notification("fresh")],
        });
      },
      onSuccess: (result, ownerId) =>
        applied.push(`${ownerId}:${result.notifications[0]?.id ?? "empty"}`),
    });

    const stale = loader.requestPreview("user-a");
    loader.invalidate();
    first.resolve({
      success: true,
      unreadCount: 9,
      notifications: [notification("stale")],
    });
    await stale;
    assert.deepEqual(applied, []);

    await loader.requestPreview("user-b");
    assert.equal(fetches, 2);
    assert.deepEqual(applied, ["user-b:fresh"]);

    const retried: string[] = [];
    const failed = createBellPreviewLoader({
      fetchPreview: async () => {
        fetches += 1;
        if (fetches === 3) return { success: false, error: "down" };
        return { success: true, unreadCount: 1, notifications: [notification("retry")] };
      },
      onSuccess: (result) => retried.push(result.notifications[0]!.id),
    });
    await failed.requestPreview("user-a");
    await failed.requestPreview("user-a");
    assert.deepEqual(retried, ["retry"]);
  });

  it("retries after a thrown fetch and ignores the failed attempt", async () => {
    let fetches = 0;
    const applied: string[] = [];
    const loader = createBellPreviewLoader({
      fetchPreview: async () => {
        fetches += 1;
        if (fetches === 1) {
          throw new Error("network");
        }
        return {
          success: true,
          unreadCount: 1,
          notifications: [notification("after-throw")],
        };
      },
      onSuccess: (result) => applied.push(result.notifications[0]!.id),
    });

    await loader.requestPreview("user-a");
    assert.equal(loader.isInFlight(), false);
    await loader.requestPreview("user-a");
    assert.equal(fetches, 2);
    assert.deepEqual(applied, ["after-throw"]);
  });

  it("does not fetch after logout", () => {
    let fetches = 0;
    const loader = createBellPreviewLoader({
      fetchPreview: async () => {
        fetches += 1;
        return { success: true, unreadCount: 0, notifications: [] };
      },
      onSuccess: () => {},
    });
    assert.equal(loader.requestPreview(undefined), undefined);
    assert.equal(fetches, 0);
  });
});

describe("NotificationDropdown open wiring", () => {
  it("does not call onOpen inside a setState updater", () => {
    const source = readFileSync(
      new URL("../../components/notifications/NotificationDropdown.tsx", import.meta.url),
      "utf8"
    );
    assert.match(source, /resolveBellOpenToggle/);
    assert.doesNotMatch(
      source,
      /setOpen\(\s*\([^)]*\)\s*=>\s*\{[^}]*onOpen/
    );
    assert.match(source, /onClick=\{\(\) => \{[\s\S]*if \(shouldLoadPreview\) onOpen\?/);
  });
});

describe("Navbar bell snapshot policy", () => {
  it("keeps unread polling separate from lazy preview loading", () => {
    const source = readFileSync(
      new URL("../../components/layout/Navbar.tsx", import.meta.url),
      "utf8"
    );
    assert.match(source, /getNotificationUnreadCountAction/);
    assert.match(source, /createBellPreviewLoader/);
    assert.match(source, /requestPreview/);
    assert.doesNotMatch(source, /pathname.*getNotificationBellSnapshotAction/);
    const pollBlock = source.slice(
      source.indexOf("async function pollUnread"),
      source.indexOf("const loadBellPreview")
    );
    assert.match(pollBlock, /getNotificationUnreadCountAction/);
    assert.doesNotMatch(pollBlock, /getNotificationBellSnapshotAction/);
  });
});
