import {
  buildMoonieDeskHref,
  deskHrefIsExplicitNewChat,
  markMoonieNewChatIntent,
  notifyMoonieDeskFresh,
  notifyMoonieDeskLocation,
} from "@/lib/moonie/conversation-url";

/**
 * Shared full-desk entry.
 * Guests stay on `/ask-moonie`. Logged-in arrivals are redirected to a
 * fresh `/moonie?new=1` desk — never an implicit latest conversation.
 */
export function moonieEntryHref(_prompt?: string): string {
  return "/ask-moonie";
}

/** Guest demo desk — 3 free recommendation turns. */
export function moonieGuestEntryHref(): string {
  return "/ask-moonie";
}

/** Logged-in full-desk entry: always an explicit new chat. */
export function moonieLoggedInEntryHref(_prompt?: string): string {
  return buildMoonieDeskHref({
    newChat: true,
  });
}

let widgetMounted = false;
let moonieEntrySignedIn = false;

/** Lets client chrome skip the guest `/ask-moonie` hop for members. */
export function setMoonieEntrySignedIn(signedIn: boolean): void {
  moonieEntrySignedIn = signedIn;
}

export function setMoonieWidgetMounted(mounted: boolean): void {
  widgetMounted = mounted;
}

/** Force a blank signed-in desk without restoring the previous conversation. */
export function openMoonieDeskFresh(userId?: string): void {
  if (typeof window === "undefined") return;
  const href = moonieLoggedInEntryHref();
  if (userId) {
    markMoonieNewChatIntent(userId);
  }
  if (window.location.pathname === "/moonie") {
    if (!deskHrefIsExplicitNewChat(href)) {
      window.location.assign(href);
      return;
    }
    if (`${window.location.pathname}${window.location.search}` !== href) {
      window.history.pushState(null, "", href);
    }
    notifyMoonieDeskFresh();
    notifyMoonieDeskLocation();
    return;
  }
  window.location.assign(href);
}

/** Page-level Moonie entry: always opens a blank chat (widget or desk). */
export function openMoonie(_prompt?: string): void {
  if (typeof window === "undefined") return;

  if (moonieEntrySignedIn && window.location.pathname === "/moonie") {
    openMoonieDeskFresh();
    return;
  }

  if (widgetMounted) {
    window.dispatchEvent(new CustomEvent("moonie:open", { detail: {} }));
    return;
  }

  window.location.assign(
    moonieEntrySignedIn ? moonieLoggedInEntryHref() : moonieEntryHref()
  );
}
