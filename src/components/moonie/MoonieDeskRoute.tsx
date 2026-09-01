"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { MoonieAssistantView } from "@/components/moonie/MoonieAssistantView";
import {
  bumpMoonieDeskMountEpoch,
  formatMoonieDeskMountKey,
} from "@/lib/moonie/desk-mount-key";
import {
  readMoonieDeskRouteFromLocation,
  subscribeMoonieDeskLocation,
  type MoonieDeskRouteState,
} from "@/lib/moonie/conversation-url";

const EMPTY_DESK_ROUTE: MoonieDeskRouteState = {
  newChat: false,
  conversationId: undefined,
  prompt: undefined,
};

let cachedLocationKey = "";
let cachedRoute: MoonieDeskRouteState = EMPTY_DESK_ROUTE;

function readDeskRouteFromLocation(): MoonieDeskRouteState {
  const pathname = window.location.pathname;
  const search = window.location.search;
  const locationKey = `${pathname}${search}`;
  if (locationKey === cachedLocationKey) return cachedRoute;
  cachedLocationKey = locationKey;
  cachedRoute = readMoonieDeskRouteFromLocation(
    pathname,
    search,
    cachedRoute
  );
  return cachedRoute;
}

interface MoonieDeskRouteProps {
  displayName?: string;
  /** SSR-known route from `searchParams` so hydration matches the address bar. */
  serverRoute?: MoonieDeskRouteState;
}

let moonieDeskRouteMounts = 0;

/**
 * Lives in the `/moonie` layout so conversation-ID URL updates do not remount
 * the desk through `loading.tsx`. Back/Forward still re-read the address bar.
 *
 * The server snapshot is "unknown", not new-chat. Claiming `?new=1` before
 * the address bar is read would wipe a remounted `?conversation=` desk.
 */
function readDeskRouteServerSnapshot(
  serverRoute: MoonieDeskRouteState
): MoonieDeskRouteState {
  if (typeof window === "undefined") return serverRoute;
  return readMoonieDeskRouteFromLocation(
    window.location.pathname,
    window.location.search,
    serverRoute
  );
}

export function MoonieDeskRoute({
  displayName,
  serverRoute = EMPTY_DESK_ROUTE,
}: MoonieDeskRouteProps) {
  const route = useSyncExternalStore(
    subscribeMoonieDeskLocation,
    readDeskRouteFromLocation,
    () => readDeskRouteServerSnapshot(serverRoute)
  );
  const [deskMountEpoch, setDeskMountEpoch] = useState(0);

  useEffect(() => {
    const onDeskFresh = () => {
      setDeskMountEpoch((epoch) => bumpMoonieDeskMountEpoch(epoch));
    };
    window.addEventListener("moonverse:desk-fresh", onDeskFresh);
    return () => window.removeEventListener("moonverse:desk-fresh", onDeskFresh);
  }, []);

  useEffect(() => {
    moonieDeskRouteMounts += 1;
    const root = document.querySelector("[data-moonie-desk='page']");
    if (root instanceof HTMLElement) {
      root.dataset.moonieDeskMount = String(moonieDeskRouteMounts);
    }
  }, []);

  return (
    <MoonieAssistantView
      key={formatMoonieDeskMountKey(deskMountEpoch)}
      isLoggedIn
      variant="page"
      displayName={displayName}
      initialDeskNewChat={route.newChat}
      initialConversationId={route.conversationId}
      initialPrompt={route.prompt}
    />
  );
}
