import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  shouldRestoreLatestMoonieConversation,
} from "./conversation-url";
import { moonieLoggedInEntryHref } from "./open-moonie";

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("new-chat entry survives hydration", () => {
  it("uses one explicit new-chat href for logged-in generic entry", () => {
    assert.equal(moonieLoggedInEntryHref(), "/moonie?new=1");
    const navbar = source("../../components/layout/Navbar.tsx");
    const gate = source("../../app/ask-moonie/page.tsx");
    assert.match(navbar, /moonieLoggedInEntryHref/);
    assert.match(gate, /moonieLoggedInEntryHref/);
    assert.doesNotMatch(navbar, /session \? "\/moonie" : "\/ask-moonie"/);
    const feed = source("../../components/feed/FeedHeader.tsx");
    const forYou = source("../../components/for-you/ForYouView.tsx");
    const inbox = source("../../components/notifications/NotificationInbox.tsx");
    assert.doesNotMatch(feed, /href="\/moonie"/);
    assert.doesNotMatch(forYou, /href="\/moonie"/);
    assert.match(inbox, /moonieLoggedInEntryHref/);
  });

  it("does not let empty-desk hydration pull the latest conversation", () => {
    assert.equal(
      shouldRestoreLatestMoonieConversation({
        hasDurableNewChatIntent: false,
        messageCount: 0,
      }),
      false
    );
    const page = source("../../app/moonie/page.tsx");
    const layout = source("../../app/moonie/layout.tsx");
    const deskRoute = source("../../components/moonie/MoonieDeskRoute.tsx");
    const hook = source("../../hooks/use-moonie-chat.ts");
    assert.doesNotMatch(page, /loadLatestMoonieConversationAction/);
    assert.doesNotMatch(layout, /loadLatestMoonieConversationAction/);
    assert.match(hook, /shouldRestoreLatestMoonieConversation/);
    assert.match(page, /MoonieDeskRoute/);
    assert.match(deskRoute, /initialDeskNewChat=\{route\.newChat\}/);
    assert.match(deskRoute, /formatMoonieDeskMountKey\(deskMountEpoch\)/);
    assert.doesNotMatch(
      deskRoute,
      /key=\{route\.conversationId \?\? \(route\.newChat \? "new" : "desk"\)\}/
    );
  });
});

describe("explicit fresh desk clears the visible transcript", () => {
  it("synchronously clears state when the desk URL is explicit new chat", () => {
    const hook = source("../../hooks/use-moonie-chat.ts");
    const openMoonie = source("./open-moonie.ts");
    const url = source("./conversation-url.ts");
    assert.match(hook, /applyExplicitFreshDesk/);
    assert.match(hook, /moonverse:desk-fresh/);
    assert.match(openMoonie, /notifyMoonieDeskFresh/);
    assert.match(url, /notifyMoonieDeskFresh/);
  });
});

describe("response completion preserves the transcript", () => {
  it("soft-updates the conversation URL instead of router.replace", () => {
    const hook = source("../../hooks/use-moonie-chat.ts");
    assert.match(hook, /writeMoonieDeskUrl/);
    assert.doesNotMatch(hook, /router\.replace/);
    assert.doesNotMatch(hook, /useRouter/);
    assert.match(hook, /urlNewChat: deskNewChat && !conversationId/);
    assert.match(hook, /history: "push"/);
    const view = source("../../components/moonie/MoonieAssistantView.tsx");
    const deskRoute = source("../../components/moonie/MoonieDeskRoute.tsx");
    const url = source("./conversation-url.ts");
    assert.doesNotMatch(view, /useSearchParams/);
    assert.doesNotMatch(view, /subscribeMoonieDeskLocation/);
    assert.doesNotMatch(hook, /subscribeMoonieDeskLocation/);
    assert.match(deskRoute, /subscribeMoonieDeskLocation/);
    assert.match(deskRoute, /useSyncExternalStore/);
    assert.match(deskRoute, /readMoonieDeskRouteFromLocation/);
    assert.doesNotMatch(deskRoute, /replaceMoonieDeskUrl/);
    assert.doesNotMatch(url, /__NA:\s*true/);
    assert.match(url, /replaceState\(null/);
    assert.match(url, /pushState\(null/);
    assert.match(url, /queueMicrotask/);
  });

  it("clears durable new-chat intent on first submit so the transcript is not wiped", () => {
    const hook = source("../../hooks/use-moonie-chat.ts");
    assert.match(hook, /clearMoonieNewChatIntent\(sessionUserId\)/);
    assert.match(
      hook,
      /deskRouteEnabled[\s\S]*!conversationIdRef\.current[\s\S]*hasNewChatIntent\(\)/
    );
    const newChatEffect = hook.match(
      /if \(!hasNewChatIntent\(\)\) return;[\s\S]*?sessionUserId,\s*\]\);/
    )?.[0];
    assert.ok(newChatEffect);
    assert.doesNotMatch(newChatEffect ?? "", /messages\.length/);
    assert.match(hook, /pendingConversationId != null/);
    assert.match(hook, /pendingConversationId === targetId/);
    assert.match(hook, /deskHrefIsExplicitNewChat/);
  });

  it("widget Open full desk preserves conversation id in href", () => {
    const panel = source("../../components/moonie/MoonieChatPanel.tsx");
    assert.match(panel, /buildMoonieDeskHref\(\{ conversationId \}\)/);
    assert.match(panel, /moonieLoggedInEntryHref\(\)/);
    assert.doesNotMatch(
      panel.match(/Open full desk[\s\S]*?buildMoonieDeskHref\(\{ conversationId \}\)/)?.[0] ?? "",
      /new=1/
    );
  });

  it("does not wipe a conversation desk when the address bar still has conversation", () => {
    const hook = source("../../hooks/use-moonie-chat.ts");
    const deskRoute = source("../../components/moonie/MoonieDeskRoute.tsx");
    assert.match(hook, /readMoonieDeskConversationIdFromWindow\(\)\) return/);
    assert.match(hook, /urlRoute\.conversationId/);
    assert.match(deskRoute, /readDeskRouteServerSnapshot/);
  });

  it("clears the desk when the signed-in account changes", () => {
    const hook = source("../../hooks/use-moonie-chat.ts");
    assert.match(hook, /sessionOwnerRef/);
    assert.match(hook, /sessionOwnerRef\.current === sessionUserId/);
    assert.match(hook, /clearChat\(\)/);
  });
});

describe("cross-conversation isolation", () => {
  it("keeps explicit conversation links distinct from generic new-chat entry", () => {
    const page = source("../../app/moonie/page.tsx");
    const deskRoute = source("../../components/moonie/MoonieDeskRoute.tsx");
    assert.doesNotMatch(page, /loadLatestMoonieConversationAction/);
    assert.match(deskRoute, /readMoonieDeskRouteFromLocation/);
    assert.match(deskRoute, /initialConversationId=\{route\.conversationId\}/);
    const url = source("./conversation-url.ts");
    assert.match(url, /params\.set\("conversation"/);
    assert.match(url, /MOONIE_NEW_CHAT_PARAM/);
  });
});
